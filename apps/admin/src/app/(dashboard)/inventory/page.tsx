import { getAuthToken } from "@/lib/auth";
import { getInventoryItems } from "@/lib/data/admin";
import { redirect } from "next/navigation";

export const metadata = { title: "Inventory" };

export default async function InventoryPage() {
  const token = await getAuthToken();
  if (!token) redirect("/login");

  const { inventory_items, count } = await getInventoryItems(token);

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900">Inventory</h1>
      <p className="mt-1 text-sm text-gray-500">{count} items</p>

      {inventory_items.length === 0 ? (
        <p className="mt-6 text-sm text-gray-500">
          No inventory data available.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                <th className="pb-2 pr-4">SKU</th>
                <th className="pb-2 pr-4">Title</th>
                <th className="pb-2 pr-4">Stocked Quantity</th>
                <th className="pb-2 pr-4">Reserved</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {inventory_items.map((item: Record<string, unknown>) => (
                <tr key={item.id as string}>
                  <td className="py-2.5 pr-4 font-mono text-xs">
                    {(item.sku as string) || "—"}
                  </td>
                  <td className="py-2.5 pr-4 font-medium">
                    {(item.title as string) || "—"}
                  </td>
                  <td className="py-2.5 pr-4">
                    {(item.stocked_quantity as number) ?? "—"}
                  </td>
                  <td className="py-2.5 pr-4 text-gray-500">
                    {(item.reserved_quantity as number) ?? 0}
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
