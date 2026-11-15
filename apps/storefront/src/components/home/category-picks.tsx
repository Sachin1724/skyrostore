import Link from "next/link";
import Image from "next/image";
import type { HttpTypes } from "@medusajs/types";
import type { CategoryNode } from "@/lib/data/catalog";
import { categoryHref } from "@/lib/category-art";
import { cleanName, formatPrice } from "@/lib/utils";
import { ProductMediaFallback } from "@/components/product/product-media-fallback";

type Pick = { node: CategoryNode; items: HttpTypes.StoreProduct[] };

/**
 * One card per category holding up to four of its products, the way large stores fill a home page:
 * many products per screen, each card a way into its category. A category with one product shows it large.
 */
export function CategoryPicks({ picks }: { picks: Pick[] }) {
  if (picks.length === 0) return null;
  return (
    <section aria-labelledby="picks-heading">
      <h2 id="picks-heading" className="text-[clamp(1.4rem,1.1rem+1vw,1.75rem)] font-semibold text-navy">
        Picks by category
      </h2>
      <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {picks.map(({ node, items }) => {
          const shown = items.slice(0, 4);
          const single = shown.length === 1;
          return (
            <li key={node.id} className="flex flex-col rounded-xl bg-white p-4">
              <h3 className="text-[17px] font-semibold text-navy">{node.name}</h3>
              <ul className={`mt-3 grid flex-1 gap-3 ${single ? "grid-cols-1" : "grid-cols-2"}`}>
                {shown.map((p) => {
                  const price = p.variants?.[0]?.calculated_price;
                  const title = cleanName(p.title ?? "");
                  return (
                    <li key={p.id}>
                      <Link href={`/products/${p.handle}`} className="group block">
                        <span className="relative block aspect-square overflow-hidden rounded-lg bg-surface-soft">
                          {p.thumbnail ? (
                            <Image src={p.thumbnail} alt="" fill sizes={single ? "(min-width: 1024px) 22vw, 90vw" : "(min-width: 1024px) 11vw, 45vw"} className="object-contain p-2 transition-transform duration-200 group-hover:scale-[1.03]" />
                          ) : (
                            <ProductMediaFallback componentType={p.metadata?.component_type as string | undefined} title={title} />
                          )}
                        </span>
                        <span className="mt-1.5 block truncate text-[13px] text-navy group-hover:text-brand">{title}</span>
                        {price?.calculated_amount != null ? (
                          <span className="block text-[13px] font-semibold tabular-nums text-navy">{formatPrice(price.calculated_amount, price.currency_code ?? "inr")}</span>
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
              <Link href={categoryHref(node)} className="mt-3 inline-flex min-h-10 items-center text-[14px] font-semibold text-brand hover:text-navy">
                See all {node.name.toLowerCase()}
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
