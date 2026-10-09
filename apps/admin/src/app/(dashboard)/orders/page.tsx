import { getAuthToken } from "@/lib/auth";
import { getOrders } from "@/lib/data/admin";
import { redirect } from "next/navigation";

export const metadata = { title: "Orders" };

export default async function OrdersPage() {
  const token = await getAuthToken();
  if (!token) redirect("/login");

  const { orders, count } = await getOrders(token);

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900">Orders</h1>
      <p className="mt-1 text-sm text-gray-500">{count} total</p>

      {orders.length === 0 ? (
        <p className="mt-6 text-sm text-gray-500">No orders yet.</p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                <th className="pb-2 pr-4">Order</th>
                <th className="pb-2 pr-4">Date</th>
                <th className="pb-2 pr-4">Status</th>
                <th className="pb-2 pr-4">Items</th>
                <th className="pb-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((order: Record<string, unknown>) => (
                <tr key={order.id as string}>
                  <td className="py-2.5 pr-4 font-mono text-xs">
                    {(order.display_id as number) || (order.id as string)}
                  </td>
                  <td className="py-2.5 pr-4 text-gray-500">
                    {new Date(order.created_at as string).toLocaleDateString()}
                  </td>
                  <td className="py-2.5 pr-4">
                    <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                      {order.status as string}
                    </span>
                  </td>
                  <td className="py-2.5 pr-4 text-gray-500">
                    {(order.items as unknown[])?.length ?? 0}
                  </td>
                  <td className="py-2.5 text-right font-medium">
                    {order.total as number}
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
