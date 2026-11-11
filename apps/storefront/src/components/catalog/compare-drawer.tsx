"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, ArrowRight, Check, SlidersHorizontal, Trash2 } from "lucide-react";
import type { HttpTypes } from "@medusajs/types";
import { formatPrice } from "@/lib/utils";
import { cleanName } from "@/lib/data/catalog";
import { getProductTechnicalHighlights } from "@/lib/technical-specs";
import { ProductMediaFallback } from "@/components/product/product-media-fallback";
import { QuickAdd } from "@/components/product/quick-add";

const STORAGE_KEY = "skyro_compare_items_v1";
const MAX_COMPARE = 4;

interface CompareItem {
  id: string;
  handle: string;
  title: string;
  thumbnail: string | null;
  price: number | null;
  currency: string;
  brand: string | null;
  category: string | null;
  componentType: string | null;
  highlights: string[];
  metadata: Record<string, unknown>;
  variantId?: string;
  inStock: boolean;
}

export function CompareCheckbox({ product }: { product: HttpTypes.StoreProduct }) {
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    function syncState() {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        const list: CompareItem[] = stored ? JSON.parse(stored) : [];
        setChecked(list.some((item) => item.id === product.id));
      } catch {
        // Fallback
      }
    }

    syncState();
    window.addEventListener("skyro:compare_updated", syncState);
    return () => window.removeEventListener("skyro:compare_updated", syncState);
  }, [product.id]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    e.stopPropagation();
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      let list: CompareItem[] = stored ? JSON.parse(stored) : [];

      if (e.target.checked) {
        if (list.length >= MAX_COMPARE) {
          alert(`You can compare up to ${MAX_COMPARE} items at a time.`);
          return;
        }

        const variant = product.variants?.[0];
        const price = variant?.calculated_price;
        const qty = variant?.inventory_quantity;
        const managed = variant?.manage_inventory !== false && qty != null;

        const newItem: CompareItem = {
          id: product.id,
          handle: product.handle ?? "",
          title: cleanName(product.title ?? ""),
          thumbnail: product.thumbnail ?? null,
          price: price?.calculated_amount ?? null,
          currency: price?.currency_code ?? "inr",
          brand: product.collection?.title ?? null,
          category: product.categories?.[0]?.name ? cleanName(product.categories[0].name) : null,
          componentType: (product.metadata?.component_type as string) ?? null,
          highlights: getProductTechnicalHighlights(product.metadata),
          metadata: (product.metadata as Record<string, unknown>) ?? {},
          variantId: variant?.id,
          inStock: !managed || qty! > 0,
        };

        list = [...list.filter((i) => i.id !== product.id), newItem];
      } else {
        list = list.filter((i) => i.id !== product.id);
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      setChecked(e.target.checked);
      window.dispatchEvent(new CustomEvent("skyro:compare_updated"));
    } catch {
      // Fallback
    }
  }

  return (
    <label
      onClick={(e) => e.stopPropagation()}
      className="inline-flex cursor-pointer items-center gap-1.5 rounded bg-white px-2 py-1 text-[13px] font-medium text-navy transition-all hover:bg-white"
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={handleChange}
        className="h-3.5 w-3.5 rounded border-border-strong accent-brand cursor-pointer"
      />
      <span className="select-none">Compare</span>
    </label>
  );
}

export function CompareDrawer() {
  const [items, setItems] = useState<CompareItem[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    function loadItems() {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        setItems(stored ? JSON.parse(stored) : []);
      } catch {
        // Fallback
      }
    }

    loadItems();
    window.addEventListener("skyro:compare_updated", loadItems);
    return () => window.removeEventListener("skyro:compare_updated", loadItems);
  }, []);

  function removeItem(id: string) {
    try {
      const next = items.filter((i) => i.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setItems(next);
      window.dispatchEvent(new CustomEvent("skyro:compare_updated"));
      if (next.length === 0) setModalOpen(false);
    } catch {
      // Fallback
    }
  }

  function clearAll() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setItems([]);
      window.dispatchEvent(new CustomEvent("skyro:compare_updated"));
      setModalOpen(false);
    } catch {
      // Fallback
    }
  }

  if (items.length === 0) return null;

  return (
    <>
      {/* Floating Bottom Drawer */}
      <aside
        aria-label="Product Comparison Bar"
        className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-4 rounded-xl border border-navy/20 bg-navy px-4 py-3 text-white shadow-2xl max-w-[94vw] overflow-x-auto"
      >
        <div className="flex items-center gap-2 pr-2 border-r border-white/20">
          <SlidersHorizontal className="h-4 w-4 text-brand-cyan" aria-hidden />
          <span className="text-[13px] font-bold">Compare ({items.length}/{MAX_COMPARE})</span>
        </div>

        {/* Selected Item Mini-Thumbnails */}
        <div className="flex items-center gap-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="group relative h-10 w-10 shrink-0 overflow-hidden rounded border border-white/30 bg-white"
            >
              {item.thumbnail ? (
                <Image src={item.thumbnail} alt="" fill sizes="40px" className="object-contain p-1" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[13px] font-bold text-navy">
                  UAV
                </div>
              )}
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                aria-label={`Remove ${item.title}`}
                className="absolute inset-0 flex items-center justify-center bg-navy/80 opacity-0 group-hover:opacity-100 transition-opacity text-white"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pl-2 border-l border-white/20">
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded bg-brand px-3.5 text-[13px] font-bold text-white hover:bg-brand-hover shadow-sm transition-colors"
          >
            <span>Compare Now</span>
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={clearAll}
            aria-label="Clear all comparison items"
            className="flex h-9 w-9 items-center justify-center rounded text-white/70 hover:bg-white/10 hover:text-white transition-colors"
          >
            <Trash2 className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </aside>

      {/* Side-by-Side Comparison Modal */}
      {modalOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="compare-modal-title"
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-navy/60"
        >
          <div className="absolute inset-0" onClick={() => setModalOpen(false)} aria-hidden />

          <div className="relative z-10 flex max-h-[92vh] w-full max-w-5xl flex-col card shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-surface-soft">
              <div>
                <h2 id="compare-modal-title" className="text-[18px] font-extrabold text-navy">
                  Compare parts
                </h2>
                <p className="text-[13px] text-text-muted">
                  Comparing {items.length} drone components side by side
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-navy hover:bg-border transition-colors"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>

            {/* Comparison Grid Table */}
            <div className="flex-1 overflow-auto p-6">
              <div
                className="grid gap-4"
                style={{
                  gridTemplateColumns: `repeat(${items.length}, minmax(220px, 1fr))`,
                }}
              >
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col card p-4 shadow-sm"
                  >
                    {/* Thumbnail */}
                    <div className="relative aspect-square w-full rounded bg-surface-soft overflow-hidden">
                      {item.thumbnail ? (
                        <Image
                          src={item.thumbnail}
                          alt={item.title}
                          fill
                          sizes="240px"
                          className="object-contain p-3"
                        />
                      ) : (
                        <ProductMediaFallback title={item.title} />
                      )}
                    </div>

                    {/* Metadata & Title */}
                    <div className="mt-3 min-h-[50px]">
                      {item.brand ? (
                        <span className="block text-[13px] font-bold text-brand">
                          {item.brand}
                        </span>
                      ) : null}
                      <Link
                        href={`/products/${item.handle}`}
                        className="text-[14px] font-bold text-navy hover:text-brand line-clamp-2"
                      >
                        {item.title}
                      </Link>
                    </div>

                    {/* Price & Stock */}
                    <div className="mt-3 border-t border-border pt-3">
                      <p className="text-[16px] font-extrabold tabular-nums text-navy">
                        {item.price != null ? formatPrice(item.price, item.currency) : "Price on request"}
                      </p>
                      <p className="text-[13px] text-text-muted">Incl. 18% GST</p>
                      <p className="mt-1 text-[13px] font-semibold text-success">
                        {item.inStock ? "In Stock" : "Out of Stock"}
                      </p>
                    </div>

                    {/* Technical Specifications Specs */}
                    <div className="mt-4 flex-1 border-t border-border pt-3">
                      <span className="block text-[13px] font-extrabold text-text-muted">
                        Key Specs
                      </span>
                      {item.highlights.length > 0 ? (
                        <ul className="mt-2 space-y-1.5 text-[13px] text-navy">
                          {item.highlights.map((h) => (
                            <li key={h} className="rounded bg-surface-soft px-2 py-1 font-semibold tabular-nums">
                              {h}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-2 text-[13px] text-text-muted">Standard configuration</p>
                      )}
                    </div>

                    {/* Add to Cart button */}
                    <div className="mt-5 border-t border-border pt-3">
                      <QuickAdd
                        productId={item.id}
                        variantId={item.variantId}
                        inStock={item.inStock}
                        title={item.title}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
