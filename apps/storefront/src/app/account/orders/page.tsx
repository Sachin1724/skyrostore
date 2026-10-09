import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { OrderDashboard } from "@/components/account/order-dashboard";

export const metadata = {
  title: "My Orders — Skyrostore",
  description: "Track your orders, view details, download invoices and manage returns.",
};

export default function OrdersPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-surface-soft py-10">
        <div className="mx-auto max-w-[1280px] px-8 md:px-10">
          <OrderDashboard />
        </div>
      </main>
      <Footer />
    </>
  );
}
