import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthToken } from "@/lib/auth";
import { getFulfilmentOrder } from "@/lib/data/fulfilment";
import { FulfilmentWorkbench } from "./fulfilment-workbench";

export const metadata = { title: "Order | Fulfilment" };

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const token = await getAuthToken();
  if (!token) redirect("/login");

  const { id } = await params;

  let data;
  try {
    data = await getFulfilmentOrder(token, id);
  } catch {
    return (
      <div>
        <Link href="/orders" className="text-xs text-gray-500 hover:underline">
          &larr; Orders
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-gray-900">Order not available</h1>
        <p className="mt-1 text-sm text-rose-700">
          Could not load this order. It may not exist, or the backend is unreachable.
        </p>
      </div>
    );
  }

  return (
    <div>
      <Link href="/orders" className="text-xs text-gray-500 hover:underline">
        &larr; Orders
      </Link>
      <FulfilmentWorkbench
        orderId={id}
        order={data.order}
        packingList={data.packing_list}
        fulfilments={data.fulfilments}
        paymentAttempts={data.payment_attempts}
        bulkRequest={data.bulk_order_request}
        history={data.history}
      />
    </div>
  );
}
