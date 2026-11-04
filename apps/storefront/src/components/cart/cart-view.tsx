"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Truck,
  ShieldCheck,
  FileText,
  Tag,
  ArrowRight,
  CheckCircle2,
  Trash2,
  Bookmark,
  RotateCcw,
  Loader2,
  Lock,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { track } from "@/lib/analytics";
import { ProductMediaFallback } from "@/components/product/product-media-fallback";

const FREE_SHIPPING_THRESHOLD = 500000; // Rs 5,000 in paise
const SAVED_ITEMS_KEY = "skyro_saved_for_later_v1";

type CartItem = {
  id: string;
  title: string;
  product_title?: string | null;
  product_handle?: string | null;
  quantity: number;
  unit_price: number;
  total: number;
  thumbnail?: string | null;
  variant_id?: string;
  variant?: { id?: string; title?: string; sku?: string | null };
};

type Cart = {
  id: string;
  items: CartItem[];
  total: number;
  currency_code: string;
  region?: { currency_code: string };
  promotions?: Array<{ id: string; code: string; value?: number }>;
};

interface SavedItem {
  id: string;
  variantId: string;
  title: string;
  handle: string | null;
  unitPrice: number;
  thumbnail: string | null;
  currency: string;
}

export function CartView() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingItemId, setPendingItemId] = useState<string | null>(null);
  const [cartMessage, setCartMessage] = useState("");
  const [lastRemovedItem, setLastRemovedItem] = useState<{
    variantId?: string;
    quantity: number;
    title: string;
  } | null>(null);

  // Promo code state
  const [promoInput, setPromoInput] = useState("");
  const [promoError, setPromoError] = useState("");
  const [promoSuccess, setPromoSuccess] = useState("");
  const [promoPending, setPromoPending] = useState(false);

  // Saved for Later state
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [isPending, startTransition] = useTransition();

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

    // Load saved for later items
    try {
      const stored = localStorage.getItem(SAVED_ITEMS_KEY);
      if (stored) setSavedItems(JSON.parse(stored));
    } catch {
      // Fallback
    }
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
      window.dispatchEvent(new CustomEvent("skyro:cart_updated"));
      track("cart_item_removed", {
        cart_id: cart.id,
        line_item_id: lineItemId,
        quantity: removed?.quantity ?? null,
      });

      if (removed) {
        setLastRemovedItem({
          variantId: removed.variant_id ?? removed.variant?.id,
          quantity: removed.quantity,
          title: (removed.product_title ?? removed.title)?.replace("[DEV] ", ""),
        });
      }
      setCartMessage(`${removed?.title ?? "Item"} removed.`);
    } else {
      setCartMessage("Item could not be removed. Please try again.");
    }
    setPendingItemId(null);
  }

  async function undoRemove() {
    if (!cart || !lastRemovedItem?.variantId || isPending) return;

    startTransition(async () => {
      try {
        const res = await fetch("/api/cart/add", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            variantId: lastRemovedItem.variantId,
            quantity: lastRemovedItem.quantity,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.cart) setCart(data.cart);
          setLastRemovedItem(null);
          setCartMessage("Item restored to cart.");
          window.dispatchEvent(new CustomEvent("skyro:cart_updated"));
        }
      } catch {
        // Fallback
      }
    });
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
      window.dispatchEvent(new CustomEvent("skyro:cart_updated"));
      track("cart_item_quantity_changed", {
        cart_id: cart.id,
        line_item_id: lineItemId,
        quantity,
        metadata: { previous_quantity: previous },
      });
      setCartMessage(`Quantity updated to ${quantity}.`);
    } else {
      setCartMessage("Quantity could not be updated. Please try again.");
    }
    setPendingItemId(null);
  }

  async function saveForLater(item: CartItem) {
    const variantId = item.variant_id ?? item.variant?.id;
    if (!variantId) return;

    const saved: SavedItem = {
      id: item.id,
      variantId,
      title: (item.product_title ?? item.title)?.replace("[DEV] ", ""),
      handle: item.product_handle ?? null,
      unitPrice: item.unit_price,
      thumbnail: item.thumbnail ?? null,
      currency: cart?.currency_code ?? "inr",
    };

    const nextSaved = [saved, ...savedItems.filter((i) => i.variantId !== variantId)];
    setSavedItems(nextSaved);
    localStorage.setItem(SAVED_ITEMS_KEY, JSON.stringify(nextSaved));

    await removeItem(item.id);
    setCartMessage(`${saved.title} moved to Saved for Later.`);
  }

  async function moveToCart(saved: SavedItem) {
    startTransition(async () => {
      try {
        const res = await fetch("/api/cart/add", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ variantId: saved.variantId, quantity: 1 }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.cart) setCart(data.cart);
          const nextSaved = savedItems.filter((i) => i.variantId !== saved.variantId);
          setSavedItems(nextSaved);
          localStorage.setItem(SAVED_ITEMS_KEY, JSON.stringify(nextSaved));
          window.dispatchEvent(new CustomEvent("skyro:cart_updated"));
          setCartMessage(`${saved.title} moved back to cart.`);
        }
      } catch {
        // Fallback
      }
    });
  }

  function removeSavedItem(variantId: string) {
    const nextSaved = savedItems.filter((i) => i.variantId !== variantId);
    setSavedItems(nextSaved);
    localStorage.setItem(SAVED_ITEMS_KEY, JSON.stringify(nextSaved));
  }

  async function handleApplyPromo(e: React.FormEvent) {
    e.preventDefault();
    if (!cart?.id || !promoInput.trim()) return;

    setPromoPending(true);
    setPromoError("");
    setPromoSuccess("");

    try {
      const res = await fetch("/api/cart/promotions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cart_id: cart.id, promo_code: promoInput.trim() }),
      });

      const data = await res.json();
      if (res.ok && data.cart) {
        setCart(data.cart);
        setPromoSuccess(`Coupon ${promoInput.toUpperCase()} applied successfully.`);
        setPromoInput("");
      } else {
        setPromoError(data.error || "Promotion code is invalid or expired.");
      }
    } catch {
      setPromoError("Failed to apply promotion code.");
    } finally {
      setPromoPending(false);
    }
  }

  if (loading) {
    return (
      <div role="status" aria-label="Loading your cart" className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="skeleton h-72 rounded-xl" />
        <div className="skeleton h-80 rounded-xl" />
      </div>
    );
  }

  const items = cart?.items || [];
  const currency = cart?.region?.currency_code || cart?.currency_code || "INR";
  const itemsTotal = items.reduce((s, it) => s + it.total, 0);
  const units = items.reduce((s, it) => s + it.quantity, 0);
  const qualifiesForFreeShipping = itemsTotal >= FREE_SHIPPING_THRESHOLD;
  const shippingRemaining = Math.max(0, FREE_SHIPPING_THRESHOLD - itemsTotal);
  const shippingPercent = Math.min(100, Math.round((itemsTotal / FREE_SHIPPING_THRESHOLD) * 100));

  // 18% GST calculation on tax-inclusive pricing
  const estimatedGstPaise = Math.round((itemsTotal * 18) / 118);

  if (items.length === 0) {
    return (
      <div className="space-y-10">
        <div className="card p-8 md:p-14 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-soft text-brand">
            <Truck className="h-8 w-8" aria-hidden />
          </div>
          <h2 className="mt-4 text-[22px] md:text-[28px] font-extrabold text-navy">
            Your shopping cart is currently empty
          </h2>
          <p className="mt-2 text-[16px] text-text-secondary max-w-[48ch] mx-auto">
            Browse our catalogue of verified brushless motors, digital autopilots, and airframes to build your fleet.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/parts"
              className="btn btn-primary"
            >
              Shop UAV Parts
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link
              href="/build"
              className="btn btn-secondary"
            >
              Launch Build Configurator
            </Link>
          </div>
        </div>

        {/* Saved for Later Shelf even when cart is empty */}
        {savedItems.length > 0 ? (
          <section aria-labelledby="saved-for-later-empty-heading" className="card p-6">
            <h3 id="saved-for-later-empty-heading" className="text-[18px] font-extrabold text-navy">
              Saved for Later ({savedItems.length})
            </h3>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {savedItems.map((saved) => (
                <div key={saved.variantId} className="flex flex-col justify-between rounded-lg border border-border p-3.5">
                  <div className="relative aspect-square w-full rounded bg-surface-soft overflow-hidden">
                    {saved.thumbnail ? (
                      <Image src={saved.thumbnail} alt={saved.title} fill sizes="160px" className="object-contain p-2" />
                    ) : (
                      <ProductMediaFallback title={saved.title} />
                    )}
                  </div>
                  <div className="mt-2.5">
                    <h4 className="text-[13px] font-bold text-navy line-clamp-2">{saved.title}</h4>
                    <p className="mt-1 text-[14px] font-extrabold text-navy">{formatPrice(saved.unitPrice, saved.currency)}</p>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => moveToCart(saved)}
                      className="flex-1 rounded bg-navy py-1.5 text-[13px] font-bold text-white hover:bg-brand"
                    >
                      Move to Cart
                    </button>
                    <button
                      type="button"
                      onClick={() => removeSavedItem(saved.variantId)}
                      className="rounded border border-border p-1.5 text-text-muted hover:text-error"
                      aria-label="Remove item"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Free Shipping Progress Indicator */}
      <section
        aria-label="Shipping threshold tracker"
        className="card p-4 md:p-5"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Truck className={`h-5 w-5 ${qualifiesForFreeShipping ? "text-success" : "text-brand"}`} aria-hidden />
            <span className="text-[14px] font-bold text-navy">
              {qualifiesForFreeShipping ? (
                <span className="text-success font-extrabold">
                  You have unlocked FREE Tracked Air Express Shipping across India!
                </span>
              ) : (
                <span>
                  Add <strong className="text-brand tabular-nums">{formatPrice(shippingRemaining, currency)}</strong> more to unlock <strong className="text-navy">FREE Air Express Shipping</strong>
                </span>
              )}
            </span>
          </div>
          <span className="text-[13px] font-bold tabular-nums text-text-muted">
            {shippingPercent}%
          </span>
        </div>

        {/* Progress Bar Track */}
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-surface-soft border border-border/60">
          <div
            className={`h-full transition-all duration-300 ease-out ${
              qualifiesForFreeShipping ? "bg-success" : "bg-brand"
            }`}
            style={{ width: `${shippingPercent}%` }}
          />
        </div>
      </section>

      {/* Undo Notification Banner */}
      {lastRemovedItem ? (
        <div className="flex items-center justify-between rounded-lg border border-border bg-brand-soft px-4 py-3 text-[13px] text-navy">
          <span>
            Removed <strong>{lastRemovedItem.title}</strong> from your cart.
          </span>
          <button
            type="button"
            onClick={undoRemove}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 font-bold text-brand hover:underline"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden />
            <span>Undo</span>
          </button>
        </div>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
        {/* Cart items list */}
        <div className="space-y-6">
          <p aria-live="polite" role="status" className="sr-only">
            {cartMessage}
          </p>

          <ul className="divide-y divide-border card px-4 md:px-6">
            {items.map((item) => {
              const title = (item.product_title ?? item.title)?.replace("[DEV] ", "");
              const busy = pendingItemId === item.id;
              return (
                <li key={item.id} className="flex flex-col sm:flex-row gap-4 py-5">
                  {/* Thumbnail */}
                  <div className="relative h-24 w-24 shrink-0 rounded-lg bg-surface-soft overflow-hidden border border-border">
                    {item.thumbnail ? (
                      <Image
                        src={item.thumbnail}
                        alt=""
                        fill
                        sizes="96px"
                        className="object-contain p-2"
                      />
                    ) : (
                      <ProductMediaFallback title={title} />
                    )}
                  </div>

                  {/* Body & Actions */}
                  <div className="min-w-0 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          {item.product_handle ? (
                            <Link
                              href={`/products/${item.product_handle}`}
                              className="text-[16px] font-bold leading-snug text-navy hover:text-brand transition-colors line-clamp-2"
                            >
                              {title}
                            </Link>
                          ) : (
                            <p className="text-[16px] font-bold leading-snug text-navy line-clamp-2">
                              {title}
                            </p>
                          )}
                          {item.variant?.title && item.variant.title !== "Default Variant" ? (
                            <p className="mt-0.5 text-[13px] text-text-secondary">
                              Variant: {item.variant.title}
                            </p>
                          ) : null}
                          <p className="mt-1 text-[14px] tabular-nums text-text-secondary">
                            {formatPrice(item.unit_price, currency)} each
                          </p>
                        </div>

                        <p className="shrink-0 text-[18px] font-extrabold tabular-nums text-navy">
                          {formatPrice(item.total, currency)}
                        </p>
                      </div>
                    </div>

                    {/* Stepper + Save for later + Remove */}
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-border/50">
                      <div
                        className="flex h-9 items-center rounded-md border border-border bg-white"
                        role="group"
                        aria-label={`Quantity of ${title}`}
                      >
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1 || busy}
                          aria-label={`Decrease quantity of ${title}`}
                          className="flex h-full w-9 items-center justify-center text-navy hover:bg-surface-soft disabled:opacity-30"
                        >
                          -
                        </button>
                        <span className="w-8 text-center text-[14px] font-bold tabular-nums text-navy">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={busy}
                          aria-label={`Increase quantity of ${title}`}
                          className="flex h-full w-9 items-center justify-center text-navy hover:bg-surface-soft disabled:opacity-30"
                        >
                          +
                        </button>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => saveForLater(item)}
                          disabled={busy}
                          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-text-secondary hover:text-brand transition-colors"
                        >
                          <Bookmark className="h-3.5 w-3.5" aria-hidden />
                          <span>Save for Later</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          disabled={busy}
                          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-text-secondary hover:text-error transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          {/* Saved for Later Shelf */}
          {savedItems.length > 0 ? (
            <section aria-labelledby="saved-for-later-heading" className="card p-5 md:p-6">
              <h3 id="saved-for-later-heading" className="text-[16px] font-extrabold text-navy">
                Saved for Later ({savedItems.length})
              </h3>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {savedItems.map((saved) => (
                  <div key={saved.variantId} className="flex flex-col justify-between rounded-lg border border-border bg-surface-soft/40 p-3.5">
                    <div>
                      <div className="relative aspect-square w-full rounded bg-white overflow-hidden border border-border/60">
                        {saved.thumbnail ? (
                          <Image src={saved.thumbnail} alt={saved.title} fill sizes="160px" className="object-contain p-2" />
                        ) : (
                          <ProductMediaFallback title={saved.title} />
                        )}
                      </div>
                      <div className="mt-2.5">
                        <h4 className="text-[13px] font-bold text-navy line-clamp-2">{saved.title}</h4>
                        <p className="mt-1 text-[14px] font-extrabold text-navy">{formatPrice(saved.unitPrice, saved.currency)}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2 pt-2 border-t border-border">
                      <button
                        type="button"
                        onClick={() => moveToCart(saved)}
                        className="flex-1 rounded bg-navy py-1.5 text-[13px] font-bold text-white hover:bg-brand transition-colors"
                      >
                        Move to Cart
                      </button>
                      <button
                        type="button"
                        onClick={() => removeSavedItem(saved.variantId)}
                        className="rounded border border-border p-1.5 text-text-muted hover:text-error transition-colors"
                        aria-label="Remove item"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </div>

        {/* Order Summary Sidebar */}
        <div className="card p-6 lg:sticky lg:top-[120px]">
          <h2 className="text-[18px] font-extrabold text-navy border-b border-border pb-3">
            Order Summary
          </h2>

          <dl className="mt-4 space-y-2.5 text-[14px] text-text-secondary">
            <div className="flex justify-between gap-4">
              <dt>Items Subtotal ({units} {units === 1 ? "unit" : "units"})</dt>
              <dd className="tabular-nums font-semibold text-navy">{formatPrice(itemsTotal, currency)}</dd>
            </div>

            <div className="flex justify-between gap-4">
              <dt className="flex items-center gap-1">
                <span>Estimated 18% GST</span>
              </dt>
              <dd className="tabular-nums text-text-secondary font-medium">
                {formatPrice(estimatedGstPaise, currency)}
              </dd>
            </div>

            <div className="flex justify-between gap-4">
              <dt>Tracked Delhivery Shipping</dt>
              <dd className="text-right font-bold text-success">
                {qualifiesForFreeShipping ? "FREE" : "Flat Rate"}
              </dd>
            </div>

            <div className="flex items-baseline justify-between gap-4 border-t border-border pt-3">
              <dt className="text-[16px] font-extrabold text-navy">Order Total</dt>
              <dd className="text-[24px] font-extrabold tabular-nums text-navy">
                {formatPrice(itemsTotal, currency)}
              </dd>
            </div>
          </dl>

          <p className="mt-1 text-[13px] text-text-muted">
            Includes all statutory Indian GST taxes. ITC tax invoice generated upon confirmation.
          </p>

          {/* Promo code coupon input */}
          <div className="mt-5 border-t border-border pt-4">
            <form onSubmit={handleApplyPromo} className="space-y-2">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" aria-hidden />
                  <input
                    type="text"
                    value={promoInput}
                    onChange={(e) => {
                      setPromoInput(e.target.value);
                      if (promoError) setPromoError("");
                    }}
                    placeholder="Coupon code"
                    className="h-10 w-full rounded-md border border-border bg-surface-soft pl-9 pr-3 text-[13px] uppercase tracking-wider text-navy placeholder:normal-case placeholder:tracking-normal placeholder:text-text-muted focus:border-brand focus:bg-white focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!promoInput.trim() || promoPending}
                  className="h-10 rounded-md border border-border-strong bg-surface-soft px-4 text-[13px] font-bold text-navy hover:bg-navy hover:text-white disabled:opacity-40 transition-colors"
                >
                  {promoPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : "Apply"}
                </button>
              </div>

              {promoSuccess ? (
                <p className="text-[13px] font-bold text-success flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                  {promoSuccess}
                </p>
              ) : null}
              {promoError ? (
                <p className="text-[13px] font-semibold text-error">
                  {promoError}
                </p>
              ) : null}
            </form>
          </div>

          {/* Checkout CTA */}
          <Link
            href="/checkout"
            className="btn btn-primary mt-6 flex w-full"
          >
            <span>Proceed to Checkout</span>
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>

          {/* Trust Guarantees */}
          <div className="mt-5 space-y-2 border-t border-border pt-4 text-[13px] text-text-secondary">
            <div className="flex items-center gap-2">
              <Lock className="h-3.5 w-3.5 text-brand shrink-0" aria-hidden />
              <span>Razorpay Secured · UPI, Cards, NetBanking</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="h-3.5 w-3.5 text-brand shrink-0" aria-hidden />
              <span>Orders before 2 PM dispatch same business day</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="h-3.5 w-3.5 text-brand shrink-0" aria-hidden />
              <span>Full GST Tax Invoices for ITC Claims</span>
            </div>
          </div>

          <div className="mt-4 text-center">
            <Link
              href="/parts"
              className="text-[13px] font-semibold text-brand hover:text-navy transition-colors"
            >
              &larr; Continue Shopping UAV Parts
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
