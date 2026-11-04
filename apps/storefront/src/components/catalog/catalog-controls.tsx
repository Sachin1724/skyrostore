"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";

/** Sort select: navigates on change, so no Apply button is needed. */
export function SortSelect({ value, options }: { value: string; options: { value: string; label: string; href: string }[] }) {
  const router = useRouter();
  return (
    <label className="flex items-center gap-2 text-[14px] text-text-secondary">
      Sort by
      <select
        value={value}
        onChange={(e) => router.push(options.find((o) => o.value === e.target.value)!.href, { scroll: false })}
        className="h-10 rounded-md border border-border-strong bg-white px-2.5 text-[14px] font-semibold text-navy"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}

/**
 * Filter rail. Inline beside the results on large screens; on phones the same markup
 * becomes a full-screen sheet behind a "Filters" button, closed by any link or submit inside it.
 */
export function FilterPanel({ activeCount, resultCount, children }: { activeCount: number; resultCount: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const close = (e: React.SyntheticEvent) => {
    const t = e.target as HTMLElement;
    if (e.type === "submit" || t.closest("a")) setOpen(false);
  };
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-controls="filters"
        className="inline-flex h-10 items-center gap-2 rounded-md border border-border-strong bg-white px-3.5 text-[14px] font-semibold text-navy lg:hidden"
      >
        <SlidersHorizontal className="h-4 w-4" aria-hidden />
        Filters{activeCount ? <span className="tabular-nums"> ({activeCount})</span> : null}
      </button>
      <aside
        id="filters"
        aria-label="Filters"
        onClick={close}
        onSubmit={close}
        className={`${open ? "rise-in fixed inset-0 z-[60] flex flex-col overscroll-contain bg-white" : "hidden"} lg:static lg:z-auto lg:block lg:rounded-lg lg:border lg:border-border lg:bg-white`}
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4 lg:hidden">
          <h2 className="text-[16px] font-bold">Filters</h2>
          <button type="button" onClick={() => setOpen(false)} aria-label="Close filters" className="flex h-11 w-11 items-center justify-center">
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 lg:overflow-visible">{children}</div>
        <div className="shrink-0 border-t border-border p-4 pb-[max(1rem,env(safe-area-inset-bottom))] lg:hidden">
          <button type="button" onClick={() => setOpen(false)} className="h-12 w-full rounded-md bg-brand text-[16px] font-semibold text-white">
            Show {resultCount} {resultCount === 1 ? "Result" : "Results"}
          </button>
        </div>
      </aside>
    </>
  );
}
