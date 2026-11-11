"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu } from "lucide-react";
import type { CategoryNode } from "@/lib/data/catalog";
import { categoryArt, categoryHref } from "@/lib/category-art";

/** "All categories" button and its panel: every top-level category with its picture and children. */
export function CategoryMenu({ tree }: { tree: CategoryNode[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Mouse users get hover-open with a short delay so passing over the bar does not flash the panel.
  const hover = (next: boolean) => (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setOpen(next), next ? 150 : 250);
  };

  return (
    <div ref={ref} className="relative" onPointerEnter={hover(true)} onPointerLeave={hover(false)}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls="category-panel"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-9 shrink-0 items-center gap-2 whitespace-nowrap rounded-full bg-navy px-4 text-[14px] font-medium text-white transition-colors hover:bg-brand"
      >
        <Menu className="h-[18px] w-[18px]" aria-hidden />
        All categories
      </button>
      {open ? (
        <div
          id="category-panel"
          // A followed link closes the panel (same-path links do not change the route).
          onClick={(e) => (e.target as HTMLElement).closest("a") && setOpen(false)}
          className="pop-in absolute left-0 top-[calc(100%+7px)] z-50 w-[min(960px,calc(100vw-4rem))] card p-5 shadow-[0_12px_32px_rgba(10,26,47,0.12)]"
        >
          <ul className="grid grid-cols-4 gap-x-6 gap-y-5">
            {tree.map((root) => {
              const art = categoryArt(root.name);
              return (
                <li key={root.id}>
                  <Link href={categoryHref(root)} className="group flex items-center gap-3">
                    <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-surface-soft">
                      {art ? <Image src={art} alt="" fill sizes="56px" className="object-cover transition-transform group-hover:scale-105" /> : null}
                    </span>
                    <span className="text-[15px] font-semibold text-navy group-hover:text-brand">{root.name}</span>
                  </Link>
                  {root.children.length > 0 ? (
                    <ul className="mt-2 space-y-1.5 pl-[68px] text-[14px] text-text-secondary">
                      {root.children.slice(0, 4).map((child) => (
                        <li key={child.id}>
                          <Link href={`/parts?category=${child.handle}`} className="hover:text-brand">
                            {child.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              );
            })}
          </ul>
          <div className="mt-5 flex gap-6 border-t border-border pt-4 text-[14px] font-semibold">
            <Link href="/parts" className="text-brand hover:text-navy">See all parts</Link>
            <Link href="/brands" className="text-navy hover:text-brand">Shop by brand</Link>
            <Link href="/build" className="text-navy hover:text-brand">Build your drone</Link>
            <Link href="/bulk-orders" className="text-navy hover:text-brand">Bulk orders</Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
