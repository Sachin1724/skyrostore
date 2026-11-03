"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Clock, Trash2, ArrowRight } from "lucide-react";
import type { HttpTypes } from "@medusajs/types";
import { formatPrice } from "@/lib/utils";
import { ProductMediaFallback } from "@/components/product/product-media-fallback";

const STORAGE_KEY = "skyro_recently_viewed_v1";
const MAX_ITEMS = 12;

interface ViewedItem {
  id: string;
  handle: string;
  title: string;
  thumbnail: string | null;
  price: number | null;
  currency: string;
  brand: string | null;
}

interface RecentlyViewedProps {
  currentProduct?: HttpTypes.StoreProduct;
  className?: string;
  title?: string;
}

export function RecentlyViewed({
  currentProduct,
  className = "",
  title = "Recently Viewed Hardware",
}: RecentlyViewedProps) {
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

      // Display list: if currentProduct provided, exclude it from shelf display
      const displayList = currentProduct?.id ? list.filter((i) => i.id !== currentProduct.id) : list;
      setItems(displayList);
    } catch {
      // Graceful fallback for private browsing or storage quotas
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
    <section aria-labelledby="recently-viewed-heading" className={`rounded-xl border border-border bg-white p-5 md:p-6 ${className}`}>
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-2.5">
          <Clock className="h-5 w-5 text-brand" aria-hidden />
          <h2 id="recently-viewed-heading" className="text-[18px] md:text-[20px] font-extrabold tracking-[-0.02em] text-navy">
            {title}
          </h2>
          <span className="rounded bg-surface-soft px-2 py-0.5 text-[12px] font-bold text-text-muted">
            {items.length} {items.length === 1 ? "item" : "items"}
          </span>
        </div>
        <button
          type="button"
          onClick={clearHistory}
          className="flex items-center gap-1.5 text-[12px] font-semibold text-text-muted hover:text-error transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden /> Clear History
        </button>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/products/${item.handle}`}
            className="group flex flex-col justify-between rounded-lg border border-border bg-surface-soft/40 p-2.5 transition-all hover:border-brand hover:bg-white hover:shadow-sm"
          >
            <div>
              <div className="relative aspect-square w-full overflow-hidden rounded bg-white">
                {item.thumbnail ? (
                  <Image
                    src={item.thumbnail}
                    alt={item.title}
                    fill
                    sizes="(min-width: 1024px) 16vw, (min-width: 640px) 25vw, 50vw"
                    className="object-contain p-2 transition-transform duration-200 group-hover:scale-105"
                  />
                ) : (
                  <ProductMediaFallback title={item.title} />
                )}
              </div>

              <div className="mt-2.5">
                {item.brand ? (
                  <span className="block truncate text-[10px] font-bold uppercase tracking-wider text-text-muted">
                    {item.brand}
                  </span>
                ) : null}
                <h3 className="line-clamp-2 text-[13px] font-bold leading-snug text-navy group-hover:text-brand">
                  {item.title}
                </h3>
              </div>
            </div>

            <div className="mt-2 pt-2 border-t border-border/50 flex items-center justify-between">
              <span className="text-[13px] font-extrabold tabular-nums text-navy">
                {item.price != null ? formatPrice(item.price, item.currency) : "Price on request"}
              </span>
              <span className="text-[11px] font-semibold text-brand group-hover:translate-x-0.5 transition-transform flex items-center">
                <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
