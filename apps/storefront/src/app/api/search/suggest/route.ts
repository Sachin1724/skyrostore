import { NextRequest, NextResponse } from "next/server";
import { getBrands, getCategoryTree, cleanName, type CategoryNode } from "@/lib/data/catalog";
import { getProducts } from "@/lib/data/products";
import { categoryHref } from "@/lib/category-art";


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
    // The same search the results page runs, so the dropdown and the page never disagree.
    const { products, note } = await getProducts({ q: query, limit: MAX_RESULTS });
    const words = [...new Set(query.toLowerCase().split(/[\s,]+/).filter((w) => w.length > 1))];

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
      ...flat(tree).filter((c) => hit(c.name)).map((c) => ({ kind: "Category", label: cleanName(c.name), href: categoryHref(c) })),
      ...brands.filter((b) => hit(b.title)).map((b) => ({ kind: "Brand", label: b.title, href: `/brands/${b.handle}` })),
    ].slice(0, 4);

    return NextResponse.json({ suggestions, places, query, note: note ?? null });
  } catch {
    // Search must degrade to the full results page, never to an error.
    return NextResponse.json({ suggestions: [], query });
  }
}
