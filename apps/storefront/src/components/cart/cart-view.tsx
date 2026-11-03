"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { track } from "@/lib/analytics";

type CartItem = {
  id: string;
  title: string;
  product_title?: string | null;
  product_handle?: string | null;
  quantity: number;
  unit_price: number;
  total: number;
  thumbnail?: string | null;
  variant?: { title?: string; sku?: string | null };
};

type Cart = {
  id: string;
  items: CartItem[];
  total: number;
  currency_code: string;
  region?: { currency_code: string };
};

export function CartView() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingItemId, setPendingItemId] = useState<string | null>(null);
  const [cartMessage, setCartMessage] = useState("");

  useEffect(() => {
    const cartId = localStorage.getItem("cart_id");
    if (!cartId) {
      setLoading(false);
      return;
    }
    fetch(`/api/cart?id=${cartId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.cart) setCart(data.cart);
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  async function removeItem(lineItemId: string) {
    if (!cart || pendingItemId) return;
    const removed = cart.items?.find((i) => i.id === lineItemId);
    setPendingItemId(lineItemId);
    const res = await fetch("/api/cart/remove", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cart_id: cart.id, line_item_id: lineItemId }),
    });
    if (res.ok) {
      const data = await res.json();
      setCart(data.cart);
      window.dispatchEvent(new Event("storage"));
      track("cart_item_removed", {
        cart_id: cart.id,
        line_item_id: lineItemId,
        quantity: removed?.quantity ?? null,
      });
      setCartMessage(`${removed?.title ?? "Item"} removed from your cart.`);
    } else {
      setCartMessage("That item could not be removed. Please try again.");
    }
    setPendingItemId(null);
  }

  async function updateQuantity(lineItemId: string, quantity: number) {
    if (!cart || quantity < 1 || pendingItemId) return;
    setPendingItemId(lineItemId);
    const previous = cart.items?.find((i) => i.id === lineItemId)?.quantity ?? null;
    const res = await fetch("/api/cart/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cart_id: cart.id, line_item_id: lineItemId, quantity }),
    });
    if (res.ok) {
      const data = await res.json();
      setCart(data.cart);
      window.dispatchEvent(new Event("storage"));
      track("cart_item_quantity_changed", {
        cart_id: cart.id,
        line_item_id: lineItemId,
        quantity,
        metadata: { previous_quantity: previous },
      });
      setCartMessage(`Quantity updated to ${quantity}.`);
    } else {
      setCartMessage("That quantity could not be updated. Please try again.");
    }
    setPendingItemId(null);
  }

  if (loading) {
    return (
      <div role="status" aria-label="Loading your cart" className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="skeleton h-64" />
        <div className="skeleton h-56" />
      </div>
    );
  }

  const items = cart?.items || [];

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-white px-6 py-14 text-center">
        <h2 className="text-[24px] font-bold text-navy">Your cart is empty</h2>
        <p className="mt-2 text-[17px] text-text-secondary">Pick the parts for your next build and they will wait here.</p>
        <Link href="/parts" className="mt-8 inline-flex min-h-12 items-center rounded-md bg-brand px-7 text-[16px] font-semibold text-white hover:bg-navy">
          Shop Parts
        </Link>
      </div>
    );
  }

  const currency = cart?.region?.currency_code || cart?.currency_code || "INR";
  // Line totals already include GST; shipping is quoted in the Razorpay window, as on checkout.
  const itemsTotal = items.reduce((s, it) => s + it.total, 0);
  const units = items.reduce((s, it) => s + it.quantity, 0);

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
      {/* Cart changes are visual for sighted users; this announces them for everyone else. */}
      <p aria-live="polite" role="status" className="sr-only">
        {cartMessage}
      </p>

      <ul className="divide-y divide-border rounded-lg border border-border bg-white px-4 md:px-6">
        {items.map((item) => {
          const title = (item.product_title ?? item.title)?.replace("[DEV] ", "");
          const busy = pendingItemId === item.id;
          return (
            <li key={item.id} className="flex gap-4 py-5">
              <div className="relative h-20 w-20 shrink-0 rounded-md bg-surface-soft">
                {item.thumbnail ? <Image src={item.thumbnail} alt="" fill sizes="80px" className="object-contain p-2" /> : null}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    {item.product_handle ? (
                      <Link href={`/products/${item.product_handle}`} className="text-[17px] font-semibold leading-snug text-navy hover:text-brand">{title}</Link>
                    ) : (
                      <p className="text-[17px] font-semibold leading-snug text-navy">{title}</p>
                    )}
                    {item.variant?.title && item.variant.title !== "Default Variant" ? (
                      <p className="text-[15px] text-text-secondary">{item.variant.title}</p>
                    ) : null}
                    <p className="text-[15px] tabular-nums text-text-secondary">{formatPrice(item.unit_price, currency)} each</p>
                  </div>
                  <p className="shrink-0 text-[17px] font-semibold tabular-nums text-navy">{formatPrice(item.total, currency)}</p>
                </div>
                <div className="mt-3 flex items-center gap-4">
                  <div className="flex h-11 items-center rounded-md border border-border-strong" role="group" aria-label={`Quantity of ${title}`}>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      disabled={item.quantity <= 1 || busy}
                      aria-label={`Decrease quantity of ${title}`}
                      className="h-full w-11 text-[20px] text-navy hover:text-brand disabled:opacity-30"
                    >
                      &minus;
                    </button>
                    <span className="w-8 text-center text-[16px] font-semibold tabular-nums text-navy">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      disabled={busy}
                      aria-label={`Increase quantity of ${title}`}
                      className="h-full w-11 text-[20px] text-navy hover:text-brand disabled:opacity-30"
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    disabled={busy}
                    className="min-h-11 text-[15px] font-semibold text-text-secondary hover:text-error disabled:opacity-30"
                  >
                    Remove<span className="sr-only"> {title}</span>
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="rounded-lg border border-border bg-white px-6 py-6 lg:sticky lg:top-[150px]">
        <h2 className="text-[20px] font-bold text-navy">Summary</h2>
        <dl className="mt-4 space-y-2 text-[16px] text-text-secondary">
          <div className="flex justify-between gap-4">
            <dt>Items ({units})</dt>
            <dd className="tabular-nums text-navy">{formatPrice(itemsTotal, currency)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>Shipping</dt>
            <dd className="text-right text-navy">Shown in payment window</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 border-t border-border pt-3">
            <dt className="font-semibold text-navy">Items total</dt>
            <dd className="text-[24px] font-bold tabular-nums text-navy">{formatPrice(itemsTotal, currency)}</dd>
          </div>
        </dl>
        <p className="mt-1 text-[14px] text-text-secondary">Prices include GST.</p>
        <Link href="/checkout" className="mt-6 flex min-h-12 w-full items-center justify-center rounded-md bg-brand text-[16px] font-semibold text-white hover:bg-navy">
          Buy Now
        </Link>
        <p className="mt-2 text-center text-[13px] text-text-secondary">Secured by Razorpay · UPI, cards, netbanking</p>
        <Link href="/parts" className="mt-3 block text-center text-[15px] font-semibold text-brand hover:text-navy">
          Keep Shopping
        </Link>
      </div>
    </div>
  );
}
