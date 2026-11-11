"use client";

import { useState } from "react";
import { ShoppingCart, Check } from "lucide-react";
import { track } from "@/lib/analytics";
import { addToCart } from "@/lib/cart-client";

/** Adds one unit to the cart without leaving the list; the header opens the cart drawer at once. */
export function QuickAdd({
  productId,
  variantId,
  inStock,
  title = "item",
  thumbnail = null,
  label = false,
  className = "",
}: {
  productId: string;
  variantId?: string;
  inStock: boolean;
  title?: string;
  thumbnail?: string | null;
  /** A text button ("Add to cart") instead of the icon. */
  label?: boolean;
  className?: string;
}) {
  const [state, setState] = useState<"idle" | "adding" | "added">("idle");

  async function add(e: React.MouseEvent) {
    e.preventDefault();
    if (!variantId || !inStock || state === "adding") return;

    setState("adding");
    const data = await addToCart([{ variant_id: variantId }], { pending: { title, thumbnail } });
    if (!data) return setState("idle");
    track("product_added_to_cart", { cart_id: data.cart_id, product_id: productId, variant_id: variantId, quantity: 1 });
    setState("added");
    setTimeout(() => setState("idle"), 2000);
  }

  if (label) {
    return (
      <button
        type="button"
        onClick={add}
        disabled={!inStock || state === "adding"}
        aria-label={!inStock ? `${title} is out of stock` : undefined}
        className={`btn btn-primary btn-sm w-full disabled:bg-surface-muted disabled:text-text-muted ${className}`}
      >
        {!inStock ? "Out of stock" : state === "added" ? (
          <><Check className="h-4 w-4" strokeWidth={2.5} aria-hidden /> Added</>
        ) : state === "adding" ? "Adding…" : "Add to cart"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={add}
      disabled={!inStock || state === "adding"}
      aria-label={!inStock ? `${title} is out of stock` : state === "added" ? `${title} added to cart` : `Add ${title} to cart`}
      className={`btn btn-secondary btn-icon shrink-0 disabled:text-text-muted disabled:hover:bg-white ${className}`}
    >
      {state === "added" ? (
        <Check key="added" className="fade-in h-4 w-4" strokeWidth={2.5} aria-hidden />
      ) : (
        <ShoppingCart key="idle" className={`h-4 w-4 ${state === "adding" ? "opacity-40" : ""}`} strokeWidth={1.8} aria-hidden />
      )}
    </button>
  );
}
