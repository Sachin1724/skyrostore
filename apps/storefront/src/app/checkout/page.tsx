import Link from "next/link";
import { Lock } from "lucide-react";
import { SkyroLogo } from "@/components/brand/logo";
import { CheckoutForm } from "@/components/checkout/checkout-form";

export const metadata = { title: "Checkout" };

/** Focused checkout: logo, secure note and a way back to the cart; no store navigation. */
export default function CheckoutPage() {
  return (
    <>
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex h-16 max-w-[1376px] items-center justify-between gap-4 px-4 md:px-8">
          <Link href="/" aria-label="Skyrostore home"><SkyroLogo /></Link>
          <p className="flex items-center gap-2 text-[14px] font-semibold text-navy">
            <Lock className="h-4 w-4 text-success" aria-hidden /> Secure checkout
          </p>
        </div>
      </header>
      <main id="main" className="min-h-screen bg-page pb-20">
        <div className="mx-auto max-w-[1376px] px-4 md:px-8">
          <div className="flex flex-wrap items-baseline justify-between gap-3 pb-5 pt-6">
            <h1 className="text-[clamp(1.6rem,1.2rem+1.4vw,2.1rem)] font-extrabold tracking-[-0.03em] text-navy">Checkout</h1>
            <Link href="/cart" className="text-[14px] font-semibold text-brand hover:text-navy">Back to cart</Link>
          </div>
          <CheckoutForm />
        </div>
      </main>
      <footer className="border-t border-border bg-white">
        <p className="mx-auto max-w-[1376px] px-4 py-5 text-[13px] text-text-secondary md:px-8">
          Payments by Razorpay ·{" "}
          <Link href="/policies/refunds" className="hover:text-brand">Returns</Link> ·{" "}
          <Link href="/support" className="hover:text-brand">Help</Link>
        </p>
      </footer>
    </>
  );
}
