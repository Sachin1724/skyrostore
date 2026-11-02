import { unstable_cache } from "next/cache";
import { medusa } from "@/lib/medusa";

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
    fields: "+metadata,+categories,+collection,+variants.calculated_price,+variants.inventory_quantity",
  });
  return { products: products.map(stripInternalMetadata), count, offset, limit };
}

export async function getProducts(params?: ProductListParams) {
  // A search query is per-visitor and long-tail, so it is not worth caching.
  if (params?.q) return fetchProducts(params);

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
    fields: "+metadata,+categories,+collection,+variants.calculated_price,+variants.inventory_quantity",
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
