import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CartView } from "@/components/cart/cart-view";

export const metadata = { title: "Your cart — Skyrostore" };

export default function CartPage() {
  return (
    <>
      <Header />
      <main id="main" className="min-h-screen bg-page pb-20">
        <div className="mx-auto max-w-[1376px] px-4 md:px-8">
          <h1 className="pb-5 pt-6 text-[clamp(1.6rem,1.2rem+1.4vw,2.1rem)] font-extrabold tracking-[-0.03em] text-navy">Your Cart</h1>
          <CartView />
        </div>
      </main>
      <Footer />
    </>
  );
}
