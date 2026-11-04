import { cookies } from "next/headers";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { OrderSuccess } from "@/components/checkout/order-success";

export const metadata = { title: "Order confirmed" };

const BASE = process.env.NEXT_PUBLIC_MEDUSA_URL || "http://localhost:9000";
const PK = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "";

/** Signed-in buyers see their order's number and total; the backend checks ownership. */
async function orderSummary(orderId: string) {
  const token = (await cookies()).get("customer_token")?.value;
  if (!token) return null;
  try {
    const res = await fetch(
      `${BASE}/store/orders/${encodeURIComponent(orderId)}?fields=display_id,email,total,currency_code,items.quantity`,
      { headers: { Authorization: `Bearer ${token}`, "x-publishable-api-key": PK }, cache: "no-store" }
    );
    if (!res.ok) return null;
    const { order } = await res.json();
    return {
      display_id: order.display_id,
      email: order.email,
      total: order.total,
      currency_code: order.currency_code,
      item_count: (order.items || []).reduce((n: number, i: { quantity?: number }) => n + Number(i.quantity || 0), 0),
    };
  } catch {
    return null;
  }
}

export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ order_id?: string }>;
}) {
  const { order_id } = await searchParams;
  const summary = order_id ? await orderSummary(order_id) : null;

  return (
    <>
      <Header />
      <main id="main" className="bg-surface-soft">
        <div className="mx-auto max-w-[1120px] px-5 py-16 md:px-10 md:py-24">
          <OrderSuccess orderId={order_id} summary={summary} />
        </div>
      </main>
      <Footer />
    </>
  );
}
