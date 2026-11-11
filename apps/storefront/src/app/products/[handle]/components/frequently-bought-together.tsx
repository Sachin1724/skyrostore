"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, Plus, ShoppingCart } from "lucide-react";
import type { HttpTypes } from "@medusajs/types";
import type { CompatibleItem } from "@/lib/data/compatible-products";
import { formatPrice } from "@/lib/utils";
import { addToCart } from "@/lib/cart-client";
import { ProductMediaFallback } from "@/components/product/product-media-fallback";

interface FrequentlyBoughtTogetherProps {
  currentProduct: HttpTypes.StoreProduct;
  compatibleItems: CompatibleItem[];
}

export function FrequentlyBoughtTogether({
  currentProduct,
  compatibleItems,
}: FrequentlyBoughtTogetherProps) {
  // Take up to 2 companion items to form a 2-3 item bundle
  const bundleCompanions = compatibleItems.slice(0, 2);
  if (bundleCompanions.length === 0) return null;

  const currentVariant = currentProduct.variants?.[0];
  const currentPrice = currentVariant?.calculated_price?.calculated_amount ?? 0;
  const currency = currentVariant?.calculated_price?.currency_code ?? "inr";

  const allBundleProducts = [
    {
      product: currentProduct,
      variantId: currentVariant?.id ?? "",
      price: currentPrice,
      isCurrent: true,
      role: "This item",
    },
    ...bundleCompanions.map((c) => ({
      product: c.product,
      variantId: c.product.variants?.[0]?.id ?? "",
      price: c.product.variants?.[0]?.calculated_price?.calculated_amount ?? 0,
      isCurrent: false,
      role: c.roleLabel,
    })),
  ];

  // Track checked state by variant ID
  const [selectedVariants, setSelectedVariants] = useState<Set<string>>(
    () => new Set(allBundleProducts.map((p) => p.variantId).filter(Boolean))
  );
  const [adding, setAdding] = useState(false);
  const [success, setSuccess] = useState(false);

  const toggleVariant = (id: string) => {
    setSelectedVariants((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (next.size > 1) next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectedProducts = allBundleProducts.filter((p) => selectedVariants.has(p.variantId));
  const totalPrice = selectedProducts.reduce((sum, p) => sum + p.price, 0);

  async function handleAddBundle() {
    if (adding || selectedProducts.length === 0) return;
    setAdding(true);
    try {
      // One request for the whole bundle.
      const items = selectedProducts.filter((p) => p.variantId).map((p) => ({ variant_id: p.variantId!, quantity: 1 }));
      if (await addToCart(items, { pending: { title: `${items.length} items` } })) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch {
      // Ignored
    } finally {
      setAdding(false);
    }
  }

  return (
    <section aria-labelledby="bundle-heading" className="mt-12">
      <h2 id="bundle-heading" className="text-[22px] font-extrabold tracking-[-0.02em] text-navy">
        Buy it with
      </h2>
      <p className="mt-1 text-[14px] text-text-secondary">
        Parts that fit this one, checked by our compatibility rules.
      </p>

      <div className="mt-6 card p-5 lg:p-7">
        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          {/* Visual bundle flow, wider screens only: on a phone the tiles and plus signs wrap raggedly, and the checklist beside it already names every item and price. */}
          <div className="hidden flex-wrap items-center gap-4 sm:flex sm:gap-6">
            {allBundleProducts.map((item, index) => {
              const isChecked = selectedVariants.has(item.variantId);
              const meta = (item.product.metadata ?? {}) as Record<string, unknown>;

              return (
                <div key={item.product.id} className="flex items-center gap-4 sm:gap-6">
                  <div
                    className={`relative w-28 sm:w-36 rounded-md border p-2 transition-all ${
                      isChecked ? "border-brand bg-surface-soft/50" : "border-border opacity-50"
                    }`}
                  >
                    <div className="relative aspect-square w-full overflow-hidden rounded bg-white">
                      {item.product.thumbnail ? (
                        <Image
                          src={item.product.thumbnail}
                          alt={item.product.title}
                          fill
                          sizes="144px"
                          className="object-contain p-2"
                        />
                      ) : (
                        <ProductMediaFallback
                          componentType={meta.component_type as string | undefined}
                          title={item.product.title}
                        />
                      )}
                    </div>
                    <div className="mt-2">
                      <span className="block truncate text-[13px] font-bold text-brand">
                        {item.role}
                      </span>
                      <span className="mt-0.5 block truncate text-[13px] font-semibold text-navy">
                        {item.product.title.replace("[DEV] ", "")}
                      </span>
                      <span className="mt-1 block text-[13px] font-extrabold tabular-nums text-navy">
                        {formatPrice(item.price, currency)}
                      </span>
                    </div>
                  </div>

                  {index < allBundleProducts.length - 1 ? (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-soft text-navy">
                      <Plus className="h-4 w-4" strokeWidth={2.5} />
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>

          {/* Bundle Summary & Add Action */}
          <div className="flex flex-col justify-between sm:border-t sm:border-border sm:pt-5 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
            <div>
              <span className="text-[13px] font-semibold text-text-secondary">
                Total for {selectedProducts.length} items
              </span>
              <div className="mt-1.5 flex items-baseline gap-2">
                <span className="text-[28px] font-extrabold tabular-nums text-navy">
                  {formatPrice(totalPrice, currency)}
                </span>
                <span className="text-[13px] text-text-secondary">incl. GST</span>
              </div>

              {/* Item Checkbox List */}
              <ul className="mt-4 space-y-2.5">
                {allBundleProducts.map((item) => {
                  const isChecked = selectedVariants.has(item.variantId);
                  return (
                    <li key={item.product.id} className="flex items-start gap-2.5 text-[13px]">
                      <input
                        type="checkbox"
                        id={`bundle-chk-${item.product.id}`}
                        checked={isChecked}
                        onChange={() => toggleVariant(item.variantId)}
                        className="mt-0.5 h-4 w-4 rounded border-border-strong text-brand focus:ring-brand"
                      />
                      <label htmlFor={`bundle-chk-${item.product.id}`} className="cursor-pointer text-navy">
                        <strong className="font-semibold">
                          {item.isCurrent ? "This item: " : ""}
                        </strong>
                        <span className="text-text-secondary">
                          {item.product.title.replace("[DEV] ", "")}
                        </span>{" "}
                        <span className="font-bold tabular-nums">
                          ({formatPrice(item.price, currency)})
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="mt-6">
              <button
                type="button"
                disabled={adding || selectedProducts.length === 0}
                onClick={handleAddBundle}
                className={`flex h-12 w-full items-center justify-center gap-2 rounded-md text-[14px] font-bold transition-colors ${
                  success
                    ? "bg-success text-white"
                    : "bg-navy text-white hover:bg-brand"
                } disabled:opacity-40`}
              >
                {success ? (
                  <>
                    <Check className="h-5 w-5" /> Added {selectedProducts.length} items to cart
                  </>
                ) : adding ? (
                  "Adding…"
                ) : (
                  <>
                    <ShoppingCart className="h-4 w-4" /> Add all {selectedProducts.length} to cart
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

