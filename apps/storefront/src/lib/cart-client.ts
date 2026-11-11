"use client";

/** Fired before the request so the header opens the drawer at once, showing the item as pending. */
export const CART_ADDING = "cart:adding";
/** Fired after a successful add; `detail` is the updated cart, so the header needs no second fetch. */
export const CART_ADDED = "cart:added";
/** Fired when an add fails, so the drawer drops the pending row. */
export const CART_FAILED = "cart:failed";

export type PendingItem = { title: string; thumbnail?: string | null };

/**
 * The one way the storefront adds to the cart. Several items go in a single request (the bundle).
 * `open: false` updates the header quietly (Buy now goes straight to checkout instead).
 */
export async function addToCart(
  items: { variant_id: string; quantity?: number }[],
  { pending, open = true }: { pending?: PendingItem; open?: boolean } = {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- the Medusa store cart, shaped by each caller
): Promise<{ cart_id: string; cart: any } | null> {
  if (open) window.dispatchEvent(new CustomEvent<PendingItem | undefined>(CART_ADDING, { detail: pending }));
  try {
    const res = await fetch("/api/cart/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cart_id: localStorage.getItem("cart_id"), items }),
    });
    const data = res.ok ? await res.json() : null;
    if (!data?.added_count) throw new Error("not added");
    localStorage.setItem("cart_id", data.cart_id);
    window.dispatchEvent(new CustomEvent(open ? CART_ADDED : "cart:updated", { detail: data.cart }));
    return { cart_id: data.cart_id, cart: data.cart };
  } catch {
    window.dispatchEvent(new Event(CART_FAILED));
    return null;
  }
}
