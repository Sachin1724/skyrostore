import { NextRequest, NextResponse } from "next/server";
import { getBrands, getCategoryTree, cleanName, type CategoryNode } from "@/lib/data/catalog";
import { expandAcronyms, parseQuerySpecs } from "@/lib/search/domain-parser";

const BASE = process.env.NEXT_PUBLIC_MEDUSA_URL || "http://localhost:9000";
const PK = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "";
const REGION_ID = process.env.NEXT_PUBLIC_REGION_ID || "reg_01M4EBVQ7AW00SGW5JEMPAABK3";

const MAX_RESULTS = 6;
const MIN_QUERY = 2;

type Suggestion = {
  id: string;
  title: string;
  handle: string;
  thumbnail: string | null;
  category: string | null;
  brand: string | null;
  price: number | null;
  currency_code: string | null;
  in_stock: boolean;
};

/**
 * Type-ahead product suggestions for the header search.
 *
 * Only published, in-channel products are returned, because Medusa's store API
 * already scopes to the publishable key's sales channel. Prices come from the
 * region so the dropdown never shows a figure the product page contradicts.
 */
export async function GET(request: NextRequest) {
  const query = (request.nextUrl.searchParams.get("q") || "").trim();

  if (query.length < MIN_QUERY) {
    return NextResponse.json({ suggestions: [], query });
  }

  try {
    const fields =
      "id,title,handle,thumbnail,metadata,+categories.name,+collection.title,+variants.calculated_price,+variants.inventory_quantity,+variants.manage_inventory";
    // Short shared cache: the same prefixes are typed constantly. Nothing private here.
    const find = async (term: string): Promise<any[]> => {
      const url = new URL(`${BASE}/store/products`);
      url.searchParams.set("q", term);
      url.searchParams.set("limit", String(MAX_RESULTS));
      url.searchParams.set("region_id", REGION_ID);
      url.searchParams.set("fields", fields);
      const res = await fetch(url.toString(), { headers: { "x-publishable-api-key": PK }, next: { revalidate: 60 } });
      return res.ok ? ((await res.json()).products ?? []) : [];
    };

    let products = await find(query);
    // "6s battery" matches no single title as a phrase: search each word, best match first.
    const words = [...new Set(query.toLowerCase().split(/[\s,]+/).filter((w) => w.length > 1))];
    if (products.length === 0 && words.length > 1) {
      const hits = new Map<string, { p: any; n: number }>();
      for (const list of await Promise.all(words.map(find)))
        for (const p of list) hits.set(p.id, { p, n: (hits.get(p.id)?.n ?? 0) + 1 });
      products = [...hits.values()].sort((a, b) => b.n - a.n).map((e) => e.p).slice(0, MAX_RESULTS);
    }
    // "fc", "esc" etc have no title match of their own — try the engineering phrase too.
    if (products.length === 0) {
      const expanded = expandAcronyms(query);
      for (const term of expanded) {
        products = await find(term);
        if (products.length) break;
      }
    }

    // Boost results whose own spec metadata matches what the query asked for
    // (e.g. "6s 45a esc" ranks a 45A+ 6S-rated ESC above a 3S 20A one).
    const parsedSpecs = parseQuerySpecs(query);
    if (Object.keys(parsedSpecs).length) {
      const specScore = (p: any) => {
        const meta = p.metadata || {};
        let score = 0;
        if (parsedSpecs.kv != null && Number(meta.kv) === parsedSpecs.kv) score += 2;
        if (parsedSpecs.cells != null && (Number(meta.cell_count) === parsedSpecs.cells || Number(meta.cell_count_max) >= parsedSpecs.cells)) score += 2;
        if (parsedSpecs.amps != null && Number(meta.continuous_current_a) >= parsedSpecs.amps) score += 1;
        return score;
      };
      products = [...products].sort((a, b) => specScore(b) - specScore(a));
    }

    const suggestions: Suggestion[] = products.map((product: any) => {
      const variant = product.variants?.[0];
      const price = variant?.calculated_price;
      const managed = product.variants?.some((v: any) => v.manage_inventory);
      const stocked = product.variants?.some(
        (v: any) => !v.manage_inventory || Number(v.inventory_quantity ?? 0) > 0
      );

      return {
        id: product.id,
        title: (product.title || "").replace("[DEV] ", ""),
        handle: product.handle,
        thumbnail: product.thumbnail ?? null,
        category: product.categories?.[0]?.name?.replace("[DEV] ", "") ?? null,
        brand: product.collection?.title ?? null,
        price: price?.calculated_amount ?? null,
        currency_code: price?.currency_code ?? null,
        in_stock: managed ? Boolean(stocked) : true,
      };
    });

    // Places to go: categories and brands whose name contains what was typed.
    const q = query.toLowerCase();
    const hit = (name: string) => name.toLowerCase().includes(q) || words.some((w) => name.toLowerCase().includes(w));
    const flat = (nodes: CategoryNode[]): CategoryNode[] => nodes.flatMap((n) => [n, ...flat(n.children)]);
    const [tree, brands] = await Promise.all([getCategoryTree().catch(() => []), getBrands().catch(() => [])]);
    const places = [
      ...flat(tree).filter((c) => hit(c.name)).map((c) => ({ kind: "Category", label: cleanName(c.name), href: `/parts?category=${c.handle}` })),
      ...brands.filter((b) => hit(b.title)).map((b) => ({ kind: "Brand", label: b.title, href: `/brands/${b.handle}` })),
    ].slice(0, 4);

    return NextResponse.json({ suggestions, places, query });
  } catch {
    // Search must degrade to the full results page, never to an error.
    return NextResponse.json({ suggestions: [], query });
  }
}
