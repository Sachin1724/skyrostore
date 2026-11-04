"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { getSessionId, getVisitorId, track } from "@/lib/analytics";

type CartItem = {
  id: string;
  title: string;
  quantity: number;
  unit_price: number;
  total: number;
  thumbnail?: string | null;
};

type Cart = {
  id: string;
  email?: string | null;
  items: CartItem[];
  total: number;
  subtotal: number;
  shipping_total: number;
  currency_code: string;
};

type RazorpayResponse = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };

function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).Razorpay) return resolve();
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/magic-checkout.js";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Could not load Razorpay. Check your connection and try again."));
    document.head.appendChild(s);
  });
}

/**
 * Razorpay Magic Checkout: the customer enters phone, address and payment in
 * one Razorpay window (saved addresses autofill by phone number), so this page
 * has no address form.
 */
function openMagicCheckout(options: { key_id: string; order_id: string; email?: string | null }): Promise<RazorpayResponse> {
  return new Promise((resolve, reject) => {
    const rzp = new (window as any).Razorpay({
      key: options.key_id,
      order_id: options.order_id,
      one_click_checkout: true,
      show_coupons: false,
      name: "Skyrostore",
      description: "UAV components order",
      prefill: options.email ? { email: options.email } : {},
      handler: (response: RazorpayResponse) => resolve(response),
      modal: { ondismiss: () => reject(new Error("Payment cancelled")) },
      theme: { color: "#0A1A2F" },
    });
    rzp.on("payment.failed", (response: any) => {
      reject(new Error(response.error?.description || "Payment failed"));
    });
    rzp.open();
  });
}

export function CheckoutForm() {
  const router = useRouter();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

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
          track("checkout_started", {
            cart_id: data.cart.id,
            value: data.cart.total ?? null,
            currency_code: data.cart.currency_code ?? null,
            checkout_step: "customer",
            quantity: (data.cart.items || []).reduce(
              (sum: number, item: CartItem) => sum + Number(item.quantity || 0),
              0
            ),
          });
        }
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  async function handlePay() {
    // Guard against a double click creating two payment sessions.
    if (!cart || submitting) return;
    setSubmitting(true);
    setError("");

    // Lets the server attribute each checkout step to this browser session.
    const journey = { session_id: getSessionId().id, visitor_id: getVisitorId() };
    const step = async (name: string, extra: Record<string, unknown> = {}) => {
      const res = await fetch("/api/cart/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...journey, cart_id: cart.id, step: name, ...extra }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Checkout could not continue. Please try again.");
      return data;
    };

    try {
      await step("customer");
      await step("shipping");
      const payData = await step("payment");
      const sessionData = payData.payment_session?.data;

      let orderId: string | undefined;
      if (payData.provider_id === "pp_razorpay" && sessionData?.razorpay_order_id) {
        await loadRazorpayScript();
        const rzp = await openMagicCheckout({
          key_id: sessionData.razorpay_key_id,
          order_id: sessionData.razorpay_order_id,
          email: cart.email,
        });
        // The server verifies the payment, takes the address from Razorpay and
        // places the order. A missed browser callback is covered by the webhook.
        orderId = (await step("confirm", rzp)).order?.id;
      } else {
        orderId = (await step("complete")).order?.id;
      }

      if (!orderId) throw new Error("Order placement could not be verified. Please contact support.");
      localStorage.removeItem("cart_id");
      window.dispatchEvent(new Event("storage"));
      router.push(`/checkout/confirmation?order_id=${orderId}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unable to place order. Please try again.";
      // A cancelled payment window is not a payment failure.
      track("checkout_step_failed", {
        cart_id: cart.id,
        checkout_step: "payment",
        metadata: { reason: /cancel/i.test(msg) ? "customer_cancelled" : "client_error" },
      });
      setError(/cancel/i.test(msg) ? "Payment window closed. Your cart is saved — pay whenever you are ready." : msg);
    } finally {
      setSubmitting(false);
    }
  }

  const items = cart?.items || [];
  const itemsTotal = items.reduce((s, it) => s + it.total, 0);

  if (!loading && items.length === 0) {
    return (
      <div className="card p-12 text-center">
        <h2 className="text-[20px] font-bold text-navy">Your Cart is Empty</h2>
        <p className="mt-2 text-[14px] text-text-secondary">
          Add UAV parts or systems from our catalog before checking out.
        </p>
        <Link
          href="/parts"
          className="btn btn-primary mt-6"
        >
          Shop Parts
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
      {/* What you are buying, first: the only thing still worth checking here. */}
      <div className="card p-6">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[16px] font-medium text-navy">
            {loading ? "Your order" : `Your order · ${items.reduce((n, i) => n + i.quantity, 0)} ${items.reduce((n, i) => n + i.quantity, 0) === 1 ? "item" : "items"}`}
          </h2>
          <Link href="/cart" className="text-[14px] font-medium text-brand hover:text-navy">
            Edit
          </Link>
        </div>

        {loading ? (
          <div role="status" aria-label="Loading your order" className="mt-5 space-y-3">
            <div className="skeleton h-14" />
            <div className="skeleton h-14" />
          </div>
        ) : (
          <ul className="mt-5 space-y-4">
            {items.map((item) => (
              <li key={item.id} className="flex items-center gap-3">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-surface-soft">
                  {item.thumbnail ? (
                    <Image src={item.thumbnail} alt="" fill sizes="56px" className="object-contain p-1.5" />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] text-navy">{item.title}</p>
                  <p className="text-[13px] text-text-muted">Qty {item.quantity}</p>
                </div>
                <span className="shrink-0 text-[14px] tabular-nums text-navy">{formatPrice(item.total, "INR")}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Pay. One number, one button, one promise. */}
      <div className="card p-6 lg:sticky lg:top-6">
        {error && (
          <div role="alert" aria-live="assertive" className="mb-5 rounded-lg bg-error-soft p-4 text-[13px] text-error">
            <p className="font-medium">Payment not completed</p>
            <p className="mt-0.5">{error}</p>
          </div>
        )}

        <dl className="space-y-2.5 text-[14px]">
          <div className="flex justify-between">
            <dt className="text-text-secondary">Items</dt>
            <dd className="tabular-nums text-navy">{formatPrice(itemsTotal, "INR")}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-text-secondary">Delivery</dt>
            <dd className="text-text-secondary">Shown before you pay</dd>
          </div>
          <div className="flex items-baseline justify-between pt-2.5">
            <dt className="text-[15px] font-medium text-navy">Total</dt>
            <dd className="text-[24px] font-semibold tabular-nums text-navy">{formatPrice(itemsTotal, "INR")}</dd>
          </div>
        </dl>
        <p className="mt-1 text-right text-[13px] text-text-muted">Includes GST</p>

        <button
          type="button"
          onClick={handlePay}
          disabled={submitting || loading || !items.length}
          className="btn btn-primary mt-5 w-full"
        >
          {submitting ? "Opening Razorpay…" : loading ? "Loading your cart…" : `Pay ${formatPrice(itemsTotal, "INR")}`}
        </button>

        <p className="mt-3 flex items-start gap-2 text-[13px] leading-relaxed text-text-secondary">
          <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" aria-hidden />
          Razorpay opens next for your address and payment. Card and UPI details are never entered on this site.
        </p>

        {!cart?.email ? (
          <p className="mt-4 text-[13px] text-text-secondary">
            Have an account?{" "}
            <Link href="/account" className="font-medium text-brand hover:text-navy">
              Sign in
            </Link>{" "}
            to keep this order with your others.
          </p>
        ) : (
          <p className="mt-4 text-[13px] text-text-muted">Ordering as {cart.email}</p>
        )}
      </div>
    </div>
  );
}
