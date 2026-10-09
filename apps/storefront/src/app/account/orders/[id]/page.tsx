import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { OrderDetail } from "@/components/account/order-detail";

export const metadata = { title: "Order Details" };

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <>
      <Header />
      <main className="mx-auto max-w-[960px] px-8 py-8 md:px-10">
        <OrderDetail orderId={id} />
      </main>
      <Footer />
    </>
  );
}
