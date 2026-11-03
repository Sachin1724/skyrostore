"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, ArrowRight, ShieldCheck, Truck, CheckCircle2, ShoppingCart, Loader2 } from "lucide-react";
import type { HttpTypes } from "@medusajs/types";
import { formatPrice } from "@/lib/utils";
import { cleanName } from "@/lib/data/catalog";
import { getProductTechnicalHighlights } from "@/lib/technical-specs";
import { ProductMediaFallback } from "@/components/product/product-media-fallback";

export function QuickViewModal() {
  const [product, setProduct] = useState<HttpTypes.StoreProduct | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    function handleOpen(e: Event) {
      const customEvent = e as CustomEvent<HttpTypes.StoreProduct>;
      if (customEvent.detail) {
        setProduct(customEvent.detail);
        setQuantity(1);
        setAdded(false);
      }
    }

    window.addEventListener("skyro:open_quickview", handleOpen);
    return () => window.removeEventListener("skyro:open_quickview", handleOpen);
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setProduct(null);
    }
    if (product) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [product]);

  if (!product) return null;

  const variant = product.variants?.[0];
  const price = variant?.calculated_price;
  const qty = variant?.inventory_quantity;
  const managed = variant?.manage_inventory !== false && qty != null;
  const inStock = !managed || qty! > 0;
  const amount = price?.calculated_amount ?? null;
  const currency = price?.currency_code ?? "inr";
  const title = cleanName(product.title ?? "");
  const brand = product.collection?.title;
  const category = product.categories?.[0]?.name ? cleanName(product.categories[0].name) : undefined;
  const specs = getProductTechnicalHighlights(product.metadata);

  function handleAddToCart() {
    if (!variant?.id || isPending) return;

    startTransition(async () => {
      try {
        const res = await fetch("/api/cart/add", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ variantId: variant.id, quantity }),
        });
        if (res.ok) {
          setAdded(true);
          window.dispatchEvent(new CustomEvent("skyro:cart_updated"));
          setTimeout(() => setAdded(false), 2500);
        }
      } catch {
        // Fallback
      }
    });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-view-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-navy/60 backdrop-blur-sm"
    >
      {/* Click outside to close */}
      <div className="absolute inset-0" onClick={() => setProduct(null)} aria-hidden />

      {/* Modal Content */}
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-3xl flex-col overflow-y-auto rounded-xl border border-border bg-white shadow-2xl sm:flex-row">
        {/* Close Button */}
        <button
          type="button"
          onClick={() => setProduct(null)}
          aria-label="Close modal"
          className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-surface-soft text-navy hover:bg-border transition-colors"
        >
          <X className="h-5 w-5" aria-hidden />
        </button>

        {/* Left Column: Image */}
        <div className="relative aspect-square w-full sm:w-[48%] shrink-0 bg-surface-soft border-b sm:border-b-0 sm:border-r border-border p-6 flex items-center justify-center">
          {product.thumbnail ? (
            <div className="relative h-full w-full">
              <Image
                src={product.thumbnail}
                alt={title}
                fill
                sizes="380px"
                className="object-contain"
              />
            </div>
          ) : (
            <ProductMediaFallback
              componentType={product.metadata?.component_type as string | undefined}
              category={category}
              title={title}
            />
          )}

          {inStock ? (
            <span className="absolute bottom-4 left-4 rounded bg-success/10 border border-success/20 px-2 py-0.5 text-[11px] font-bold text-success">
              In Stock &amp; Ready to Ship
            </span>
          ) : (
            <span className="absolute bottom-4 left-4 rounded bg-border px-2 py-0.5 text-[11px] font-bold text-text-muted">
              Out of Stock
            </span>
          )}
        </div>

        {/* Right Column: Specs & Actions */}
        <div className="flex flex-1 flex-col justify-between p-6 sm:p-7">
          <div>
            {/* Brand / Category */}
            <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-brand">
              {brand ? <span>{brand}</span> : null}
              {brand && category ? <span>·</span> : null}
              {category ? <span>{category}</span> : null}
            </div>

            {/* Title */}
            <h2 id="quick-view-title" className="mt-2 text-[18px] sm:text-[20px] font-extrabold leading-snug text-navy">
              {title}
            </h2>

            {/* Price Row */}
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-[22px] font-extrabold tabular-nums text-navy">
                {amount != null ? formatPrice(amount, currency) : "Price on request"}
              </span>
              <span className="text-[12px] text-text-muted">Includes GST</span>
            </div>

            {/* Technical Highlights */}
            {specs.length > 0 ? (
              <div className="mt-4 rounded-lg border border-border bg-surface-soft/60 p-3">
                <span className="block text-[11px] font-extrabold uppercase tracking-wider text-text-muted">
                  Engineering Specifications
                </span>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {specs.map((spec) => (
                    <span
                      key={spec}
                      className="rounded border border-border bg-white px-2 py-1 text-[12px] font-semibold tabular-nums text-navy"
                    >
                      {spec}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Guarantees */}
            <div className="mt-4 grid grid-cols-2 gap-2 text-[12px] text-text-secondary border-t border-border pt-3">
              <div className="flex items-center gap-1.5">
                <Truck className="h-3.5 w-3.5 text-brand" aria-hidden />
                <span>Delhivery Air Express</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-brand" aria-hidden />
                <span>Genuine Hardware</span>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="mt-6 border-t border-border pt-4">
            <div className="flex items-center gap-3">
              {/* Stepper */}
              <div className="flex h-11 items-center rounded-md border border-border bg-white">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1 || !inStock}
                  className="flex h-full w-9 items-center justify-center text-navy hover:bg-surface-soft disabled:opacity-40"
                  aria-label="Decrease quantity"
                >
                  -
                </button>
                <span className="w-10 text-center text-[14px] font-bold tabular-nums text-navy">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  disabled={!inStock}
                  className="flex h-full w-9 items-center justify-center text-navy hover:bg-surface-soft disabled:opacity-40"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>

              {/* Add to Cart Button */}
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={!inStock || isPending}
                className={`flex h-11 flex-1 items-center justify-center gap-2 rounded-md px-5 text-[14px] font-bold transition-all ${
                  added
                    ? "bg-success text-white"
                    : inStock
                    ? "bg-brand text-white hover:bg-navy shadow-sm"
                    : "bg-surface-muted text-text-muted cursor-not-allowed"
                }`}
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : added ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" aria-hidden />
                    <span>Added to Cart</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-4 w-4" aria-hidden />
                    <span>{inStock ? "Add to Cart" : "Out of Stock"}</span>
                  </>
                )}
              </button>
            </div>

            {/* Link to full details */}
            <div className="mt-3 text-center">
              <Link
                href={`/products/${product.handle}`}
                onClick={() => setProduct(null)}
                className="inline-flex items-center gap-1 text-[13px] font-semibold text-brand hover:text-navy transition-colors"
              >
                View Full Technical Specs &amp; Documentation
                <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
