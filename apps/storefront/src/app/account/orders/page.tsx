import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { OrderList } from "@/components/account/order-list";

export const metadata = { title: "My Orders" };

export default function OrdersPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-[960px] px-8 py-8 md:px-10">
        <h1 className="text-[28px] font-bold tracking-[-0.025em] text-graphite">My Orders</h1>
        <OrderList />
      </main>
      <Footer />
    </>
  );
}
