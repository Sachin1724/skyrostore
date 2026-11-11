import { unstable_cache } from "next/cache";
import { medusa } from "@/lib/medusa";
import { didYouMean } from "@/lib/search/did-you-mean";
import { parseQuerySpecs, wordForms } from "@/lib/search/domain-parser";

const REGION_ID = process.env.NEXT_PUBLIC_REGION_ID || "reg_01M4EBVQ7AW00SGW5JEMPAABK3";

/**
 * Catalogue reads are the hottest path on the site and the same handful of
 * queries repeat for every visitor, so they are served from the data cache
 * instead of hitting the backend — and the database — per request.
 *
 * Windows are short enough that a price or stock edit shows up quickly, and
 * the tags allow an explicit purge. Nothing customer-specific is cached here:
 * carts, orders and sessions are always fetched live.
 */
const CATALOGUE_TTL = Number(process.env.NEXT_PUBLIC_CATALOGUE_TTL || 60);
const TAXONOMY_TTL = Number(process.env.NEXT_PUBLIC_TAXONOMY_TTL || 300);

const INTERNAL_METADATA_KEYS = new Set([
  "internal_batch_code",
  "qa_test_result",
]);

function stripInternalMetadata<T extends { metadata?: Record<string, unknown> | null }>(product: T): T {
  if (!product.metadata) return product;
  const filtered: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(product.metadata)) {
    if (!INTERNAL_METADATA_KEYS.has(k)) filtered[k] = v;
  }
  return { ...product, metadata: filtered };
}

type ProductListParams = {
  limit?: number;
  offset?: number;
  category_id?: string[];
  collection_id?: string[];
  q?: string;
};

async function fetchProducts(params?: ProductListParams) {
  const { products, count, offset, limit } = await medusa.store.product.list({
    limit: params?.limit ?? 20,
    offset: params?.offset ?? 0,
    category_id: params?.category_id,
    collection_id: params?.collection_id,
    q: params?.q,
    region_id: REGION_ID,
    fields: "+metadata,*categories,+collection,+variants.calculated_price,+variants.inventory_quantity,+variants.manage_inventory,+variants.sku",
  });
  return { products: products.map(stripInternalMetadata), count, offset, limit };
}

type Product = Awaited<ReturnType<typeof fetchProducts>>["products"][number];

/** How a search reached its results, so the page can say so instead of silently showing something else. */
export type SearchNote = { kind: "corrected"; term: string } | { kind: "nearest"; label: string } | null;

// What a spec in the query says about the part type, and which metadata field to measure closeness on.
const SPEC_FALLBACK = [
  { spec: "kv", type: "MOTOR", field: "kv", label: (v: number) => `motors closest to ${v} KV` },
  { spec: "amps", type: "ESC", field: "continuous_current_a", label: (v: number) => `ESCs closest to ${v} A` },
  { spec: "cells", type: "BATTERY", field: "cell_count", label: (v: number) => `${v}S batteries and the closest packs` },
] as const;

/**
 * Ranks by how many query words a product matched, then by whether its own category is what was asked
 * for ("flight controllers" puts a flight controller above a drone that merely has one), then by spec
 * agreement ("6s 45a esc" puts a 6S, 45A+ ESC first).
 */
function rank(hits: Map<string, { product: Product; n: number }>, query: string) {
  const specs = parseQuerySpecs(query);
  const forms = query.toLowerCase().split(/\s+/).filter(Boolean).map(wordForms);
  const inCategory = (p: Product) =>
    Number(p.categories?.some((c) => forms.every((f) => f.some((form) => c.name.toLowerCase().includes(form)))) ?? false);
  const specScore = (p: Product) => {
    const m = (p.metadata ?? {}) as Record<string, unknown>;
    let s = 0;
    if (specs.kv != null && Number(m.kv) === specs.kv) s += 2;
    if (specs.cells != null && (Number(m.cell_count) === specs.cells || Number(m.cell_count_max) >= specs.cells)) s += 2;
    if (specs.amps != null && Number(m.continuous_current_a) >= specs.amps) s += 1;
    return s;
  };
  return [...hits.values()]
    .sort((a, b) => b.n - a.n || inCategory(b.product) - inCategory(a.product) || specScore(b.product) - specScore(a.product))
    .map((e) => e.product);
}

/** Phrase first; then every word in all its forms (singular, synonym, acronym), ranked by words matched. */
async function matchQuery(params: ProductListParams, query: string): Promise<Product[]> {
  const phrase = await fetchProducts({ ...params, q: query });
  const words = [...new Set(query.toLowerCase().split(/[\s,]+/).filter((w) => w.length > 1))];
  const hits = new Map<string, { product: Product; n: number }>();
  for (const p of phrase.products) hits.set(p.id, { product: p, n: words.length + 1 });
  if (phrase.products.length) return rank(hits, query);

  const perWord = await Promise.all(
    words.map(async (w) => {
      const lists = await Promise.all(wordForms(w).map((form) => fetchProducts({ ...params, q: form })));
      return new Map(lists.flatMap((l) => l.products).map((p) => [p.id, p]));
    })
  );
  for (const found of perWord)
    for (const p of found.values()) {
      const e = hits.get(p.id) ?? { product: p, n: 0 };
      e.n += 1;
      hits.set(p.id, e);
    }
  return rank(hits, query);
}

/**
 * The one search the storefront runs (results page and header dropdown). Never a dead end:
 * 1. the phrase and each word in all its forms ("motors", "props", "drone", "fc");
 * 2. typos corrected against the catalogue's own words ("pixhwak" -> "pixhawk");
 * 3. a spec with no exact part ("1950kv") falls back to the nearest parts of that type, in stock first.
 */
async function searchProducts(params: ProductListParams & { q: string }) {
  const query = params.q.trim();
  const base = { offset: 0, limit: params.limit ?? 20 };
  let products = await matchQuery(params, query);
  let note: SearchNote = null;

  if (!products.length) {
    const all = (await getProducts({ limit: 500 })).products;
    const vocabulary = all.flatMap((p) => [p.title ?? "", ...(p.categories ?? []).map((c) => c.name), p.collection?.title ?? ""]);
    const corrected = didYouMean(query, vocabulary);
    if (corrected) {
      products = await matchQuery(params, corrected);
      if (products.length) note = { kind: "corrected", term: corrected };
    }

    if (!products.length) {
      const specs = parseQuerySpecs(query);
      const rule = SPEC_FALLBACK.find((r) => specs[r.spec] != null);
      if (rule) {
        const target = specs[rule.spec]!;
        const value = (p: Product) => Number((p.metadata as Record<string, unknown> | null)?.[rule.field]);
        const stocked = (p: Product) => p.variants?.some((v) => v.inventory_quantity == null || v.inventory_quantity > 0) ?? false;
        products = all
          .filter((p) => p.metadata?.component_type === rule.type && Number.isFinite(value(p)))
          .filter((p) => !params.category_id?.length || p.categories?.some((c) => params.category_id!.includes(c.id)))
          .sort((a, b) => Number(stocked(b)) - Number(stocked(a)) || Math.abs(value(a) - target) - Math.abs(value(b) - target));
        if (products.length) note = { kind: "nearest", label: rule.label(target) };
      }
    }
  }

  return { ...base, products: products.slice(0, base.limit), count: products.length, note };
}

export async function getProducts(params?: ProductListParams): Promise<Awaited<ReturnType<typeof fetchProducts>> & { note?: SearchNote }> {
  // A search query is per-visitor and long-tail, so it is not worth caching.
  if (params?.q?.trim()) return searchProducts(params as ProductListParams & { q: string });

  return unstable_cache(
    () => fetchProducts(params),
    ["products", JSON.stringify(params ?? {})],
    { revalidate: CATALOGUE_TTL, tags: ["products"] }
  )();
}

export const getProduct = (id: string) =>
  unstable_cache(() => fetchProduct(id), ["product", id], {
    revalidate: CATALOGUE_TTL,
    tags: ["products", `product:${id}`],
  })();

async function fetchProduct(id: string) {
  const { product } = await medusa.store.product.retrieve(id, {
    region_id: REGION_ID,
    fields: "+metadata,+variants.calculated_price,+variants.inventory_quantity",
  });
  return stripInternalMetadata(product);
}

export const getProductByHandle = (handle: string) =>
  unstable_cache(() => fetchProductByHandle(handle), ["product-handle", handle], {
    revalidate: CATALOGUE_TTL,
    tags: ["products", `product-handle:${handle}`],
  })();

async function fetchProductByHandle(handle: string) {
  const { products } = await medusa.store.product.list({
    handle,
    limit: 1,
    region_id: REGION_ID,
    fields: "+metadata,*categories,+collection,+variants.calculated_price,+variants.inventory_quantity",
  });
  const p = products[0] ?? null;
  return p ? stripInternalMetadata(p) : null;
}

export const getCategories = () =>
  unstable_cache(
    async () => {
      const { product_categories } = await medusa.store.category.list({
        include_descendants_tree: true,
      });
      return product_categories;
    },
    ["categories"],
    { revalidate: TAXONOMY_TTL, tags: ["taxonomy"] }
  )();

export const getCollections = () =>
  unstable_cache(
    async () => {
      const { collections } = await medusa.store.collection.list();
      return collections;
    },
    ["collections"],
    { revalidate: TAXONOMY_TTL, tags: ["taxonomy"] }
  )();
