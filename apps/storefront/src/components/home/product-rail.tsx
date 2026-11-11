"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import type { HttpTypes } from "@medusajs/types";
import { ProductCard } from "@/components/product/product-card";

// Fade only the side that has more to show, so the edge itself says "there is more this way".
const FADE = {
  none: undefined,
  right: "linear-gradient(to right, #000 calc(100% - 56px), transparent)",
  left: "linear-gradient(to right, transparent, #000 56px)",
  both: "linear-gradient(to right, transparent, #000 56px, #000 calc(100% - 56px), transparent)",
};

/**
 * One shelf of products. No scrollbar: the next card peeks in, the far edge fades, and on desktop
 * arrow buttons appear only when there is somewhere to go. Swipe, trackpad and shift-wheel all work.
 */
export function ProductRail({ title, href, products }: { title: string; href: string; products: HttpTypes.StoreProduct[] }) {
  const track = useRef<HTMLUListElement>(null);
  const [edge, setEdge] = useState({ start: true, end: true });

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
  const scrollable = !(edge.start && edge.end);
  const fade = FADE[!edge.start && !edge.end ? "both" : !edge.end ? "right" : !edge.start ? "left" : "none"];

  return (
    <section aria-label={title} className="reveal">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-[clamp(1.4rem,1.1rem+1vw,1.75rem)] font-semibold text-navy">{title}</h2>
        <div className="flex items-center gap-3">
          <Link href={href} className="inline-flex items-center gap-1 text-[14px] font-medium text-brand hover:text-navy">
            See all <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
          {scrollable ? (
            <div className="hidden gap-2 md:flex">
              <RailButton dir={-1} disabled={edge.start} title={title} onClick={() => page(-1)} />
              <RailButton dir={1} disabled={edge.end} title={title} onClick={() => page(1)} />
            </div>
          ) : null}
        </div>
      </div>
      <ul
        ref={track}
        onScroll={measure}
        style={{ maskImage: fade, WebkitMaskImage: fade }}
        className="-mx-4 mt-4 flex snap-x snap-mandatory scroll-pl-4 gap-3 overflow-x-auto overscroll-x-contain px-4 pb-2 md:-mx-8 md:scroll-pl-8 md:gap-4 md:px-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {products.map((p) => (
          // Phones show two cards and a slice of the third, which is what tells a thumb to swipe.
          <li key={p.id} className="w-[41vw] max-w-[220px] shrink-0 snap-start md:w-[236px] md:max-w-none">
            <ProductCard product={p} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function RailButton({ dir, disabled, title, onClick }: { dir: 1 | -1; disabled: boolean; title: string; onClick: () => void }) {
  const Icon = dir === 1 ? ChevronRight : ChevronLeft;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={`Scroll ${title} ${dir === 1 ? "forward" : "back"}`}
      className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-navy transition-colors hover:bg-navy hover:text-white disabled:bg-transparent disabled:text-text-muted"
    >
      <Icon className="h-5 w-5" strokeWidth={2} aria-hidden />
    </button>
  );
}
