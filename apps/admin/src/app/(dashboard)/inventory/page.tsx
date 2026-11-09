import { getAuthToken } from "@/lib/auth";
import { getInventoryItems } from "@/lib/data/admin";
import { redirect } from "next/navigation";
import { StockCell } from "./stock-cell";

export const metadata = { title: "Inventory" };

const LOW_STOCK_THRESHOLD = 5;

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; low_stock?: string }>;
}) {
  const token = await getAuthToken();
  if (!token) redirect("/login");

  const { q, low_stock } = await searchParams;
  const { inventory_items, count } = await getInventoryItems(token, { limit: 200, q });

  const stockOf = (item: Record<string, unknown>) =>
    ((item.location_levels as Array<Record<string, unknown>> | undefined)?.[0]?.stocked_quantity as number) ?? 0;
  const visible = low_stock ? inventory_items.filter((i: Record<string, unknown>) => stockOf(i) <= LOW_STOCK_THRESHOLD) : inventory_items;

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900">Inventory</h1>
      <p className="mt-1 text-sm text-gray-500">{count} items</p>

      <form method="get" className="mt-4 flex flex-wrap items-center gap-2">
        <input name="q" defaultValue={q || ""} placeholder="Search SKU or title" className="w-64 rounded border border-gray-300 px-2.5 py-1.5 text-sm" />
        {low_stock ? <input type="hidden" name="low_stock" value="1" /> : null}
        <button type="submit" className="rounded bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white">Search</button>
        <a
          href={low_stock ? (q ? `/inventory?q=${encodeURIComponent(q)}` : "/inventory") : `/inventory?low_stock=1${q ? `&q=${encodeURIComponent(q)}` : ""}`}
          className={`rounded border px-2.5 py-1 text-xs font-medium ${
            low_stock ? "border-amber-400 bg-amber-100 text-amber-900" : "border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          Low stock (≤{LOW_STOCK_THRESHOLD})
        </a>
      </form>

      {visible.length === 0 ? (
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
              {visible.map((item: Record<string, unknown>) => {
                const level = (item.location_levels as Array<Record<string, unknown>> | undefined)?.[0];
                return (
                  <tr key={item.id as string}>
                    <td className="py-2.5 pr-4 font-mono text-xs">
                      {(item.sku as string) || "—"}
                    </td>
                    <td className="py-2.5 pr-4 font-medium">
                      {(item.title as string) || "—"}
                    </td>
                    <td className="py-2.5 pr-4">
                      <StockCell
                        itemId={item.id as string}
                        locationId={(level?.location_id as string) ?? null}
                        stockedQuantity={(level?.stocked_quantity as number) ?? 0}
                      />
                    </td>
                    <td className="py-2.5 pr-4 text-gray-500">
                      {(level?.reserved_quantity as number) ?? 0}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
