"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
}

/**
 * Custom-styled dropdown so every select on the storefront looks the same —
 * a native <select>'s open panel is OS-themed and can't be styled with CSS.
 * Keyboard and click-outside behave like a native listbox (WAI-ARIA combobox pattern).
 */
export function Select({
  value,
  options,
  onChange,
  ariaLabel,
  className = "",
}: {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  ariaLabel?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(() => Math.max(0, options.findIndex((o) => o.value === value)));
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const selected = options.find((o) => o.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  useEffect(() => {
    if (open) setActiveIndex(Math.max(0, options.findIndex((o) => o.value === value)));
  }, [open, value, options]);

  useEffect(() => {
    if (open) listRef.current?.children[activeIndex]?.scrollIntoView({ block: "nearest" });
  }, [open, activeIndex]);

  function commit(index: number) {
    const opt = options[index];
    if (opt) onChange(opt.value);
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      setOpen(true);
      return;
    }
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(options.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      commit(activeIndex);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === "Tab") {
      setOpen(false);
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={onKeyDown}
        className={`flex h-10 items-center justify-between gap-2 rounded-md border border-border-strong bg-white px-2.5 text-[14px] font-semibold text-navy transition-colors hover:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${className}`}
      >
        <span className="truncate">{selected?.label}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-text-muted transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>

      {open ? (
        <ul
          ref={listRef}
          role="listbox"
          aria-label={ariaLabel}
          tabIndex={-1}
          className="absolute left-0 top-full z-20 mt-1.5 max-h-72 w-full min-w-[10rem] overflow-y-auto rounded-md border border-border bg-white py-1 shadow-lg"
        >
          {options.map((o, i) => (
            <li
              key={o.value}
              role="option"
              aria-selected={o.value === value}
              onMouseEnter={() => setActiveIndex(i)}
              onClick={() => commit(i)}
              className={`flex cursor-pointer items-center justify-between gap-2 px-3 py-2 text-[14px] ${
                i === activeIndex ? "bg-surface-soft" : ""
              } ${o.value === value ? "font-semibold text-navy" : "text-text-secondary"}`}
            >
              {o.label}
              {o.value === value ? <Check className="h-3.5 w-3.5 text-brand" aria-hidden /> : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
