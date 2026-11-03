import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import type { CategoryNode } from "@/lib/data/catalog";

const TILE_ART: [RegExp, string][] = [
  [/uav|drone/i, "cat-complete-uavs"],
  [/flight|autopilot/i, "cat-flight-controllers"],
  [/esc|speed/i, "cat-escs"],
  [/motor|propulsion/i, "cat-motors"],
  [/prop/i, "cat-propellers"],
  [/batter|lipo/i, "cat-batteries"],
  [/gps|gnss|telemetry/i, "cat-gps"],
  [/frame/i, "cat-frames"],
];

const tileArt = (name: string) => TILE_ART.find(([re]) => re.test(name))?.[1];

interface CategoryItem {
  node: CategoryNode;
  count: number;
}

interface CategoryGridProps {
  categories: CategoryItem[];
}

export function CategoryGrid({ categories }: CategoryGridProps) {
  if (categories.length === 0) return null;

  return (
    <section aria-labelledby="shop-category-heading">
      <div className="flex items-end justify-between border-b border-border pb-3.5">
        <div>
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand">
            Hardware Taxonomy
          </span>
          <h2
            id="shop-category-heading"
            className="text-[clamp(1.4rem,1.1rem+1vw,1.75rem)] font-extrabold tracking-[-0.02em] text-navy"
          >
            Shop by Category
          </h2>
        </div>
        <Link
          href="/parts"
          className="inline-flex items-center gap-1 text-[13px] font-bold text-brand hover:text-navy transition-colors"
        >
          View All Parts
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8">
        {categories.map(({ node, count }) => {
          const art = tileArt(node.name);
          const href = /uav|drone/i.test(node.name) ? "/uavs" : `/parts?category=${node.handle}`;

          return (
            <Link
              key={node.id}
              href={href}
              className="group flex flex-col items-center justify-between rounded-lg border border-border bg-white p-3.5 text-center transition-all duration-200 hover:-translate-y-0.5 hover:border-brand hover:shadow-sm"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-soft transition-transform duration-200 group-hover:scale-105 group-hover:bg-brand-soft">
                {art ? (
                  <Image
                    src={`/images/products/${art}.png`}
                    alt=""
                    width={38}
                    height={38}
                    className="object-contain"
                  />
                ) : (
                  <span className="text-[12px] font-bold text-brand">
                    {node.name.slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>

              <div className="mt-3">
                <span className="block text-[13px] font-bold leading-tight text-navy group-hover:text-brand transition-colors">
                  {node.name}
                </span>
                <span className="mt-1 block text-[11px] font-semibold tabular-nums text-text-muted">
                  {count} {count === 1 ? "item" : "items"}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
