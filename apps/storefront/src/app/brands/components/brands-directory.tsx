"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, ArrowRight, ShieldCheck, Layers } from "lucide-react";
import type { BrandInfo } from "@/lib/data/catalog";

interface BrandWithMeta extends BrandInfo {
  count: number;
  categories: string[];
}

interface BrandsDirectoryProps {
  brands: BrandWithMeta[];
}

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export function BrandsDirectory({ brands }: BrandsDirectoryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLetter, setSelectedLetter] = useState<string>("ALL");

  // Available letters that actually contain brands
  const activeLetters = useMemo(() => {
    const set = new Set<string>();
    brands.forEach((b) => {
      const first = b.title.charAt(0).toUpperCase();
      if (ALPHABET.includes(first)) {
        set.add(first);
      } else {
        set.add("#");
      }
    });
    return set;
  }, [brands]);

  // Filtered brands
  const filteredBrands = useMemo(() => {
    return brands.filter((b) => {
      const matchesSearch =
        b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.categories.some((c) => c.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      if (selectedLetter === "ALL") return true;

      const first = b.title.charAt(0).toUpperCase();
      if (selectedLetter === "#") {
        return !ALPHABET.includes(first);
      }
      return first === selectedLetter;
    });
  }, [brands, searchQuery, selectedLetter]);

  return (
    <div className="space-y-8">
      {/* Search and A-Z Jump Bar Controls */}
      <div className="flex flex-col gap-5 rounded-xl border border-border bg-white p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" aria-hidden />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search manufacturers by name or category..."
              className="h-11 w-full rounded-md border border-border bg-surface-soft pl-10 pr-4 text-[14px] text-navy placeholder:text-text-muted focus:border-brand focus:bg-white focus:outline-none"
            />
          </div>

          <div className="text-[13px] font-bold text-text-muted tabular-nums">
            Showing {filteredBrands.length} of {brands.length} manufacturers
          </div>
        </div>

        {/* A-Z Index Navigation */}
        <div className="border-t border-border pt-4">
          <div className="flex flex-wrap items-center gap-1.5" role="toolbar" aria-label="Alphabetical jump filter">
            <button
              type="button"
              onClick={() => setSelectedLetter("ALL")}
              aria-pressed={selectedLetter === "ALL"}
              className={`h-8 rounded px-2.5 text-[12px] font-bold transition-all ${
                selectedLetter === "ALL"
                  ? "bg-navy text-white shadow-sm"
                  : "bg-surface-soft text-text-secondary hover:bg-border"
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => activeLetters.has("#") && setSelectedLetter("#")}
              disabled={!activeLetters.has("#")}
              aria-pressed={selectedLetter === "#"}
              className={`h-8 w-8 rounded text-[12px] font-bold transition-all ${
                selectedLetter === "#"
                  ? "bg-navy text-white shadow-sm"
                  : activeLetters.has("#")
                  ? "bg-surface-soft text-text-secondary hover:bg-border cursor-pointer"
                  : "text-text-muted/40 cursor-not-allowed"
              }`}
            >
              #
            </button>
            {ALPHABET.map((letter) => {
              const hasItems = activeLetters.has(letter);
              const isSelected = selectedLetter === letter;
              return (
                <button
                  key={letter}
                  type="button"
                  onClick={() => hasItems && setSelectedLetter(letter)}
                  disabled={!hasItems}
                  aria-pressed={isSelected}
                  className={`h-8 w-8 rounded text-[12px] font-bold transition-all ${
                    isSelected
                      ? "bg-navy text-white shadow-sm"
                      : hasItems
                      ? "bg-surface-soft text-text-secondary hover:bg-border cursor-pointer"
                      : "text-text-muted/30 cursor-not-allowed"
                  }`}
                >
                  {letter}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Brands Card Grid */}
      {filteredBrands.length === 0 ? (
        <div className="rounded-xl border border-border bg-white px-6 py-16 text-center shadow-sm">
          <p className="text-[17px] font-bold text-navy">No manufacturers match your filter</p>
          <p className="mt-1.5 text-[14px] text-text-secondary">
            Try clearing the search query or selecting &quot;All&quot; from the alphabet bar.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setSelectedLetter("ALL");
            }}
            className="mt-4 inline-flex h-10 items-center rounded-md bg-brand px-5 text-[13px] font-bold text-white hover:bg-navy transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {filteredBrands.map((b) => (
            <Link
              key={b.id}
              href={`/brands/${b.handle}`}
              className="group flex flex-col justify-between rounded-xl border border-border bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-brand hover:shadow-md"
            >
              <div>
                {/* Brand Header & Logo/Monogram */}
                <div className="flex items-center justify-between">
                  {b.logo ? (
                    <div className="relative h-14 w-14 overflow-hidden rounded-lg border border-border bg-surface-soft p-1.5">
                      <Image
                        src={b.logo}
                        alt={b.title}
                        fill
                        sizes="56px"
                        className="object-contain"
                      />
                    </div>
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-border bg-brand-soft text-[20px] font-extrabold text-brand">
                      {b.title.slice(0, 2).toUpperCase()}
                    </div>
                  )}

                  <span className="rounded-full bg-surface-soft px-2.5 py-1 text-[11px] font-bold tabular-nums text-text-muted">
                    {b.count} {b.count === 1 ? "component" : "components"}
                  </span>
                </div>

                {/* Title */}
                <h2 className="mt-4 text-[17px] font-extrabold text-navy group-hover:text-brand transition-colors">
                  {b.title}
                </h2>

                {/* Hardware Categories */}
                {b.categories.length > 0 ? (
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {b.categories.slice(0, 3).map((cat) => (
                      <span
                        key={cat}
                        className="rounded bg-surface-soft px-2 py-0.5 text-[11px] font-semibold text-text-secondary"
                      >
                        {cat}
                      </span>
                    ))}
                    {b.categories.length > 3 ? (
                      <span className="rounded bg-surface-soft px-1.5 py-0.5 text-[11px] font-bold text-text-muted">
                        +{b.categories.length - 3}
                      </span>
                    ) : null}
                  </div>
                ) : (
                  <p className="mt-2 text-[12px] text-text-muted">Certified hardware partner</p>
                )}
              </div>

              {/* Card Footer */}
              <div className="mt-5 flex items-center justify-between border-t border-border/60 pt-3 text-[13px] font-bold text-brand">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
                  <span>Authorized Store</span>
                </span>
                <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  <span>Browse</span>
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
