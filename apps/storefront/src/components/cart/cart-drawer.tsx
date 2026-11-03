"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2, X } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { track } from "@/lib/analytics";

export type DrawerCart = {
  id: string;
  currency_code: string;
  items: {
    id: string;
    title: string;
    product_title?: string | null;
    product_handle?: string | null;
    quantity: number;
    unit_price: number;
    total: number;
    thumbnail?: string | null;
    variant_title?: string | null;
  }[];
};

export const cartCount = (cart: DrawerCart | null) => cart?.items?.reduce((s, i) => s + i.quantity, 0) ?? 0;
export const cartTotal = (cart: DrawerCart | null) => cart?.items?.reduce((s, i) => s + i.total, 0) ?? 0;

/**
 * Slide-over cart. A native <dialog> opened with showModal() gives focus trapping,
 * Escape to close and an inert page behind it without extra code.
 */
export function CartDrawer({
  open,
  onClose,
  cart,
  setCart,
}: {
  open: boolean;
  onClose: () => void;
  cart: DrawerCart | null;
  setCart: (cart: DrawerCart) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [pending, setPending] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  async function change(lineId: string, quantity: number) {
    if (!cart || pending) return;
    setPending(lineId);
    const item = cart.items.find((i) => i.id === lineId);
    const res = await fetch(quantity > 0 ? "/api/cart/update" : "/api/cart/remove", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cart_id: cart.id, line_item_id: lineId, quantity }),
    }).catch(() => null);
    if (res?.ok) {
      const data = await res.json();
      setCart(data.cart);
      window.dispatchEvent(new Event("storage"));
      if (quantity === 0) {
        track("cart_item_removed", { cart_id: cart.id, line_item_id: lineId, quantity: item?.quantity ?? null });
        setMessage(`${item?.product_title ?? item?.title ?? "Item"} removed.`);
      }
    } else {
      setMessage("The cart could not be updated. Try again.");
    }
    setPending(null);
  }

  const items = cart?.items ?? [];
  const currency = cart?.currency_code ?? "inr";

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-labelledby="cart-drawer-title"
      className="sheet-right m-0 ml-auto h-dvh max-h-dvh w-full max-w-[420px] overscroll-contain bg-white p-0 text-navy backdrop:bg-navy/40"
    >
      <div className="flex h-full flex-col">
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-5">
          <h2 id="cart-drawer-title" className="text-[18px] font-bold">
            Your cart <span className="font-medium text-text-secondary tabular-nums">({cartCount(cart)})</span>
          </h2>
          <button type="button" onClick={onClose} aria-label="Close cart" className="flex h-11 w-11 items-center justify-center hover:text-brand">
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <p aria-live="polite" className="sr-only">{message}</p>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <p className="text-[16px] text-text-secondary">Your cart is empty.</p>
            <Link href="/parts" onClick={onClose} className="inline-flex h-11 items-center rounded-md bg-brand px-5 font-semibold text-white hover:bg-navy">
              Shop Parts
            </Link>
          </div>
        ) : (
          <ul className="flex-1 divide-y divide-border overflow-y-auto px-5">
            {items.map((item) => {
              const name = item.product_title ?? item.title;
              const busy = pending === item.id;
              return (
                <li key={item.id} className={`flex gap-3 py-4 ${busy ? "opacity-60" : ""}`}>
                  <div className="relative h-16 w-16 shrink-0 rounded-md bg-surface-soft">
                    {item.thumbnail ? <Image src={item.thumbnail} alt="" fill sizes="64px" className="object-contain p-1.5" /> : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    {item.product_handle ? (
                      <Link href={`/products/${item.product_handle}`} onClick={onClose} className="line-clamp-2 text-[15px] font-semibold leading-snug hover:text-brand">
                        {name}
                      </Link>
                    ) : (
                      <p className="line-clamp-2 text-[15px] font-semibold leading-snug">{name}</p>
                    )}
                    <p className="mt-0.5 text-[13px] tabular-nums text-text-secondary">{formatPrice(item.unit_price, currency)} each</p>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <div className="flex items-center rounded-md border border-border-strong">
                        <button
                          type="button"
                          aria-label={`Decrease quantity of ${name}`}
                          disabled={busy || item.quantity <= 1}
                          onClick={() => change(item.id, item.quantity - 1)}
                          className="flex h-9 w-9 items-center justify-center hover:text-brand disabled:opacity-40"
                        >
                          <Minus className="h-4 w-4" aria-hidden />
                        </button>
                        <span className="w-8 text-center text-[14px] font-semibold tabular-nums" aria-label={`Quantity ${item.quantity}`}>
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          aria-label={`Increase quantity of ${name}`}
                          disabled={busy}
                          onClick={() => change(item.id, item.quantity + 1)}
                          className="flex h-9 w-9 items-center justify-center hover:text-brand disabled:opacity-40"
                        >
                          <Plus className="h-4 w-4" aria-hidden />
                        </button>
                      </div>
                      <span className="text-[15px] font-bold tabular-nums">{formatPrice(item.total, currency)}</span>
                      <button
                        type="button"
                        aria-label={`Remove ${name}`}
                        disabled={busy}
                        onClick={() => change(item.id, 0)}
                        className="flex h-9 w-9 items-center justify-center text-text-secondary hover:text-error"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {items.length > 0 ? (
          <div className="shrink-0 space-y-3 border-t border-border px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-4">
            <div className="flex items-baseline justify-between">
              <span className="font-semibold">Items total</span>
              <span className="text-[20px] font-bold tabular-nums">{formatPrice(cartTotal(cart), currency)}</span>
            </div>
            <p className="text-[13px] text-text-secondary">Prices include GST. Shipping is shown before you pay.</p>
            <Link href="/checkout" onClick={onClose} className="flex h-12 items-center justify-center rounded-md bg-brand text-[16px] font-semibold text-white hover:bg-navy">
              Buy Now
            </Link>
            <Link href="/cart" onClick={onClose} className="flex h-11 items-center justify-center rounded-md border border-border-strong font-semibold hover:border-brand hover:text-brand">
              View Cart
            </Link>
          </div>
        ) : null}
      </div>
    </dialog>
  );
}
