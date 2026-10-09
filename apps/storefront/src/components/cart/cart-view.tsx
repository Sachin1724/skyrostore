"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { formatPrice } from "@/lib/utils";

type CartItem = {
  id: string;
  title: string;
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

  useEffect(() => {
    const cartId = localStorage.getItem("cart_id");
    if (!cartId) { setLoading(false); return; }
    fetch(`/api/cart?id=${cartId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setCart(data?.cart ?? null))
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  async function removeItem(lineItemId: string) {
    if (!cart) return;
    const res = await fetch("/api/cart/remove", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cart_id: cart.id, line_item_id: lineItemId }),
    });
    if (res.ok) setCart((await res.json()).cart);
  }

  async function updateQuantity(lineItemId: string, quantity: number) {
    if (!cart || quantity < 1) return;
    const res = await fetch("/api/cart/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cart_id: cart.id, line_item_id: lineItemId, quantity }),
    });
    if (res.ok) setCart((await res.json()).cart);
  }

  if (loading) return <p className="mt-4 text-[13px] text-text-muted">Loading cart...</p>;

  if (!cart || cart.items.length === 0) {
    return (
      <div className="mt-4">
        <p className="text-[14px] text-text-secondary">Your cart is empty.</p>
        <Link href="/parts" className="mt-4 inline-block text-[13px] font-medium text-graphite hover:underline">
          Browse products
        </Link>
      </div>
    );
  }

  const currency = cart.region?.currency_code || cart.currency_code || "INR";

  return (
    <div className="mt-6">
      <div style={{ borderTop: "1px solid var(--color-border)" }}>
        {cart.items.map((item) => (
          <div key={item.id} className="flex gap-4 py-4" style={{ borderBottom: "1px solid var(--color-border)" }}>
            <div className="relative h-16 w-16 shrink-0 overflow-hidden bg-surface-soft" style={{ borderRadius: "var(--radius-sm)" }}>
              {item.thumbnail ? (
                <Image src={item.thumbnail} alt={item.title} fill className="object-contain p-1" sizes="64px" />
              ) : (
                <div className="flex h-full items-center justify-center text-[11px] text-text-muted">&mdash;</div>
              )}
            </div>
            <div className="flex flex-1 flex-col justify-between">
              <div>
                <p className="text-[14px] font-semibold text-graphite">{item.title?.replace("[DEV] ", "")}</p>
                {item.variant?.sku && (
                  <p className="font-mono text-[11px] text-text-muted">{item.variant.sku}</p>
                )}
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                    className="flex h-8 w-8 items-center justify-center text-[13px] text-text-secondary hover:bg-surface-soft disabled:opacity-30"
                    style={{ border: "1px solid var(--color-border-strong)", borderRadius: "var(--radius-sm) 0 0 var(--radius-sm)" }}
                  >
                    &minus;
                  </button>
                  <span
                    className="flex h-8 w-8 items-center justify-center text-[13px] text-graphite"
                    style={{ borderTop: "1px solid var(--color-border-strong)", borderBottom: "1px solid var(--color-border-strong)" }}
                  >
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="flex h-8 w-8 items-center justify-center text-[13px] text-text-secondary hover:bg-surface-soft"
                    style={{ border: "1px solid var(--color-border-strong)", borderRadius: "0 var(--radius-sm) var(--radius-sm) 0" }}
                  >
                    +
                  </button>
                </div>
                <span className="text-[14px] font-semibold text-graphite">
                  {formatPrice(item.total, currency)}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => removeItem(item.id)}
              className="self-start text-text-muted hover:text-error"
              aria-label="Remove"
            >
              <Trash2 className="h-4 w-4" strokeWidth={1.6} />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4" style={{ borderTop: "1px solid var(--color-border)" }}>
        <div className="flex items-center justify-between">
          <span className="text-[14px] font-medium text-text-secondary">Total</span>
          <span className="text-[22px] font-bold text-graphite">
            {formatPrice(cart.total, currency)}
          </span>
        </div>
        <Link
          href="/checkout"
          className="mt-4 block w-full py-3 text-center text-[13px] font-semibold text-white transition-colors bg-graphite hover:bg-graphite-soft"
          style={{ borderRadius: "var(--radius-sm)" }}
        >
          Continue to Checkout
        </Link>
      </div>
    </div>
  );
}
