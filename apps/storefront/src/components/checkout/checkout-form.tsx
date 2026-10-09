"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/utils";

type CheckoutStep = "loading" | "address" | "shipping" | "payment" | "completing" | "done";

type CartItem = {
  id: string;
  title: string;
  quantity: number;
  unit_price: number;
  total: number;
};

type Cart = {
  id: string;
  items: CartItem[];
  total: number;
  subtotal: number;
  shipping_total: number;
  currency_code: string;
  email?: string;
};

const inputClass =
  "w-full px-3 py-3 text-[14px] text-graphite bg-surface placeholder:text-text-disabled focus:outline-none";
const inputStyle = {
  borderRadius: "var(--radius-sm)",
  border: "1px solid var(--color-border-strong)",
};
const inputFocusStyle = "focus:ring-2 focus:ring-graphite/8 focus:border-graphite";

export function CheckoutForm() {
  const router = useRouter();
  const [step, setStep] = useState<CheckoutStep>("loading");
  const [cart, setCart] = useState<Cart | null>(null);
  const [error, setError] = useState("");

  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [address1, setAddress1] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    const cartId = localStorage.getItem("cart_id");
    if (!cartId) { setStep("address"); return; }
    fetch(`/api/cart?id=${cartId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.cart?.items?.length) setCart(data.cart);
        setStep("address");
      })
      .catch(() => setStep("address"));
  }, []);

  async function checkoutStep(stepName: string, extra?: Record<string, unknown>) {
    setError("");
    const res = await fetch("/api/cart/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cart_id: cart?.id, step: stepName, ...extra }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error || "Something went wrong"); return null; }
    if (data.cart) setCart(data.cart);
    return data;
  }

  async function handleAddress(e: React.FormEvent) {
    e.preventDefault();
    if (!cart) return;
    const result = await checkoutStep("customer", {
      email,
      shipping_address: {
        first_name: firstName, last_name: lastName, address_1: address1,
        city, province, postal_code: postalCode, country_code: "in", phone,
      },
    });
    if (result) setStep("shipping");
  }

  async function handleShipping() {
    if (await checkoutStep("shipping")) setStep("payment");
  }

  async function handlePayment() {
    if (!(await checkoutStep("payment"))) return;
    setStep("completing");
    const result = await checkoutStep("complete");
    if (result?.order) {
      localStorage.removeItem("cart_id");
      router.push(`/checkout/confirmation?order_id=${result.order.id}`);
    } else {
      setError("Order completion failed");
      setStep("payment");
    }
  }

  if (step === "loading") return <p className="mt-6 text-[13px] text-text-muted">Loading...</p>;

  if (!cart || cart.items.length === 0) {
    return (
      <div className="mt-6">
        <p className="text-[14px] text-text-secondary">Your cart is empty.</p>
        <a href="/parts" className="mt-2 inline-block text-[13px] font-medium text-graphite hover:underline">
          Browse products
        </a>
      </div>
    );
  }

  const currency = cart.currency_code || "inr";

  return (
    <div className="mt-6 grid gap-8 lg:grid-cols-[3fr_2fr]">
      {/* Form */}
      <div>
        {error && (
          <div className="mb-4 px-4 py-3 text-[13px] font-medium text-error" style={{ borderRadius: "var(--radius-sm)", background: "var(--color-error-soft)" }}>
            {error}
          </div>
        )}

        {step === "address" && (
          <form onSubmit={handleAddress} className="space-y-4">
            <h2 className="text-[18px] font-bold tracking-[-0.025em] text-graphite">Contact & Shipping</h2>

            <div>
              <label className="mb-1 block text-[12px] font-semibold text-graphite">Email</label>
              <input type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className={`${inputClass} ${inputFocusStyle}`} style={inputStyle} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-[12px] font-semibold text-graphite">First name</label>
                <input required placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} className={`${inputClass} ${inputFocusStyle}`} style={inputStyle} />
              </div>
              <div>
                <label className="mb-1 block text-[12px] font-semibold text-graphite">Last name</label>
                <input required placeholder="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} className={`${inputClass} ${inputFocusStyle}`} style={inputStyle} />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-[12px] font-semibold text-graphite">Address</label>
              <input required placeholder="Address" value={address1} onChange={(e) => setAddress1(e.target.value)} className={`${inputClass} ${inputFocusStyle}`} style={inputStyle} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-[12px] font-semibold text-graphite">City</label>
                <input required placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} className={`${inputClass} ${inputFocusStyle}`} style={inputStyle} />
              </div>
              <div>
                <label className="mb-1 block text-[12px] font-semibold text-graphite">State</label>
                <input required placeholder="State" value={province} onChange={(e) => setProvince(e.target.value)} className={`${inputClass} ${inputFocusStyle}`} style={inputStyle} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-[12px] font-semibold text-graphite">PIN code</label>
                <input required placeholder="PIN code" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} className={`${inputClass} ${inputFocusStyle}`} style={inputStyle} />
              </div>
              <div>
                <label className="mb-1 block text-[12px] font-semibold text-graphite">Phone</label>
                <input placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} className={`${inputClass} ${inputFocusStyle}`} style={inputStyle} />
              </div>
            </div>

            <button type="submit" className="w-full py-3 text-[13px] font-semibold text-white bg-graphite transition-colors hover:bg-graphite-soft" style={{ borderRadius: "var(--radius-sm)" }}>
              Continue to Shipping
            </button>
          </form>
        )}

        {step === "shipping" && (
          <div>
            <h2 className="text-[18px] font-bold tracking-[-0.025em] text-graphite">Shipping</h2>
            <p className="mt-3 text-[14px] text-text-secondary">Standard Shipping (Free)</p>
            <button type="button" onClick={handleShipping} className="mt-4 w-full py-3 text-[13px] font-semibold text-white bg-graphite transition-colors hover:bg-graphite-soft" style={{ borderRadius: "var(--radius-sm)" }}>
              Continue to Payment
            </button>
          </div>
        )}

        {step === "payment" && (
          <div>
            <h2 className="text-[18px] font-bold tracking-[-0.025em] text-graphite">Payment</h2>
            <p className="mt-3 text-[14px] text-text-secondary">
              Test mode — payment processed using system provider.
            </p>
            <button type="button" onClick={handlePayment} className="mt-4 w-full py-3 text-[13px] font-semibold text-white bg-graphite transition-colors hover:bg-graphite-soft" style={{ borderRadius: "var(--radius-sm)" }}>
              Place Order &mdash; {formatPrice(cart.total, currency)}
            </button>
          </div>
        )}

        {step === "completing" && (
          <div>
            <h2 className="text-[18px] font-bold tracking-[-0.025em] text-graphite">Processing...</h2>
            <p className="mt-3 text-[14px] text-text-secondary">Creating your order. Do not close this page.</p>
          </div>
        )}
      </div>

      {/* Order summary */}
      <div>
        <div className="bg-surface p-5" style={{ borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}>
          <h3 className="text-[14px] font-semibold text-graphite">Order Summary</h3>
          <div className="mt-3">
            {cart.items.map((item) => (
              <div key={item.id} className="flex justify-between py-2 text-[13px]" style={{ borderBottom: "1px solid var(--color-border)" }}>
                <span className="text-text-secondary">
                  {item.title?.replace("[DEV] ", "")} &times; {item.quantity}
                </span>
                <span className="font-medium text-graphite">
                  {formatPrice(item.total, currency)}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3" style={{ borderTop: "1px solid var(--color-border)" }}>
            <div className="flex justify-between text-[13px]">
              <span className="text-text-muted">Subtotal</span>
              <span className="text-graphite">{formatPrice(cart.subtotal, currency)}</span>
            </div>
            <div className="mt-1 flex justify-between text-[13px]">
              <span className="text-text-muted">Shipping</span>
              <span className="text-graphite">{formatPrice(cart.shipping_total || 0, currency)}</span>
            </div>
            <div className="mt-3 flex justify-between pt-3" style={{ borderTop: "1px solid var(--color-border)" }}>
              <span className="text-[14px] font-medium text-graphite">Total</span>
              <span className="text-[20px] font-bold text-graphite">{formatPrice(cart.total, currency)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
