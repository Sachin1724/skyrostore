"use client";

import { useState } from "react";
import { ShoppingCart, Check } from "lucide-react";

export function AddToCartButton({ variantId }: { variantId: string }) {
  const [state, setState] = useState<"idle" | "adding" | "added">("idle");

  async function handleAdd() {
    setState("adding");
    try {
      const cartId = localStorage.getItem("cart_id");
      const res = await fetch("/api/cart/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cart_id: cartId, variant_id: variantId }),
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("cart_id", data.cart_id);
        setState("added");
        setTimeout(() => setState("idle"), 2000);
      } else {
        setState("idle");
      }
    } catch {
      setState("idle");
    }
  }

  return (
    <div className="flex gap-3">
      <button
        type="button"
        onClick={handleAdd}
        disabled={state === "adding"}
        className="inline-flex items-center gap-2 bg-graphite px-6 py-3 text-[13px] font-semibold text-white transition-colors hover:bg-graphite-soft disabled:opacity-50"
        style={{ borderRadius: "var(--radius-sm)" }}
      >
        {state === "added" ? (
          <>
            <Check className="h-4 w-4" strokeWidth={1.6} />
            Added
          </>
        ) : (
          <>
            <ShoppingCart className="h-4 w-4" strokeWidth={1.6} />
            {state === "adding" ? "Adding..." : "Add to Cart"}
          </>
        )}
      </button>
      <button
        type="button"
        className="inline-flex items-center px-6 py-3 text-[13px] font-semibold text-graphite transition-colors hover:bg-accent-hover"
        style={{ borderRadius: "var(--radius-sm)", background: "var(--color-accent)" }}
      >
        Buy Now
      </button>
    </div>
  );
}
