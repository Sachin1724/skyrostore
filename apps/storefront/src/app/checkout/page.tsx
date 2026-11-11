import Link from "next/link";
import { Lock } from "lucide-react";
import { SkyroLogo } from "@/components/brand/logo";
import { CheckoutForm } from "@/components/checkout/checkout-form";

export const metadata = { title: "Checkout" };

/** Focused checkout: logo, secure note and a way back to the cart; no store navigation. */
export default function CheckoutPage() {
  return (
    <>
      <header className="bg-white">
        <div className="mx-auto flex h-16 max-w-[1760px] items-center justify-between gap-4 px-4 md:px-8">
          <Link href="/" aria-label="Skyrostore home"><SkyroLogo /></Link>
          <p className="flex items-center gap-2 text-[14px] font-semibold text-navy">
            <Lock className="h-4 w-4 text-success" aria-hidden /> Secure checkout
          </p>
        </div>
      </header>
      <main id="main" className="min-h-screen bg-page pb-20">
        <div className="mx-auto max-w-[920px] px-4 md:px-8">
          <h1 className="pb-6 pt-8 text-[clamp(1.6rem,1.2rem+1.4vw,2.1rem)] font-semibold text-navy">Checkout</h1>
          <CheckoutForm />
        </div>
      </main>
      <footer className="bg-white">
        <p className="mx-auto max-w-[1760px] px-4 py-5 text-[13px] text-text-secondary md:px-8">
          <Link href="/policies/refunds" className="hover:text-brand">Returns</Link> ·{" "}
          <Link href="/support" className="hover:text-brand">Help</Link>
        </p>
      </footer>
    </>
  );
}
