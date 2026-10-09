import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CartView } from "@/components/cart/cart-view";
import Image from "next/image";

export const metadata = { title: "Review Your Cart — Skyrostore" };

export default function CartPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-surface-soft">
        {/* Cart Top Banner */}
        <section className="relative overflow-hidden border-b border-border bg-graphite text-white">
          <div className="mx-auto flex max-w-[1280px] flex-col justify-between px-8 py-8 md:flex-row md:items-center md:px-10">
            <div className="relative z-10 max-w-xl">
              <span className="text-[11px] font-bold uppercase tracking-widest text-accent">
                YOUR CART
              </span>
              <h1 className="mt-2 text-[32px] font-extrabold tracking-tight md:text-[38px]">
                Review Your Cart
              </h1>
              <p className="mt-1.5 text-[14px] text-text-disabled">
                Check your items, adjust quantities and proceed to checkout.
              </p>
            </div>
            {/* Banner Drone Graphic Asset */}
            <div className="pointer-events-none relative mt-4 h-24 w-full max-w-[450px] md:mt-0 md:h-28">
              <Image
                src="/images/hero/cart-hero-drone.png"
                alt="Cart Aerial Platform"
                fill
                className="object-contain object-right"
              />
            </div>
          </div>
        </section>

        {/* 3-Step Progress Stepper */}
        <section className="border-b border-border bg-white">
          <div className="mx-auto flex max-w-[700px] items-center justify-between px-8 py-4">
            {/* Step 1: Cart */}
            <div className="flex items-center gap-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent font-bold text-[12px] text-graphite shadow-xs">
                1
              </div>
              <div>
                <p className="text-[12px] font-bold text-graphite">Cart</p>
                <p className="text-[10px] text-text-muted">Review items</p>
              </div>
            </div>
            <div className="h-px flex-1 bg-border mx-4" />

            {/* Step 2: Checkout */}
            <div className="flex items-center gap-3 opacity-60">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-muted font-bold text-[12px] text-text-secondary">
                2
              </div>
              <div>
                <p className="text-[12px] font-bold text-graphite">Checkout</p>
                <p className="text-[10px] text-text-muted">Address &amp; payment</p>
              </div>
            </div>
            <div className="h-px flex-1 bg-border mx-4" />

            {/* Step 3: Confirmation */}
            <div className="flex items-center gap-3 opacity-60">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-muted font-bold text-[12px] text-text-secondary">
                3
              </div>
              <div>
                <p className="text-[12px] font-bold text-graphite">Confirmation</p>
                <p className="text-[10px] text-text-muted">Order placed</p>
              </div>
            </div>
          </div>
        </section>

        {/* Main Cart Grid */}
        <section className="mx-auto max-w-[1280px] px-8 py-8 md:px-10">
          <CartView />
        </section>
      </main>
      <Footer />
    </>
  );
}
