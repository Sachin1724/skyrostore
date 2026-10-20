"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  ShieldCheck,
  Truck,
  FileText,
  Headphones,
  ChevronDown,
  CreditCard,
  Building,
  Wallet,
  Smartphone,
} from "lucide-react";
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
  items: CartItem[];
  total: number;
  subtotal: number;
  shipping_total: number;
  currency_code: string;
};

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi",
];

export function CheckoutForm() {
  const router = useRouter();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [shippingMethod, setShippingMethod] = useState<"standard" | "express" | "sameday">("standard");
  const [paymentTab, setPaymentTab] = useState<"upi" | "cards" | "netbanking" | "wallets">("upi");
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Form fields
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [gst, setGst] = useState("");
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("Odisha");
  const [pinCode, setPinCode] = useState("");

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

  function loadRazorpayScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if ((window as any).Razorpay) return resolve();
      const s = document.createElement("script");
      s.src = "https://checkout.razorpay.com/v1/checkout.js";
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("Failed to load Razorpay SDK"));
      document.head.appendChild(s);
    });
  }

  function openRazorpayModal(options: {
    key_id: string;
    order_id: string;
    amount: number;
    currency: string;
    name: string;
    email: string;
    phone: string;
  }): Promise<{ razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }> {
    return new Promise((resolve, reject) => {
      const rzp = new (window as any).Razorpay({
        key: options.key_id,
        amount: options.amount,
        currency: options.currency,
        name: options.name || "Skyrostore",
        description: "UAV Components Order",
        order_id: options.order_id,
        prefill: { email: options.email, contact: options.phone },
        handler: (response: any) => resolve(response),
        modal: { ondismiss: () => reject(new Error("Payment cancelled")) },
        theme: { color: "#181B20" },
      });
      rzp.on("payment.failed", (response: any) => {
        reject(new Error(response.error?.description || "Payment failed"));
      });
      rzp.open();
    });
  }

  async function handleCompleteOrder(e: React.FormEvent) {
    e.preventDefault();
    if (!cart) return;
    setSubmitting(true);
    setError("");

    // Lets the server attribute each checkout step to this browser session.
    const journey = { session_id: getSessionId().id, visitor_id: getVisitorId() };

    try {
      // 1. Set customer address
      const custRes = await fetch("/api/cart/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...journey,
          cart_id: cart.id,
          step: "customer",
          email,
          shipping_address: {
            first_name: fullName.split(" ")[0] || "Customer",
            last_name: fullName.split(" ").slice(1).join(" ") || "UAV",
            address_1: address1,
            city,
            province: state,
            postal_code: pinCode,
            country_code: "in",
            phone,
          },
        }),
      });
      if (!custRes.ok) {
        const custData = await custRes.json();
        throw new Error(custData.error || "Failed to save shipping address");
      }

      // 2. Set shipping method
      const shipRes = await fetch("/api/cart/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...journey,
          cart_id: cart.id,
          step: "shipping",
        }),
      });
      if (!shipRes.ok) {
        const shipData = await shipRes.json();
        throw new Error(shipData.error || "Failed to select shipping method");
      }

      // 3. Initialize payment session with Medusa
      const payRes = await fetch("/api/cart/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...journey,
          cart_id: cart.id,
          step: "payment",
        }),
      });
      if (!payRes.ok) {
        const payData = await payRes.json();
        throw new Error(payData.error || "Failed to initialize payment session");
      }
      const payData = await payRes.json();

      // 4. Razorpay modal flow if provider is Razorpay
      const isRazorpay = payData.provider_id === "pp_razorpay";
      const sessionData = payData.payment_session?.data;

      if (isRazorpay && sessionData?.razorpay_order_id) {
        await loadRazorpayScript();
        const rzpResponse = await openRazorpayModal({
          key_id: sessionData.razorpay_key_id,
          order_id: sessionData.razorpay_order_id,
          amount: sessionData.amount,
          currency: sessionData.currency || "INR",
          name: "Skyrostore",
          email,
          phone,
        });

        // Server-side verification — browser callback alone cannot mark order paid
        const verifyRes = await fetch("/api/cart/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...journey,
            cart_id: cart.id,
            step: "verify-payment",
            payment_collection_id: payData.payment_collection_id,
            payment_session_id: payData.payment_session?.id,
            razorpay_order_id: rzpResponse.razorpay_order_id,
            razorpay_payment_id: rzpResponse.razorpay_payment_id,
            razorpay_signature: rzpResponse.razorpay_signature,
          }),
        });
        if (!verifyRes.ok) {
          const verifyData = await verifyRes.json();
          throw new Error(verifyData.error || "Payment verification failed");
        }
      }

      // 5. Complete order
      const completeRes = await fetch("/api/cart/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...journey,
          cart_id: cart.id,
          step: "complete",
        }),
      });

      const completeData = await completeRes.json();
      const placedOrder = completeData.order || (completeData.type === "order" ? completeData.order : null);
      if (placedOrder?.id) {
        localStorage.removeItem("cart_id");
        window.dispatchEvent(new Event("storage"));
        router.push(`/checkout/confirmation?order_id=${placedOrder.id}`);
      } else {
        throw new Error(completeData.error || completeData.message || "Order placement could not be verified by backend");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unable to place order. Please review details.";
      // Records that the attempt stopped here. A cancelled payment modal is not
      // a payment failure, so no payment outcome is claimed.
      track("checkout_step_failed", {
        cart_id: cart.id,
        checkout_step: "payment",
        metadata: { reason: /cancel/i.test(msg) ? "customer_cancelled" : "client_error" },
      });
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  const items = cart?.items || [];
  const subtotal = items.reduce((s, it) => s + it.total, 0);
  const shippingFee = shippingMethod === "standard" ? 80 : shippingMethod === "express" ? 150 : 250;
  const gstAmount = Math.round(subtotal * 0.18);
  const grandTotal = subtotal + shippingFee + gstAmount;

  if (!loading && items.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-white p-12 text-center shadow-xs">
        <h2 className="text-[20px] font-bold text-graphite">Your Cart is Empty</h2>
        <p className="mt-2 text-[14px] text-text-secondary">
          Add UAV parts or systems from our catalog before checking out.
        </p>
        <Link
          href="/parts"
          className="mt-6 inline-flex rounded-md bg-graphite px-6 py-2.5 text-[13px] font-bold text-white transition hover:bg-black"
        >
          Browse UAV Catalog &rarr;
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleCompleteOrder} className="grid gap-8 lg:grid-cols-[1fr_380px]">
      {/* Left Column: Multi-Section Form */}
      <div className="space-y-6">
        {error && (
          <div className="rounded-md border border-rose-200 bg-rose-50 p-4 text-[13px] text-rose-800">
            <p className="font-semibold text-rose-900">Checkout Error</p>
            <p className="mt-0.5">{error}</p>
          </div>
        )}

        {/* Step 1: Shipping Address */}
        <div className="rounded-lg border border-border bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div className="flex items-center gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-[12px] font-bold text-graphite">
                1
              </span>
              <h2 className="text-[17px] font-extrabold text-graphite">Shipping Address</h2>
            </div>
            <p className="text-[12px] text-text-secondary">
              Already have an account?{" "}
              <Link href="/account" className="font-semibold text-graphite hover:underline">
                Sign in
              </Link>
            </p>
          </div>

          {/* Address Tabs */}
          <div className="mt-4 flex gap-4 border-b border-border text-[12px]">
            <button
              type="button"
              className="border-b-2 border-transparent pb-2 font-medium text-text-muted hover:text-graphite"
            >
              Use saved address
            </button>
            <button
              type="button"
              className="border-b-2 border-accent pb-2 font-bold text-graphite"
            >
              Add new address
            </button>
          </div>

          {/* Form Fields */}
          <div className="mt-5 space-y-4 text-[12px]">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block font-semibold text-graphite">Full Name *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  className="mt-1 w-full rounded border border-border bg-white px-3 py-2 text-graphite focus:border-graphite focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-graphite">Phone Number *</label>
                <div className="mt-1 flex">
                  <span className="flex items-center rounded-l border border-r-0 border-border bg-surface-soft px-3 text-text-muted font-mono">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter phone number"
                    className="w-full rounded-r border border-border bg-white px-3 py-2 text-graphite focus:border-graphite focus:outline-none font-mono"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-graphite">Email Address *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="mt-1 w-full rounded border border-border bg-white px-3 py-2 text-graphite focus:border-graphite focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block font-semibold text-graphite">Company Name (Optional)</label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Enter company name"
                  className="mt-1 w-full rounded border border-border bg-white px-3 py-2 text-graphite focus:border-graphite focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-graphite">GST Number (Optional)</label>
                <input
                  type="text"
                  value={gst}
                  onChange={(e) => setGst(e.target.value)}
                  placeholder="Enter GST number"
                  className="mt-1 w-full rounded border border-border bg-white px-3 py-2 text-graphite uppercase font-mono focus:border-graphite focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-graphite">Address Line 1 *</label>
              <input
                type="text"
                required
                value={address1}
                onChange={(e) => setAddress1(e.target.value)}
                placeholder="House, Building, Street address"
                className="mt-1 w-full rounded border border-border bg-white px-3 py-2 text-graphite focus:border-graphite focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-graphite">Address Line 2 (Optional)</label>
              <input
                type="text"
                value={address2}
                onChange={(e) => setAddress2(e.target.value)}
                placeholder="Apartment, Floor, Landmark"
                className="mt-1 w-full rounded border border-border bg-white px-3 py-2 text-graphite focus:border-graphite focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block font-semibold text-graphite">City *</label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Enter city"
                  className="mt-1 w-full rounded border border-border bg-white px-3 py-2 text-graphite focus:border-graphite focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-graphite">State *</label>
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="mt-1 w-full rounded border border-border bg-white px-3 py-2 text-graphite focus:border-graphite focus:outline-none"
                >
                  {INDIAN_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-graphite">PIN Code *</label>
                <input
                  type="text"
                  required
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value)}
                  placeholder="Enter PIN code"
                  className="mt-1 w-full rounded border border-border bg-white px-3 py-2 text-graphite font-mono focus:border-graphite focus:outline-none"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer pt-2 font-medium text-graphite">
              <input
                type="checkbox"
                defaultChecked
                className="h-4 w-4 rounded border-border text-graphite focus:ring-0"
              />
              Save this address for future orders
            </label>
          </div>
        </div>

        {/* Step 2: Shipping Method */}
        <div className="rounded-lg border border-border bg-white p-6 shadow-xs">
          <div className="flex items-center gap-3 border-b border-border pb-4">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-[12px] font-bold text-graphite">
              2
            </span>
            <h2 className="text-[17px] font-extrabold text-graphite">Shipping Method</h2>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Standard Delivery */}
            <div
              onClick={() => setShippingMethod("standard")}
              className={`relative cursor-pointer rounded-lg border p-4 transition-all ${
                shippingMethod === "standard"
                  ? "border-accent ring-1 ring-accent bg-surface-soft"
                  : "border-border bg-white hover:border-border-strong"
              }`}
            >
              <div className="flex items-center justify-between">
                <Truck className="h-5 w-5 text-graphite" />
                {shippingMethod === "standard" && (
                  <Check className="h-4 w-4 text-success" strokeWidth={2.5} />
                )}
              </div>
              <h3 className="mt-3 text-[13px] font-bold text-graphite">Standard Delivery</h3>
              <p className="text-[11px] text-text-muted mt-0.5">3–7 business days</p>
              <p className="mt-2 font-mono font-bold text-[14px] text-graphite">₹80</p>
              <p className="mt-1 text-[10px] text-text-muted">Reliable delivery across India</p>
            </div>

            {/* Express Delivery */}
            <div
              onClick={() => setShippingMethod("express")}
              className={`relative cursor-pointer rounded-lg border p-4 transition-all ${
                shippingMethod === "express"
                  ? "border-accent ring-1 ring-accent bg-surface-soft"
                  : "border-border bg-white hover:border-border-strong"
              }`}
            >
              <div className="flex items-center justify-between">
                <Truck className="h-5 w-5 text-graphite" />
                {shippingMethod === "express" && (
                  <Check className="h-4 w-4 text-success" strokeWidth={2.5} />
                )}
              </div>
              <h3 className="mt-3 text-[13px] font-bold text-graphite">Express Delivery</h3>
              <p className="text-[11px] text-text-muted mt-0.5">1–3 business days</p>
              <p className="mt-2 font-mono font-bold text-[14px] text-graphite">₹150</p>
              <p className="mt-1 text-[10px] text-text-muted">Faster delivery for urgent orders</p>
            </div>

            {/* Same Day (Metro) */}
            <div
              onClick={() => setShippingMethod("sameday")}
              className={`relative cursor-pointer rounded-lg border p-4 transition-all ${
                shippingMethod === "sameday"
                  ? "border-accent ring-1 ring-accent bg-surface-soft"
                  : "border-border bg-white hover:border-border-strong"
              }`}
            >
              <div className="flex items-center justify-between">
                <Truck className="h-5 w-5 text-graphite" />
                {shippingMethod === "sameday" && (
                  <Check className="h-4 w-4 text-success" strokeWidth={2.5} />
                )}
              </div>
              <h3 className="mt-3 text-[13px] font-bold text-graphite">Same Day (Metro)</h3>
              <p className="text-[11px] text-text-muted mt-0.5">Within 24 hours</p>
              <p className="mt-2 font-mono font-bold text-[14px] text-graphite">₹250</p>
              <p className="mt-1 text-[10px] text-text-muted">Available in select cities</p>
            </div>
          </div>
        </div>

        {/* Step 3: Payment Method */}
        <div className="rounded-lg border border-border bg-white p-6 shadow-xs">
          <div className="flex items-center gap-3 border-b border-border pb-4">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-[12px] font-bold text-graphite">
              3
            </span>
            <h2 className="text-[17px] font-extrabold text-graphite">Payment Method</h2>
          </div>

          {/* Payment Tabs */}
          <div className="mt-4 flex gap-4 border-b border-border text-[12px]">
            {[
              { id: "upi", label: "UPI (Recommended)" },
              { id: "cards", label: "Cards" },
              { id: "netbanking", label: "Net Banking" },
              { id: "wallets", label: "Wallets" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setPaymentTab(tab.id as typeof paymentTab)}
                className={`border-b-2 pb-2 font-semibold transition-colors ${
                  paymentTab === tab.id
                    ? "border-accent text-graphite"
                    : "border-transparent text-text-muted hover:text-graphite"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* UPI Active Content */}
          <div className="mt-5 rounded-lg border border-accent bg-surface-soft p-5">
            <div className="flex items-center gap-3">
              <input
                type="radio"
                name="payment"
                defaultChecked
                className="h-4 w-4 text-graphite focus:ring-0"
              />
              <div>
                <p className="text-[13px] font-bold text-graphite">Pay with UPI</p>
                <p className="text-[11px] text-text-muted">
                  Use any UPI app (PhonePe, Google Pay, Paytm, etc.)
                </p>
              </div>
            </div>

            {/* UPI Apps Icons Row */}
            <div className="mt-4 flex flex-wrap items-center gap-3 pt-3 border-t border-border">
              {["GPay", "PhonePe", "Paytm", "BHIM", "Amazon Pay", "Other UPI"].map((app) => (
                <span
                  key={app}
                  className="rounded border border-border bg-white px-3 py-1 font-mono text-[11px] font-semibold text-graphite shadow-xs"
                >
                  {app}
                </span>
              ))}
            </div>
          </div>

          {/* Billing Address Checkbox */}
          <div className="mt-5 pt-3">
            <label className="flex items-center gap-2 cursor-pointer text-[12px] font-medium text-graphite">
              <input
                type="checkbox"
                checked={billingSameAsShipping}
                onChange={(e) => setBillingSameAsShipping(e.target.checked)}
                className="h-4 w-4 rounded border-border text-graphite focus:ring-0"
              />
              Billing address is the same as shipping address
            </label>
          </div>

          {/* Review Order Button */}
          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 rounded-md bg-graphite px-8 py-3 text-[13px] font-bold text-white transition hover:bg-black shadow-xs active:scale-[0.99] disabled:opacity-50"
            >
              {submitting ? "Placing Order..." : "Review Order →"}
            </button>
          </div>
        </div>
      </div>

      {/* Right Column: Order Summary & Why Shop */}
      <div className="space-y-6">
        {/* Order Summary */}
        <div className="rounded-lg border border-border bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-[16px] font-extrabold text-graphite">
              Order Summary ({items.length} items)
            </h3>
            <Link href="/cart" className="text-[12px] font-semibold text-graphite hover:underline">
              Edit Cart
            </Link>
          </div>

          {/* Items list */}
          <div className="mt-4 space-y-3.5 divide-y divide-border">
            {items.map((item) => (
              <div key={item.id} className="flex gap-3 pt-3 first:pt-0">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded bg-surface-soft border border-border">
                  {item.thumbnail ? (
                    <Image src={item.thumbnail} alt={item.title} fill className="object-contain p-1" />
                  ) : (
                    <div className="flex h-full items-center justify-center font-mono text-[10px] text-text-muted">
                      UAV
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-[12px] text-graphite truncate">{item.title}</p>
                  <p className="text-[10px] text-text-muted">Qty: {item.quantity}</p>
                </div>
                <span className="font-mono font-bold text-[13px] text-graphite">
                  {formatPrice(item.total, "INR")}
                </span>
              </div>
            ))}
          </div>

          {/* Discount code accordion */}
          <div className="mt-5 border-t border-border pt-4">
            <details className="text-[12px]">
              <summary className="flex cursor-pointer items-center justify-between font-semibold text-graphite">
                <span>Apply Discount Code</span>
                <ChevronDown className="h-4 w-4 text-text-muted" />
              </summary>
              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  placeholder="Promo Code"
                  className="w-full rounded border border-border bg-surface-soft px-3 py-1.5 text-[11px] uppercase focus:border-graphite focus:outline-none"
                />
                <button type="button" className="rounded bg-graphite px-3 py-1.5 text-[11px] font-bold text-white">
                  Apply
                </button>
              </div>
            </details>
          </div>

          {/* Financial Breakdown */}
          <div className="mt-5 space-y-2.5 border-t border-border pt-4 text-[12px] text-text-secondary">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-mono font-semibold text-graphite">{formatPrice(subtotal, "INR")}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping ({shippingMethod})</span>
              <span className="font-mono font-semibold text-graphite">{formatPrice(shippingFee, "INR")}</span>
            </div>
            <div className="flex justify-between">
              <span>GST (18%)</span>
              <span className="font-mono font-semibold text-graphite">{formatPrice(gstAmount, "INR")}</span>
            </div>
            <div className="border-t border-border pt-3 flex justify-between items-baseline font-bold text-graphite">
              <span className="text-[14px]">Total</span>
              <span className="font-mono text-[20px] font-extrabold">{formatPrice(grandTotal, "INR")}</span>
            </div>
          </div>

          {/* Secure Checkout Note */}
          <div className="mt-5 flex items-center gap-2 rounded bg-surface-soft p-2.5 text-[11px] text-text-secondary">
            <ShieldCheck className="h-4 w-4 text-success shrink-0" />
            <span>Secure Checkout: Your payment information is encrypted and secure.</span>
          </div>
        </div>

        {/* Why Shop with Skyrostore */}
        <div className="rounded-lg border border-border bg-white p-5 shadow-xs space-y-3.5 text-[12px]">
          <h4 className="font-extrabold text-[13px] text-graphite">Why Shop with Skyrostore?</h4>
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-4 w-4 text-success shrink-0" />
            <div>
              <p className="font-bold text-graphite">Genuine Products</p>
              <p className="text-[10px] text-text-muted">Sourced from trusted brands</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Truck className="h-4 w-4 text-success shrink-0" />
            <div>
              <p className="font-bold text-graphite">Fast Shipping</p>
              <p className="text-[10px] text-text-muted">Pan India delivery</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <FileText className="h-4 w-4 text-success shrink-0" />
            <div>
              <p className="font-bold text-graphite">GST Invoicing</p>
              <p className="text-[10px] text-text-muted">For businesses and organizations</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Headphones className="h-4 w-4 text-success shrink-0" />
            <div>
              <p className="font-bold text-graphite">Expert Support</p>
              <p className="text-[10px] text-text-muted">Pre and post purchase assistance</p>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
