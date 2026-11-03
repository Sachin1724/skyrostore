import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CartView } from "@/components/cart/cart-view";

export const metadata = { title: "Your cart — Skyrostore" };

export default function CartPage() {
  return (
    <>
      <Header />
      <main id="main" className="min-h-screen bg-surface-soft px-5 pb-24 md:px-10">
        <h1 className="pt-10 pb-10 text-[clamp(2.5rem,1.6rem+3.6vw,4.5rem)] font-bold leading-[0.95] tracking-[-0.04em] text-navy lg:pt-16">
          Your cart
        </h1>
        <CartView />
      </main>
      <Footer />
    </>
  );
}
