import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CheckoutForm } from "@/components/checkout/checkout-form";

export const metadata = { title: "Checkout" };

export default function CheckoutPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-[1280px] px-8 py-8 md:px-10">
        <h1 className="text-[28px] font-bold tracking-[-0.025em] text-graphite">Checkout</h1>
        <CheckoutForm />
      </main>
      <Footer />
    </>
  );
}
