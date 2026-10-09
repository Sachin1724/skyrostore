"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, ShoppingCart, Check } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { ProductMediaFallback } from "./product-media-fallback";
import { getProductTechnicalHighlights } from "@/lib/technical-specs";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ProductCard({ product }: { product: any }) {
  const [saved, setSaved] = useState(false);
  const [cartState, setCartState] = useState<"idle" | "adding" | "added">("idle");

  const variant = product.variants?.[0];
  const price = variant?.calculated_price;
  const category = product.categories?.[0]?.name?.replace("[DEV] ", "") as string | undefined;
  const inStock = variant?.inventory_quantity != null ? variant.inventory_quantity > 0 : true;
  const technicalHighlights = getProductTechnicalHighlights(product.metadata);

  async function handleQuickAdd(e: React.MouseEvent) {
    e.preventDefault();
    if (!variant?.id || !inStock || cartState === "adding") return;

    setCartState("adding");
    try {
      const cartId = localStorage.getItem("cart_id");
      const res = await fetch("/api/cart/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cart_id: cartId, variant_id: variant.id }),
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("cart_id", data.cart_id);
        setCartState("added");
        setTimeout(() => setCartState("idle"), 2000);
      } else {
        setCartState("idle");
      }
    } catch {
      setCartState("idle");
    }
  }

  return (
    <Link
      href={`/products/${product.handle}`}
      className="group relative block bg-surface transition-colors hover:border-border-strong"
      style={{ borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}
    >
      <div
        className="relative aspect-square overflow-hidden bg-surface-soft"
        style={{ borderRadius: "var(--radius-md) var(--radius-md) 0 0" }}
      >
        {product.thumbnail ? (
          <Image
            src={product.thumbnail}
            alt={product.title}
            fill
            className="object-contain p-4 transition-transform group-hover:scale-[1.02]"
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          />
        ) : (
          <ProductMediaFallback
            componentType={product.metadata?.component_type}
            category={category}
            title={product.title}
          />
        )}
        <button
          type="button"
          aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
          className="absolute right-3 top-3 z-10 text-text-muted transition-colors hover:text-graphite"
          onClick={(e) => {
            e.preventDefault();
            setSaved(!saved);
          }}
        >
          <Heart
            className="h-[18px] w-[18px] transition-colors"
            strokeWidth={1.6}
            fill={saved ? "var(--color-graphite)" : "none"}
            color={saved ? "var(--color-graphite)" : "currentColor"}
          />
        </button>
      </div>
      <div className="p-3">
        {category && (
          <p className="text-[11px] text-text-muted">{category}</p>
        )}
        <h3 className="mt-0.5 text-[14px] font-semibold leading-snug text-graphite line-clamp-1">
          {product.title?.replace("[DEV] ", "")}
        </h3>

        {/* Real Technical Highlights */}
        {technicalHighlights.length > 0 && (
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {technicalHighlights.map((highlight, idx) => (
              <span
                key={idx}
                className="inline-flex items-center rounded-xs bg-surface-muted px-1.5 py-0.5 font-mono text-[10px] text-text-secondary"
                style={{ border: "1px solid var(--color-border)" }}
              >
                {highlight}
              </span>
            ))}
          </div>
        )}

        {price?.calculated_amount != null && (
          <p className="mt-2 text-[15px] font-semibold text-graphite">
            {formatPrice(price.calculated_amount, price.currency_code)}
          </p>
        )}
        <div className="mt-2 flex items-center justify-between">
          {inStock ? (
            <span className="text-[11px] font-medium text-success">&bull; In Stock</span>
          ) : (
            <span className="text-[11px] font-medium text-text-disabled">&bull; Out of Stock</span>
          )}
          <button
            type="button"
            onClick={handleQuickAdd}
            disabled={!inStock || cartState === "adding"}
            aria-label="Add to cart"
            className="ml-auto p-1 text-text-muted transition-colors hover:text-graphite disabled:cursor-not-allowed disabled:opacity-40"
          >
            {cartState === "added" ? (
              <Check className="h-4 w-4 text-success" strokeWidth={2} />
            ) : (
              <ShoppingCart className="h-4 w-4" strokeWidth={1.6} />
            )}
          </button>
        </div>
      </div>
    </Link>
  );
}

