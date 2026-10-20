import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthToken } from "@/lib/auth";
import { getFulfilmentOrders } from "@/lib/data/fulfilment";

export const metadata = { title: "Shipments" };

export default async function ShipmentsPage() {
  const token = await getAuthToken();
  if (!token) redirect("/login");

  let packed;
  let shipped;
  try {
    [packed, shipped] = await Promise.all([
      getFulfilmentOrders(token, { state: "packed", limit: 100 }),
      getFulfilmentOrders(token, { state: "shipped", limit: 100 }),
    ]);
  } catch {
    return (
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Shipments</h1>
        <p className="mt-1 text-sm text-rose-700">Unable to load shipments from the backend.</p>
      </div>
    );
  }

  const groups = [
    { title: "Packed — ready to ship", orders: packed.orders },
    { title: "Shipped — in transit", orders: shipped.orders },
  ];

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900">Shipments</h1>
      <p className="mt-1 text-sm text-gray-500">
        {packed.count} ready to ship · {shipped.count} in transit
      </p>

      {groups.map((group) => (
        <section key={group.title} className="mt-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">{group.title}</h2>
          {group.orders.length === 0 ? (
            <p className="mt-2 text-sm text-gray-500">Nothing here.</p>
          ) : (
            <table className="mt-2 w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wider text-gray-500">
                  <th className="pb-2 pr-4">Order</th>
                  <th className="pb-2 pr-4">Customer</th>
                  <th className="pb-2 pr-4">Destination</th>
                  <th className="pb-2 pr-4">Units</th>
                  <th className="pb-2">Placed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {group.orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="py-2.5 pr-4 font-mono text-xs">
                      <Link href={`/orders/${order.id}`} className="font-semibold hover:underline">
                        #{order.display_id ?? order.id}
                      </Link>
                    </td>
                    <td className="py-2.5 pr-4 text-gray-700">{order.email || "—"}</td>
                    <td className="py-2.5 pr-4 text-gray-600">
                      {[order.shipping_address?.city, order.shipping_address?.province]
                        .filter(Boolean)
                        .join(", ") || "—"}
                    </td>
                    <td className="py-2.5 pr-4 text-gray-600">{order.item_count}</td>
                    <td className="py-2.5 text-gray-500">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      ))}
    </div>
  );
}
