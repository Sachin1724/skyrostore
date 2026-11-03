import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CheckoutForm } from "@/components/checkout/checkout-form";

export const metadata = { title: "Checkout — Skyrostore" };

export default function CheckoutPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-surface-soft px-5 pb-24 md:px-10">
        <h1 className="pt-10 pb-10 text-[clamp(2.5rem,1.6rem+3.6vw,4.5rem)] font-bold leading-[0.95] tracking-[-0.04em] text-navy lg:pt-16">
          Checkout
        </h1>
        <CheckoutForm />
      </main>
      <Footer />
    </>
  );
}
