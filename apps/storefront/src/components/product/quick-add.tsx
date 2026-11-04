"use client";

import { useState } from "react";
import { ShoppingCart, Check } from "lucide-react";
import { track } from "@/lib/analytics";
import { CART_ADDED } from "@/components/layout/header-bar";

/** Adds one unit to the cart without leaving the list; the header then opens the cart drawer. */
export function QuickAdd({ productId, variantId, inStock, title = "item", className = "" }: { productId: string; variantId?: string; inStock: boolean; title?: string; className?: string }) {
  const [state, setState] = useState<"idle" | "adding" | "added">("idle");

  async function add(e: React.MouseEvent) {
    e.preventDefault();
    if (!variantId || !inStock || state === "adding") return;

    setState("adding");
    try {
      const res = await fetch("/api/cart/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cart_id: localStorage.getItem("cart_id"), variant_id: variantId }),
      });
      if (!res.ok) return setState("idle");
      const data = await res.json();
      localStorage.setItem("cart_id", data.cart_id);
      window.dispatchEvent(new Event(CART_ADDED));
      track("product_added_to_cart", { cart_id: data.cart_id, product_id: productId, variant_id: variantId, quantity: 1 });
      setState("added");
      setTimeout(() => setState("idle"), 2000);
    } catch {
      setState("idle");
    }
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
