"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, Plus, ShoppingCart } from "lucide-react";
import type { CompatibleItem } from "@/lib/data/compatible-products";
import { formatPrice } from "@/lib/utils";
import { CART_ADDED } from "@/components/layout/header-bar";
import { ProductTile } from "@/components/product/product-tile";
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

      <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
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
            <ProductTile
              key={product.id}
              href={`/products/${product.handle}`}
              image={product.thumbnail}
              fallback={<ProductMediaFallback componentType={meta.component_type as string | undefined} title={product.title} />}
              eyebrow={`${roleLabel} · Verified fit`}
              title={product.title.replace("[DEV] ", "")}
              spec={compatibilityReason}
              price={<p className="text-[16px] font-semibold tabular-nums text-navy">{amount != null ? formatPrice(amount, currency) : "Price on request"}</p>}
              status={<p className={`text-[13px] font-medium ${inStock ? "text-success" : "text-text-muted"}`}>{inStock ? "In stock" : "Out of stock"}</p>}
              action={
                variant?.id ? (
                  <button
                    type="button"
                    disabled={!inStock || isAdding}
                    onClick={() => handleQuickAdd(variant.id, product.id)}
                    className={`btn btn-sm ${isAdded ? "btn-light" : "btn-primary"}`}
                  >
                    {isAdded ? (
                      <>
                        <Check className="h-4 w-4" /> Added
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" /> Add
                      </>
                    )}
                  </button>
                ) : null
              }
            />
          );
        })}
      </div>
    </section>
  );
}

