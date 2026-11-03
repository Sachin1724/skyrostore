"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, Plus, ShoppingCart } from "lucide-react";
import type { CompatibleItem } from "@/lib/data/compatible-products";
import { formatPrice } from "@/lib/utils";
import { CART_ADDED } from "@/components/layout/header-bar";
import { ProductMediaFallback } from "@/components/product/product-media-fallback";

interface CompatiblePartsProps {
  items: CompatibleItem[];
}

export function CompatibleParts({ items }: CompatiblePartsProps) {
  const [addingId, setAddingId] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  if (!items || items.length === 0) return null;

  async function handleQuickAdd(variantId: string, productId: string) {
    if (addingId) return;
    setAddingId(productId);
    try {
      const res = await fetch("/api/cart/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cart_id: localStorage.getItem("cart_id"),
          variant_id: variantId,
          quantity: 1,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("cart_id", data.cart_id);
        window.dispatchEvent(new Event(CART_ADDED));
        setAddedIds((prev) => new Set(prev).add(productId));
        setTimeout(() => {
          setAddedIds((prev) => {
            const next = new Set(prev);
            next.delete(productId);
            return next;
          });
        }, 2500);
      }
    } catch {
      // Ignored gracefully
    } finally {
      setAddingId(null);
    }
  }

  return (
    <section aria-labelledby="compatible-parts-heading" className="mt-14 border-t border-border pt-10">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <div>
          <h2 id="compatible-parts-heading" className="text-[22px] font-extrabold tracking-[-0.02em] text-navy">
            Works With: Verified Compatible Parts
          </h2>
          <p className="mt-1 text-[14px] text-text-secondary">
            Validated by Skyrostore compatibility rule engine for direct electrical and mechanical fit.
          </p>
        </div>
        <Link href="/build" className="text-[13px] font-bold text-brand hover:underline">
          Open in Build Configurator &rarr;
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map(({ product, roleLabel, compatibilityReason }) => {
          const variant = product.variants?.[0];
          const price = variant?.calculated_price;
          const amount = price?.calculated_amount ?? null;
          const currency = price?.currency_code ?? "inr";
          const inStock = (variant?.inventory_quantity ?? 1) > 0;
          const isAdded = addedIds.has(product.id);
          const isAdding = addingId === product.id;
          const meta = (product.metadata ?? {}) as Record<string, unknown>;

          return (
            <div
              key={product.id}
              className="flex flex-col justify-between rounded-lg border border-border bg-white p-4 transition-all hover:border-border-strong hover:shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded bg-brand-soft px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-brand">
                    {roleLabel}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-success">
                    <Check className="h-3.5 w-3.5 text-success" strokeWidth={3} /> Verified Fit
                  </span>
                </div>

                <Link href={`/products/${product.handle}`} className="group mt-3 block">
                  <div className="relative aspect-square w-full overflow-hidden rounded border border-border bg-surface-soft">
                    {product.thumbnail ? (
                      <Image
                        src={product.thumbnail}
                        alt={product.title}
                        fill
                        sizes="(min-width: 1024px) 25vw, 50vw"
                        className="object-contain p-3 transition-transform duration-200 group-hover:scale-105"
                      />
                    ) : (
                      <ProductMediaFallback
                        componentType={meta.component_type as string | undefined}
                        title={product.title}
                      />
                    )}
                  </div>
                  <h3 className="mt-3 line-clamp-2 text-[14px] font-bold text-navy group-hover:text-brand">
                    {product.title.replace("[DEV] ", "")}
                  </h3>
                </Link>

                <p className="mt-1.5 rounded bg-surface-soft p-2 text-[12px] leading-tight text-text-secondary">
                  {compatibilityReason}
                </p>
              </div>

              <div className="mt-4 border-t border-border pt-3">
                <div className="flex items-baseline justify-between mb-3">
                  <span className="text-[17px] font-extrabold tabular-nums text-navy">
                    {amount != null ? formatPrice(amount, currency) : "Price on request"}
                  </span>
                  <span className={`text-[12px] font-medium ${inStock ? "text-success" : "text-text-muted"}`}>
                    {inStock ? "In Stock" : "Out of Stock"}
                  </span>
                </div>

                {variant?.id ? (
                  <button
                    type="button"
                    disabled={!inStock || isAdding}
                    onClick={() => handleQuickAdd(variant.id, product.id)}
                    className={`flex h-10 w-full items-center justify-center gap-1.5 rounded-md text-[13px] font-bold transition-colors ${
                      isAdded
                        ? "bg-success text-white"
                        : "border border-navy bg-white text-navy hover:bg-navy hover:text-white"
                    } disabled:opacity-40`}
                  >
                    {isAdded ? (
                      <>
                        <Check className="h-4 w-4" /> Added to Cart
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" /> Add Compatible Part
                      </>
                    )}
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

