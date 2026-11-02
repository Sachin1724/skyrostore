import { NextRequest, NextResponse } from "next/server";

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
    const url = new URL(`${BASE}/store/products`);
    url.searchParams.set("q", query);
    url.searchParams.set("limit", String(MAX_RESULTS));
    url.searchParams.set("region_id", REGION_ID);
    url.searchParams.set(
      "fields",
      "id,title,handle,thumbnail,+categories.name,+collection.title,+variants.calculated_price,+variants.inventory_quantity,+variants.manage_inventory"
    );

    const res = await fetch(url.toString(), {
      headers: { "x-publishable-api-key": PK },
      // Short shared cache: the same prefixes are typed constantly, and product
      // names change rarely. Never cached per customer — nothing private here.
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      return NextResponse.json({ suggestions: [], query });
    }

    const { products } = await res.json();

    const suggestions: Suggestion[] = (products || []).map((product: any) => {
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

    return NextResponse.json({ suggestions, query });
  } catch {
    // Search must degrade to the full results page, never to an error.
    return NextResponse.json({ suggestions: [], query });
  }
}
