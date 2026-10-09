import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CheckoutForm } from "@/components/checkout/checkout-form";

export const metadata = { title: "Checkout — Skyrostore" };

export default function CheckoutPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-surface-soft">
        {/* 4-Step Progress Stepper */}
        <section className="border-b border-border bg-white">
          <div className="mx-auto flex max-w-[840px] items-center justify-between px-8 py-5">
            {/* Step 1: Shipping */}
            <div className="flex items-center gap-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent font-bold text-[12px] text-graphite shadow-xs">
                1
              </div>
              <div>
                <p className="text-[12px] font-bold text-graphite">Shipping</p>
                <p className="text-[10px] text-text-muted">Address &amp; delivery</p>
              </div>
            </div>
            <div className="h-px flex-1 bg-border mx-3" />

            {/* Step 2: Payment */}
            <div className="flex items-center gap-3 opacity-60">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-muted font-bold text-[12px] text-text-secondary">
                2
              </div>
              <div>
                <p className="text-[12px] font-bold text-graphite">Payment</p>
                <p className="text-[10px] text-text-muted">Secure payment</p>
              </div>
            </div>
            <div className="h-px flex-1 bg-border mx-3" />

            {/* Step 3: Review */}
            <div className="flex items-center gap-3 opacity-60">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-muted font-bold text-[12px] text-text-secondary">
                3
              </div>
              <div>
                <p className="text-[12px] font-bold text-graphite">Review</p>
                <p className="text-[10px] text-text-muted">Confirm your order</p>
              </div>
            </div>
            <div className="h-px flex-1 bg-border mx-3" />

            {/* Step 4: Complete */}
            <div className="flex items-center gap-3 opacity-60">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-muted font-bold text-[12px] text-text-secondary">
                4
              </div>
              <div>
                <p className="text-[12px] font-bold text-graphite">Complete</p>
                <p className="text-[10px] text-text-muted">Order placed</p>
              </div>
            </div>
          </div>
        </section>

        {/* Checkout Main 2-Column Section */}
        <section className="mx-auto max-w-[1280px] px-8 py-8 md:px-10">
          <CheckoutForm />
        </section>
      </main>
      <Footer />
    </>
  );
}
