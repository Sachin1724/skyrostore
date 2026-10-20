import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthToken } from "@/lib/auth";
import {
  FULFILMENT_STATES,
  STATE_LABELS,
  getFulfilmentOrders,
  type FulfilmentOrder,
} from "@/lib/data/fulfilment";

export const metadata = { title: "Orders" };

const STATE_BADGE: Record<string, string> = {
  awaiting_payment: "bg-amber-50 text-amber-800 border border-amber-200",
  payment_failed: "bg-rose-50 text-rose-800 border border-rose-200",
  paid_processing: "bg-lime-100 text-gray-900 border border-lime-300",
  packed: "bg-blue-50 text-blue-800 border border-blue-200",
  shipped: "bg-emerald-50 text-emerald-800 border border-emerald-200",
  delivered: "bg-gray-900 text-white",
  cancelled: "bg-gray-100 text-gray-600",
};

function StateBadge({ state }: { state: string }) {
  return (
    <span
      className={`rounded px-2 py-0.5 font-mono text-xs font-medium ${STATE_BADGE[state] || "bg-gray-100 text-gray-700"}`}
    >
      {STATE_LABELS[state] || state}
    </span>
  );
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string; payment_status?: string; q?: string }>;
}) {
  const token = await getAuthToken();
  if (!token) redirect("/login");

  const { state, payment_status, q } = await searchParams;

  let data;
  try {
    data = await getFulfilmentOrders(token, { state, payment_status, q, limit: 100 });
  } catch {
    return (
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Orders</h1>
        <p className="mt-1 text-sm text-rose-700">
          Unable to load orders. Check that the Medusa backend is running.
        </p>
      </div>
    );
  }

  const { orders, count, counts_by_state: counts } = data;

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Orders</h1>
        <p className="text-sm text-gray-500">{count} shown</p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href="/orders"
          className={`rounded border px-2.5 py-1 text-xs font-medium ${!state ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
        >
          All
        </Link>
        {FULFILMENT_STATES.map((s) => (
          <Link
            key={s}
            href={`/orders?state=${s}`}
            className={`rounded border px-2.5 py-1 text-xs font-medium ${state === s ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
          >
            {STATE_LABELS[s]} ({counts[s] ?? 0})
          </Link>
        ))}
      </div>

      <form action="/orders" className="mt-4 flex gap-2">
        {state ? <input type="hidden" name="state" value={state} /> : null}
        <input
          type="search"
          name="q"
          defaultValue={q || ""}
          placeholder="Order id, number, email or bulk reference"
          className="w-80 rounded border border-gray-300 px-2.5 py-1.5 text-sm"
        />
        <button type="submit" className="rounded bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white">
          Search
        </button>
      </form>

      {orders.length === 0 ? (
        <p className="mt-6 text-sm text-gray-500">No orders match this filter.</p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                <th className="pb-2 pr-4">Order</th>
                <th className="pb-2 pr-4">Date</th>
                <th className="pb-2 pr-4">Customer</th>
                <th className="pb-2 pr-4">Status</th>
                <th className="pb-2 pr-4">Payment</th>
                <th className="pb-2 pr-4">Units</th>
                <th className="pb-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((order: FulfilmentOrder) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="py-2.5 pr-4 font-mono text-xs">
                    <Link href={`/orders/${order.id}`} className="font-semibold text-gray-900 hover:underline">
                      #{order.display_id ?? order.id}
                    </Link>
                    {order.is_bulk_order ? (
                      <span className="ml-2 rounded bg-lime-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-900">
                        BULK
                      </span>
                    ) : null}
                  </td>
                  <td className="py-2.5 pr-4 text-gray-500">
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-2.5 pr-4 text-gray-700">{order.email || "—"}</td>
                  <td className="py-2.5 pr-4">
                    <StateBadge state={order.fulfilment_state} />
                  </td>
                  <td className="py-2.5 pr-4 font-mono text-xs text-gray-600">{order.payment_status}</td>
                  <td className="py-2.5 pr-4 text-gray-600">{order.item_count}</td>
                  <td className="py-2.5 text-right font-medium">
                    {order.total} {order.currency_code?.toUpperCase()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
