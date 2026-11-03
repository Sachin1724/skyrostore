"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import type { CategoryNode } from "@/lib/data/catalog";

/** "All categories" button and its panel: every top-level category with its children. */
export function CategoryMenu({ tree }: { tree: CategoryNode[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
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

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="category-panel"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-9 items-center gap-2 rounded-md bg-navy px-3.5 text-white transition-colors hover:bg-brand"
      >
        <Menu className="h-[18px] w-[18px]" aria-hidden />
        All categories
      </button>
      {open ? (
        <div
          id="category-panel"
          // A followed link closes the panel (same-path links do not change the route).
          onClick={(e) => (e.target as HTMLElement).closest("a") && setOpen(false)}
          className="absolute left-0 top-[calc(100%+7px)] z-50 grid w-[min(880px,calc(100vw-4rem))] grid-cols-3 gap-x-8 gap-y-6 rounded-lg border border-border bg-white p-6 shadow-[0_12px_32px_rgba(10,26,47,0.12)]"
        >
          {tree.map((root) => (
            <div key={root.id}>
              <Link href={`/parts?category=${root.handle}`} className="text-[15px] font-bold text-navy hover:text-brand">
                {root.name}
              </Link>
              {root.children.length > 0 ? (
                <ul className="mt-2 space-y-1.5 text-[14px] font-medium text-text-secondary">
                  {root.children.map((child) => (
                    <li key={child.id}>
                      <Link href={`/parts?category=${child.handle}`} className="hover:text-brand">
                        {child.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          ))}
          <Link href="/parts" className="col-span-3 border-t border-border pt-4 text-[14px] font-semibold text-brand hover:text-navy">
            Browse all parts
          </Link>
        </div>
      ) : null}
    </div>
  );
}
