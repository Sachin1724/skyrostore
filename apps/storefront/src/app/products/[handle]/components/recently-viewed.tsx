"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Clock, Trash2 } from "lucide-react";
import type { HttpTypes } from "@medusajs/types";
import { formatPrice } from "@/lib/utils";
import { ProductMediaFallback } from "@/components/product/product-media-fallback";

const STORAGE_KEY = "skyro_recently_viewed_v1";
const MAX_ITEMS = 10;

interface ViewedItem {
  id: string;
  handle: string;
  title: string;
  thumbnail: string | null;
  price: number | null;
  currency: string;
  brand: string | null;
}

export function RecentlyViewed({ currentProduct }: { currentProduct?: HttpTypes.StoreProduct }) {
  const [items, setItems] = useState<ViewedItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      let list: ViewedItem[] = stored ? JSON.parse(stored) : [];

      if (currentProduct?.id) {
        const variant = currentProduct.variants?.[0];
        const price = variant?.calculated_price;
        const brandTitle = currentProduct.collection?.title ?? null;

        const currentItem: ViewedItem = {
          id: currentProduct.id,
          handle: currentProduct.handle ?? "",
          title: currentProduct.title.replace("[DEV] ", ""),
          thumbnail: currentProduct.thumbnail ?? null,
          price: price?.calculated_amount ?? null,
          currency: price?.currency_code ?? "inr",
          brand: brandTitle,
        };

        // Prepend current product, deduplicating by ID
        list = [currentItem, ...list.filter((i) => i.id !== currentProduct.id)].slice(0, MAX_ITEMS);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      }

      // Display list excluding the active product currently being viewed
      const displayList = currentProduct?.id ? list.filter((i) => i.id !== currentProduct.id) : list;
      setItems(displayList);
    } catch {
      // Graceful fallback for private modes or storage quotas
    }
  }, [currentProduct?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  function clearHistory() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setItems([]);
    } catch {
      // Ignored
    }
  }

  if (!mounted || items.length === 0) return null;

  return (
    <section aria-labelledby="recently-viewed-heading" className="mt-14 border-t border-border pt-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-brand" aria-hidden />
          <h2 id="recently-viewed-heading" className="text-[20px] font-extrabold tracking-[-0.02em] text-navy">
            Recently Viewed
          </h2>
        </div>
        <button
          type="button"
          onClick={clearHistory}
          className="flex items-center gap-1.5 text-[12px] font-semibold text-text-muted hover:text-error transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden /> Clear History
        </button>
      </div>

      <div className="mt-5 flex gap-4 overflow-x-auto pb-3 [scrollbar-width:none]">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/products/${item.handle}`}
            className="group w-44 shrink-0 rounded-lg border border-border bg-white p-3 transition-all hover:border-border-strong hover:shadow-sm"
          >
            <div className="relative aspect-square w-full overflow-hidden rounded bg-surface-soft">
              {item.thumbnail ? (
                <Image
                  src={item.thumbnail}
                  alt={item.title}
                  fill
                  sizes="176px"
                  className="object-contain p-2 transition-transform duration-200 group-hover:scale-105"
                />
              ) : (
                <ProductMediaFallback title={item.title} />
              )}
            </div>

            <div className="mt-2.5">
              {item.brand ? (
                <span className="block truncate text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                  {item.brand}
                </span>
              ) : null}
              <h3 className="line-clamp-2 text-[13px] font-bold text-navy group-hover:text-brand">
                {item.title}
              </h3>
              <p className="mt-1 text-[14px] font-extrabold tabular-nums text-navy">
                {item.price != null ? formatPrice(item.price, item.currency) : "Price on request"}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

