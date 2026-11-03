"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck, Truck, FileText, Headphones, Lock, MapPin, Smartphone } from "lucide-react";
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
      <div className="rounded-lg border border-border bg-white p-12 text-center">
        <h2 className="text-[20px] font-bold text-navy">Your Cart is Empty</h2>
        <p className="mt-2 text-[14px] text-text-secondary">
          Add UAV parts or systems from our catalog before checking out.
        </p>
        <Link
          href="/parts"
          className="mt-6 inline-flex h-11 items-center rounded-md bg-brand px-6 text-[15px] font-bold text-white transition-colors hover:bg-navy"
        >
          Shop Parts
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
      <div className="space-y-6">
        {error && (
          <div
            role="alert"
            aria-live="assertive"
            className="rounded-md border border-rose-200 bg-rose-50 p-4 text-[13px] text-rose-800"
          >
            <p className="font-semibold text-rose-900">Payment not completed</p>
            <p className="mt-0.5">{error}</p>
          </div>
        )}

        <div className="rounded-lg border border-border bg-white p-6">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <h2 className="text-[17px] font-extrabold text-navy">Your details</h2>
            {!cart?.email ? (
              <p className="text-[14px] text-text-secondary">
                Have an account?{" "}
                <Link href="/account" className="font-semibold text-navy hover:underline">
                  Sign in
                </Link>
              </p>
            ) : (
              <p className="text-[14px] text-text-secondary">{cart.email}</p>
            )}
          </div>

          <ol className="mt-5 space-y-4 text-[13px]">
            <li className="flex gap-3">
              <Smartphone className="mt-0.5 h-4 w-4 shrink-0 text-navy" />
              <div>
                <p className="font-bold text-navy">Enter your mobile number</p>
                <p className="text-text-muted">Razorpay remembers your saved addresses across stores.</p>
              </div>
            </li>
            <li className="flex gap-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-navy" />
              <div>
                <p className="font-bold text-navy">Pick or add a delivery address</p>
                <p className="text-text-muted">We confirm courier delivery to your PIN code instantly.</p>
              </div>
            </li>
            <li className="flex gap-3">
              <Lock className="mt-0.5 h-4 w-4 shrink-0 text-navy" />
              <div>
                <p className="font-bold text-navy">Pay with UPI, card, net banking or wallet</p>
                <p className="text-text-muted">Your order is confirmed the moment payment succeeds.</p>
              </div>
            </li>
          </ol>

          <button
            type="button"
            onClick={handlePay}
            disabled={submitting || loading || !items.length}
            className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-md bg-brand px-8 text-[16px] font-bold text-white transition-colors hover:bg-navy disabled:opacity-50"
          >
            {submitting ? "Opening Razorpay…" : loading ? "Loading your cart…" : "Buy Now"}
          </button>
          <p className="mt-2 flex items-center justify-center gap-1 text-[13px] text-text-muted">
            <Lock className="h-3 w-3" />
            Secured by Razorpay
          </p>
        </div>
      </div>

      {/* Right Column: Order Summary & Why Shop */}
      <div className="space-y-6">
        {/* Order Summary */}
        <div className="rounded-lg border border-border bg-white p-6">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-[16px] font-extrabold text-navy">
              Order Summary{loading ? "" : ` (${items.reduce((n, i) => n + i.quantity, 0)} ${items.length === 1 && items[0].quantity === 1 ? "item" : "items"})`}
            </h3>
            <Link href="/cart" className="text-[14px] font-semibold text-navy hover:underline">
              Edit Cart
            </Link>
          </div>

          {/* Items list */}
          {loading ? (
            <div role="status" aria-label="Loading your order" className="mt-4 space-y-3">
              <div className="skeleton h-12" />
              <div className="skeleton h-24" />
            </div>
          ) : (
          <>
          <div className="mt-4 space-y-3.5 divide-y divide-border">
            {items.map((item) => (
              <div key={item.id} className="flex gap-3 pt-3 first:pt-0">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded bg-surface-soft border border-border">
                  {item.thumbnail ? (
                    <Image src={item.thumbnail} alt="" fill sizes="48px" className="object-contain p-1" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[13px] text-text-muted">
                      UAV
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-[14px] text-navy truncate">{item.title}</p>
                  <p className="text-[13px] text-text-muted">Qty: {item.quantity}</p>
                </div>
                <span className="font-bold tabular-nums text-[13px] text-navy">
                  {formatPrice(item.total, "INR")}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-5 space-y-2.5 border-t border-border pt-4 text-[14px] text-text-secondary">
            <div className="flex justify-between">
              <span>Items</span>
              <span className="font-semibold tabular-nums text-navy">{formatPrice(itemsTotal, "INR")}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span className="text-navy">Shown in payment window</span>
            </div>
            <div className="border-t border-border pt-3 flex justify-between items-baseline font-bold text-navy">
              <span className="text-[14px]">Items total</span>
              <span className="text-[20px] font-extrabold tabular-nums">{formatPrice(itemsTotal, "INR")}</span>
            </div>
          </div>
          </>
          )}

          {/* Secure Checkout Note */}
          <div className="mt-5 flex items-center gap-2 rounded-md bg-surface-soft p-2.5 text-[13px] text-text-secondary">
            <ShieldCheck className="h-4 w-4 shrink-0 text-success" aria-hidden />
            <span>Card and UPI details are entered in Razorpay's window, never on this site.</span>
          </div>
        </div>

        <ul className="space-y-3 rounded-lg border border-border bg-white p-5 text-[14px]">
          {[
            { icon: Truck, title: "Tracked delivery", text: "Courier tracking number by email once booked" },
            { icon: FileText, title: "GST invoice", text: "With every order; prices include GST" },
            { icon: Headphones, title: "Help with your order", text: "Contact support from your order page" },
          ].map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex items-center gap-3">
              <Icon className="h-5 w-5 shrink-0 text-brand" aria-hidden />
              <span>
                <span className="block font-bold text-navy">{title}</span>
                <span className="block text-[13px] text-text-secondary">{text}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
