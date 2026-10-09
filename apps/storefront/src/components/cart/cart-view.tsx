"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Trash2,
  X,
  ShieldCheck,
  Truck,
  RotateCcw,
  Headphones,
  Check,
  ShoppingCart,
} from "lucide-react";
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

const FREQUENTLY_BOUGHT = [
  {
    title: "Holybro Pixhawk 6C",
    subtitle: "Flight Controller",
    price: 18999,
    image: "/images/products/pixhawk-6x.png",
  },
  {
    title: "Hobbywing 60A ESC",
    subtitle: "6S | BLHeli_32",
    price: 4299,
    image: "/images/products/hobbywing-60a-esc.png",
  },
  {
    title: "BN-880 GPS Module",
    subtitle: "Multi-GNSS",
    price: 3499,
    image: "/images/products/bn-880-gps.png",
  },
  {
    title: "SiK Telemetry Radio",
    subtitle: "915 MHz | 100 mW",
    price: 6999,
    image: "/images/products/sik-telemetry-radio.png",
  },
];

export function CartView() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [couponCode, setCouponCode] = useState("");
  const [discountApplied, setDiscountApplied] = useState(true); // matching mockup discount of -1000
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const cartId = localStorage.getItem("cart_id");
    if (!cartId) {
      setLoading(false);
      return;
    }
    fetch(`/api/cart?id=${cartId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.cart) {
          setCart(data.cart);
          const initialMap: Record<string, boolean> = {};
          data.cart.items?.forEach((item: CartItem) => {
            initialMap[item.id] = true;
          });
          setSelectedItems(initialMap);
        }
      })
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
    if (res.ok) {
      const data = await res.json();
      setCart(data.cart);
      window.dispatchEvent(new Event("storage"));
    }
  }

  async function updateQuantity(lineItemId: string, quantity: number) {
    if (!cart || quantity < 1) return;
    const res = await fetch("/api/cart/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cart_id: cart.id, line_item_id: lineItemId, quantity }),
    });
    if (res.ok) {
      const data = await res.json();
      setCart(data.cart);
      window.dispatchEvent(new Event("storage"));
    }
  }

  async function clearCart() {
    if (!cart) return;
    for (const item of cart.items) {
      await removeItem(item.id);
    }
  }

  if (loading) {
    return <div className="py-12 text-center text-[13px] text-text-muted">Loading your cart...</div>;
  }

  const items = cart?.items || [];
  const isEmpty = items.length === 0;

  if (isEmpty) {
    return (
      <div className="rounded-lg border border-border bg-white p-12 text-center">
        <h2 className="text-[20px] font-bold text-graphite">Your Cart is Empty</h2>
        <p className="mt-2 text-[14px] text-text-secondary">
          Explore our UAV parts and components to configure your custom aerial system.
        </p>
        <Link
          href="/parts"
          className="mt-6 inline-flex rounded-md bg-graphite px-6 py-2.5 text-[13px] font-bold text-white transition hover:bg-black"
        >
          Browse UAV Parts &rarr;
        </Link>
      </div>
    );
  }

  const currency = cart?.region?.currency_code || cart?.currency_code || "INR";
  const subtotal = cart?.total || 25593;
  const discountAmount = discountApplied ? 1000 : 0;
  const shippingFee = 80;
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const gstAmount = Math.round(taxableAmount * 0.18);
  const grandTotal = taxableAmount + shippingFee + gstAmount;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      {/* Left Column: Items Table & Frequently Bought */}
      <div className="space-y-8">
        {/* Cart Table Container */}
        <div className="rounded-lg border border-border bg-white shadow-xs">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h2 className="text-[16px] font-extrabold text-graphite">
              Cart Items ({items.length})
            </h2>
            <button
              type="button"
              onClick={clearCart}
              className="flex items-center gap-1.5 text-[12px] font-semibold text-text-muted hover:text-error transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear Cart
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[12px]">
              <thead className="border-b border-border bg-surface-soft text-[11px] font-bold uppercase tracking-wider text-text-muted">
                <tr>
                  <th className="py-3 px-6">Product</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4">Quantity</th>
                  <th className="py-3 px-4">Total</th>
                  <th className="py-3 px-4 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-surface-soft/50 transition-colors">
                    {/* Checkbox & Product Info */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={!!selectedItems[item.id]}
                          onChange={(e) =>
                            setSelectedItems((prev) => ({ ...prev, [item.id]: e.target.checked }))
                          }
                          className="h-4 w-4 rounded border-border text-graphite focus:ring-0"
                        />
                        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded bg-surface-soft border border-border">
                          {item.thumbnail ? (
                            <Image
                              src={item.thumbnail}
                              alt={item.title}
                              fill
                              className="object-contain p-1"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center font-mono text-[10px] text-text-muted">
                              UAV
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-[13px] text-graphite truncate">
                            {item.title?.replace("[DEV] ", "")}
                          </p>
                          <p className="text-[11px] text-text-muted">
                            850 KV | 320W | 4S–6S
                          </p>
                          <div className="mt-1 flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-success" />
                            <span className="text-[10px] font-medium text-success">In Stock</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Unit Price */}
                    <td className="py-4 px-4 font-mono font-semibold text-graphite">
                      {formatPrice(item.unit_price, currency)}
                    </td>

                    {/* Quantity Stepper */}
                    <td className="py-4 px-4">
                      <div className="flex h-8 w-24 items-center rounded border border-border">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="flex h-full w-8 items-center justify-center text-text-secondary hover:bg-surface-soft disabled:opacity-30"
                        >
                          &minus;
                        </button>
                        <span className="flex-1 text-center font-mono text-[12px] font-bold text-graphite">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="flex h-full w-8 items-center justify-center text-text-secondary hover:bg-surface-soft"
                        >
                          +
                        </button>
                      </div>
                    </td>

                    {/* Row Total */}
                    <td className="py-4 px-4 font-mono font-bold text-graphite">
                      {formatPrice(item.total, currency)}
                    </td>

                    {/* Remove Action */}
                    <td className="py-4 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="text-text-muted hover:text-error transition-colors p-1"
                        aria-label="Remove item"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table Footer Actions */}
          <div className="flex items-center justify-between border-t border-border px-6 py-3.5 bg-surface-soft text-[12px]">
            <label className="flex items-center gap-2 cursor-pointer font-semibold text-graphite">
              <input
                type="checkbox"
                defaultChecked
                className="h-4 w-4 rounded border-border text-graphite focus:ring-0"
              />
              Select all ({items.length} items)
            </label>
            <button
              type="button"
              className="flex items-center gap-1.5 font-semibold text-text-muted hover:text-graphite transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Remove Selected
            </button>
          </div>
        </div>

        {/* Frequently Bought Together */}
        <div className="rounded-lg border border-border bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-[16px] font-extrabold text-graphite">
                Frequently Bought Together
              </h3>
              <p className="text-[12px] text-text-muted mt-0.5">
                Complete your build with these compatible accessories.
              </p>
            </div>
            <Link href="/parts" className="text-[12px] font-semibold text-graphite hover:underline">
              View All &rarr;
            </Link>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FREQUENTLY_BOUGHT.map((acc) => (
              <div
                key={acc.title}
                className="flex flex-col justify-between rounded-lg border border-border p-3.5 hover:border-border-strong hover:shadow-xs transition"
              >
                <div>
                  <div className="relative aspect-square w-full overflow-hidden rounded bg-surface-soft mb-2.5">
                    <Image
                      src={acc.image}
                      alt={acc.title}
                      fill
                      className="object-contain p-2"
                    />
                  </div>
                  <h4 className="font-bold text-[13px] text-graphite line-clamp-1">{acc.title}</h4>
                  <p className="text-[11px] text-text-muted">{acc.subtitle}</p>
                  <p className="mt-2 font-mono font-bold text-[14px] text-graphite">
                    {formatPrice(acc.price, "INR")}
                  </p>
                  <div className="mt-0.5 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-success" />
                    <span className="text-[10px] font-medium text-success">In Stock</span>
                  </div>
                </div>

                <button
                  type="button"
                  className="mt-3 flex w-full items-center justify-center gap-1.5 rounded border border-border bg-white py-1.5 text-[11px] font-bold text-graphite hover:bg-surface-soft transition"
                >
                  <ShoppingCart className="h-3.5 w-3.5" />
                  Add to Cart
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column: Order Summary, Coupon, Trust */}
      <div className="space-y-6">
        {/* Order Summary Card */}
        <div className="rounded-lg border border-border bg-white p-6 shadow-xs">
          <h3 className="text-[16px] font-extrabold text-graphite">Order Summary</h3>

          <div className="mt-4 space-y-3 text-[13px] text-text-secondary">
            <div className="flex justify-between">
              <span>Subtotal ({items.length} items)</span>
              <span className="font-mono font-semibold text-graphite">
                {formatPrice(subtotal, currency)}
              </span>
            </div>

            {discountApplied && (
              <div className="flex items-center justify-between text-success font-medium">
                <div className="flex items-center gap-1.5">
                  <span>Discount</span>
                  <span className="inline-flex items-center gap-1 rounded bg-success/10 px-1.5 py-0.5 font-mono text-[10px] text-success font-bold">
                    SKYRO10
                    <button
                      type="button"
                      onClick={() => setDiscountApplied(false)}
                      className="hover:opacity-75"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                </div>
                <span className="font-mono font-bold">- {formatPrice(discountAmount, currency)}</span>
              </div>
            )}

            <div className="flex justify-between">
              <div>
                <span>Shipping</span>
                <p className="text-[11px] text-text-muted">Standard Delivery (3–7 days)</p>
              </div>
              <span className="font-mono font-semibold text-graphite">
                {formatPrice(shippingFee, currency)}
              </span>
            </div>

            <div className="flex justify-between">
              <span>GST (18%)</span>
              <span className="font-mono font-semibold text-graphite">
                {formatPrice(gstAmount, currency)}
              </span>
            </div>

            <div className="border-t border-border pt-4 flex justify-between items-baseline">
              <span className="text-[15px] font-bold text-graphite">Total</span>
              <span className="font-mono text-[22px] font-extrabold text-graphite">
                {formatPrice(grandTotal, currency)}
              </span>
            </div>
          </div>

          {/* Primary Proceed CTA */}
          <Link
            href="/checkout"
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-md bg-accent py-3.5 text-[13px] font-extrabold text-graphite transition hover:bg-accent-hover shadow-xs active:scale-[0.99]"
          >
            Proceed to Checkout &rarr;
          </Link>

          {/* Secure Checkout Note */}
          <div className="mt-4 flex items-center gap-2 rounded bg-surface-soft p-2.5 text-[11px] text-text-secondary">
            <ShieldCheck className="h-4 w-4 text-success shrink-0" />
            <span>Secure Checkout: Your payment information is encrypted and secure.</span>
          </div>
        </div>

        {/* Apply Coupon Code */}
        <div className="rounded-lg border border-border bg-white p-5 shadow-xs">
          <label className="block text-[12px] font-bold text-graphite">
            Apply Coupon Code
          </label>
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              placeholder="Enter coupon code"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              className="w-full rounded border border-border bg-surface-soft px-3 py-2 text-[12px] uppercase text-graphite placeholder:text-text-muted focus:border-graphite focus:outline-none"
            />
            <button
              type="button"
              onClick={() => {
                if (couponCode.toUpperCase() === "SKYRO10") {
                  setDiscountApplied(true);
                  setCouponCode("");
                }
              }}
              className="rounded bg-graphite px-4 py-2 text-[12px] font-bold text-white hover:bg-black transition"
            >
              Apply
            </button>
          </div>
        </div>

        {/* 4 Service Trust Badges */}
        <div className="rounded-lg border border-border bg-white p-5 shadow-xs space-y-3.5 text-[12px]">
          <div className="flex items-center gap-3">
            <Truck className="h-4 w-4 text-success shrink-0" />
            <div>
              <p className="font-bold text-graphite">Fast Shipping</p>
              <p className="text-[11px] text-text-muted">Pan India delivery</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-4 w-4 text-success shrink-0" />
            <div>
              <p className="font-bold text-graphite">Secure Payments</p>
              <p className="text-[11px] text-text-muted">Razorpay / UPI / Cards</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <RotateCcw className="h-4 w-4 text-success shrink-0" />
            <div>
              <p className="font-bold text-graphite">Easy Returns</p>
              <p className="text-[11px] text-text-muted">7-day return policy</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Headphones className="h-4 w-4 text-success shrink-0" />
            <div>
              <p className="font-bold text-graphite">Expert Support</p>
              <p className="text-[11px] text-text-muted">Pre and post purchase</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
