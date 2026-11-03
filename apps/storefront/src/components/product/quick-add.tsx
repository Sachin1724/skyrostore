"use client";

import { useState } from "react";
import { ShoppingCart, Check } from "lucide-react";
import { track } from "@/lib/analytics";

/** Adds one unit to the cart without leaving the list. preventDefault keeps it safe inside a product link. */
export function QuickAdd({ productId, variantId, inStock, className = "" }: { productId: string; variantId?: string; inStock: boolean; className?: string }) {
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
      window.dispatchEvent(new Event("storage"));
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
      aria-label={state === "added" ? "Added to cart" : "Add to cart"}
      className={`flex h-10 w-10 shrink-0 items-center justify-center bg-navy text-white transition-colors hover:bg-brand disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
    >
      {state === "added" ? <Check className="h-4 w-4" strokeWidth={2.5} aria-hidden /> : <ShoppingCart className="h-4 w-4" strokeWidth={1.8} aria-hidden />}
    </button>
  );
}
