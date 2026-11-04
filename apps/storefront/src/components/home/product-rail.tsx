"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import type { HttpTypes } from "@medusajs/types";
import { ProductCard } from "@/components/product/product-card";

/** One shelf of products. Scrolls with touch, trackpad, or the arrow buttons; snaps card by card. */
export function ProductRail({ title, href, products }: { title: string; href: string; products: HttpTypes.StoreProduct[] }) {
  const track = useRef<HTMLUListElement>(null);
  const [edge, setEdge] = useState({ start: true, end: false });

  const measure = () => {
    const el = track.current;
    if (el) setEdge({ start: el.scrollLeft < 8, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 8 });
  };
  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [products.length]);

  if (products.length === 0) return null;
  const page = (dir: 1 | -1) => track.current?.scrollBy({ left: dir * track.current.clientWidth * 0.85, behavior: "smooth" });

  return (
    <section aria-label={title} className="reveal">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-[clamp(1.4rem,1.1rem+1vw,1.75rem)] font-semibold text-navy">{title}</h2>
        <div className="flex items-center gap-3">
          <Link href={href} className="inline-flex items-center gap-1 text-[14px] font-medium text-brand hover:text-navy">
            View all <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
          <div className="hidden gap-1.5 md:flex">
            <button type="button" onClick={() => page(-1)} disabled={edge.start} aria-label={`Scroll ${title} back`} className="btn btn-secondary btn-icon btn-sm !h-9 !w-9">
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </button>
            <button type="button" onClick={() => page(1)} disabled={edge.end} aria-label={`Scroll ${title} forward`} className="btn btn-secondary btn-icon btn-sm !h-9 !w-9">
              <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>
      </div>
      <ul
        ref={track}
        onScroll={measure}
        className={`rail ${edge.end ? "rail-end" : ""} -mx-4 mt-4 flex snap-x scroll-pl-4 gap-3 overflow-x-auto overscroll-x-contain px-4 pb-4 md:-mx-8 md:scroll-pl-8 md:gap-4 md:px-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden`}
      >
        {products.map((p) => (
          <li key={p.id} className="w-[200px] shrink-0 snap-start md:w-[236px]">
            <ProductCard product={p} />
          </li>
        ))}
      </ul>
    </section>
  );
}
