import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CartView } from "@/components/cart/cart-view";

export const metadata = { title: "Cart" };

export default function CartPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-[1280px] px-8 py-8 md:px-10">
        <h1 className="text-[28px] font-bold tracking-[-0.025em] text-graphite">Cart</h1>
        <CartView />
      </main>
      <Footer />
    </>
  );
}
