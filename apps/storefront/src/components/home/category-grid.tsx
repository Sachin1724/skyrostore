import Link from "next/link";
import Image from "next/image";
import type { CategoryNode } from "@/lib/data/catalog";
import { categoryHref } from "@/lib/category-art";
import { ProductMediaFallback } from "@/components/product/product-media-fallback";

interface CategoryItem {
  node: CategoryNode;
  count: number;
  /** A product photo from this category; the tile shows an icon when the category has none. */
  image?: string | null;
}

/**
 * Every category at once, never a sideways scroller: eight is few enough to show whole. Phones get a
 * compact 4 × 2 grid (picture over name, as large shopping apps do), wider screens the full cards.
 */
export function CategoryGrid({ categories }: { categories: CategoryItem[] }) {
  if (categories.length === 0) return null;

  return (
    <section aria-labelledby="shop-category-heading">
      <div className="flex items-baseline justify-between">
        <h2 id="shop-category-heading" className="text-[clamp(1.4rem,1.1rem+1vw,1.75rem)] font-extrabold tracking-[-0.02em] text-navy">
          Shop by category
        </h2>
        <Link href="/parts" className="text-[14px] font-semibold text-brand hover:text-navy">
          See all parts
        </Link>
      </div>

      <ul className="mt-4 grid grid-cols-4 gap-x-2 gap-y-4 md:gap-3 xl:grid-cols-8">
        {categories.map(({ node, count, image }) => {
          return (
            <li key={node.id}>
              <Link href={categoryHref(node)} className="group flex h-full flex-col md:overflow-hidden md:rounded-xl md:bg-white">
                <span className="relative block aspect-square overflow-hidden rounded-xl bg-surface-muted md:rounded-none">
                  {image ? (
                    <Image src={image} alt="" fill sizes="(min-width: 1280px) 12vw, 25vw" className="object-contain p-2 transition-transform duration-300 group-hover:scale-105" />
                  ) : (
                    <ProductMediaFallback category={node.name} title={node.name} />
                  )}
                </span>
                <span className="block pt-1.5 text-center md:px-3 md:py-2.5 md:text-left">
                  <span className="line-clamp-2 text-[12px] font-medium leading-tight text-navy group-hover:text-brand md:line-clamp-1 md:text-[14px] md:font-semibold">
                    {node.name}
                  </span>
                  <span className="mt-0.5 hidden text-[13px] tabular-nums text-text-secondary md:block">
                    {count} {count === 1 ? "item" : "items"}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
