import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthToken } from "@/lib/auth";
import { getAnalyticsOverview, getFulfilmentOrders } from "@/lib/data/fulfilment";
import { getInventoryItems } from "@/lib/data/admin";
import { formatPrice } from "@/lib/utils";

const LOW_STOCK = 5;
const PAID_STATES = ["paid_processing", "packed", "shipped", "delivered"];
const dayKey = (d: Date | string) => new Date(d).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

/** Paid orders per day for the last 7 days (IST), from the 200 most recent orders. */
function salesTrend(orders: { created_at: string; total: number; fulfilment_state: string }[]) {
  const days = Array.from({ length: 7 }, (_, i) => dayKey(new Date(Date.now() - (6 - i) * 86_400_000)));
  const byDay = new Map(days.map((d) => [d, { total: 0, count: 0 }]));
  for (const o of orders) {
    if (!PAID_STATES.includes(o.fulfilment_state)) continue;
    const bucket = byDay.get(dayKey(o.created_at));
    if (bucket) {
      bucket.total += Number(o.total || 0);
      bucket.count += 1;
    }
  }
  return days.map((d) => ({ day: d, ...byDay.get(d)! }));
}

export const metadata = { title: "Dashboard" };

function StatCard({
  label,
  value,
  href,
  tone = "default",
}: {
  label: string;
  value: number;
  href?: string;
  tone?: "default" | "warn";
}) {
  const card = (
    <div
      className={`rounded-md border px-5 py-4 ${
        tone === "warn" && value > 0
          ? "border-amber-300 bg-amber-50"
          : "border-gray-200 bg-white hover:border-gray-300"
      }`}
    >
      <p className="text-xs font-medium uppercase tracking-wider text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
    </div>
  );
  return href ? <Link href={href}>{card}</Link> : card;
}

export default async function DashboardPage() {
  const token = await getAuthToken();
  if (!token) redirect("/login");

  let overview;
  let recent: Awaited<ReturnType<typeof getFulfilmentOrders>>["orders"] = [];
  let lowStock: { id: string; sku: string; title: string; qty: number }[] = [];
  try {
    overview = await getAnalyticsOverview(token, 30);
    // The money and stock panels are extras: if they fail the rest of the dashboard still loads.
    const [orders, inventory] = await Promise.all([
      getFulfilmentOrders(token, { limit: 200 }).catch(() => null),
      getInventoryItems(token, { limit: 200 }).catch(() => null),
    ]);
    recent = orders?.orders ?? [];
    lowStock = ((inventory?.inventory_items ?? []) as Record<string, any>[])
      .map((i) => ({
        id: i.id as string,
        sku: (i.sku as string) || "-",
        title: (i.title as string) || "",
        qty: Number(i.location_levels?.[0]?.stocked_quantity ?? 0) - Number(i.location_levels?.[0]?.reserved_quantity ?? 0),
      }))
      .filter((i) => i.qty <= LOW_STOCK)
      .sort((a, b) => a.qty - b.qty)
      .slice(0, 8);
  } catch {
    return (
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-rose-700">
          Unable to connect to backend. Check that Medusa is running.
        </p>
      </div>
    );
  }

  const {
    fulfilment,
    payments_needing_attention: payments,
    abandoned_carts: abandonedCarts,
    checkout_dropoff_by_step: dropoff,
    journey,
    bulk_orders: bulk,
    event_collection: collection,
  } = overview;

  const trend = salesTrend(recent);
  const today = trend[trend.length - 1];
  const weekTotal = trend.reduce((sum, d) => sum + d.total, 0);
  const weekOrders = trend.reduce((sum, d) => sum + d.count, 0);
  const peak = Math.max(...trend.map((d) => d.total), 1);
  const paymentsToCheck = (payments.failed || 0) + (payments.pending || 0) + (payments.attempted || 0);

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
      <p className="mt-1 text-sm text-gray-500">Last 30 days. Every figure is a count of recorded data.</p>

      <h2 className="mt-6 text-sm font-semibold uppercase tracking-wider text-gray-500">Sales (paid orders)</h2>
      <div className="mt-2 grid gap-4 lg:grid-cols-3">
        <div className="rounded-md border border-gray-200 bg-white px-5 py-4">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Today</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{formatPrice(today.total)}</p>
          <p className="text-xs text-gray-500">{today.count} {today.count === 1 ? "order" : "orders"}</p>
          <p className="mt-3 text-xs font-medium uppercase tracking-wider text-gray-500">Last 7 days</p>
          <p className="mt-1 text-lg font-semibold text-gray-900">{formatPrice(weekTotal)}</p>
          <p className="text-xs text-gray-500">{weekOrders} {weekOrders === 1 ? "order" : "orders"}</p>
        </div>
        <div className="rounded-md border border-gray-200 bg-white px-5 py-4 lg:col-span-2">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">Daily sales, last 7 days</p>
          <ul className="mt-3 flex h-28 items-end gap-2" aria-label="Daily sales for the last 7 days">
            {trend.map((d) => (
              <li key={d.day} className="flex flex-1 flex-col items-center justify-end gap-1" title={`${d.day}: ${formatPrice(d.total)} from ${d.count} orders`}>
                <span className="w-full rounded-t bg-gray-900" style={{ height: `${Math.max((d.total / peak) * 100, d.total ? 4 : 1)}%` }} />
                <span className="text-[10px] text-gray-500">{d.day.slice(8)}/{d.day.slice(5, 7)}</span>
              </li>
            ))}
          </ul>
          {recent.length >= 200 ? <p className="mt-2 text-[11px] text-gray-400">Based on the 200 most recent orders.</p> : null}
        </div>
      </div>

      <div className="mt-6 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Low stock (available {LOW_STOCK} or fewer)</h2>
        <Link href="/inventory?low_stock=1" className="text-xs font-medium text-gray-600 hover:underline">See all</Link>
      </div>
      {lowStock.length === 0 ? (
        <p className="mt-2 text-sm text-gray-500">Nothing is running low.</p>
      ) : (
        <ul className="mt-2 divide-y divide-gray-100 rounded-md border border-gray-200 bg-white text-sm">
          {lowStock.map((i) => (
            <li key={i.id} className="flex items-center justify-between gap-3 px-4 py-2">
              <span className="min-w-0 truncate">
                <span className="font-mono text-xs text-gray-500">{i.sku}</span> {i.title}
              </span>
              <span className={`shrink-0 rounded px-2 py-0.5 text-xs font-semibold ${i.qty <= 0 ? "bg-rose-50 text-rose-800" : "bg-amber-50 text-amber-800"}`}>
                {i.qty <= 0 ? "Out" : `${i.qty} left`}
              </span>
            </li>
          ))}
        </ul>
      )}

      <h2 className="mt-6 text-sm font-semibold uppercase tracking-wider text-gray-500">Fulfilment</h2>
      <div className="mt-2 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Awaiting fulfilment" value={fulfilment.awaiting_fulfilment} href="/orders?state=paid_processing" />
        <StatCard label="Packed, to ship" value={fulfilment.packed} href="/orders?state=packed" />
        <StatCard label="Shipped" value={fulfilment.shipped} href="/orders?state=shipped" />
        <StatCard label="Delivered" value={fulfilment.delivered} href="/orders?state=delivered" />
      </div>

      <h2 className="mt-6 text-sm font-semibold uppercase tracking-wider text-gray-500">
        Needs attention
      </h2>
      <div className="mt-2 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Failed / pending payments" value={paymentsToCheck} href="/payments?status=failed" tone="warn" />
        <StatCard label="Orders awaiting payment" value={fulfilment.awaiting_payment} href="/orders?state=awaiting_payment" />
        <StatCard label="Abandoned carts" value={abandonedCarts} href="/analytics" tone="warn" />
        <StatCard label="Outstanding quotations" value={bulk.outstanding_quotations} href="/bulk-orders" tone="warn" />
      </div>

      <h2 className="mt-6 text-sm font-semibold uppercase tracking-wider text-gray-500">Storefront activity</h2>
      {collection.active ? (
        <div className="mt-2 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Product views" value={journey.product_views} href="/analytics/events?event_type=product_viewed" />
          <StatCard label="Add to cart" value={journey.add_to_cart} href="/analytics/events?event_type=product_added_to_cart" />
          <StatCard label="Orders placed" value={journey.orders_placed} href="/orders" />
          <StatCard label="Bulk enquiries" value={bulk.total} href="/bulk-orders" />
        </div>
      ) : (
        <p className="mt-2 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {collection.note || "Event collection is starting; no storefront events recorded yet."}
        </p>
      )}

      {Object.keys(dropoff).length ? (
        <>
          <h2 className="mt-6 text-sm font-semibold uppercase tracking-wider text-gray-500">
            Checkout drop-off by step
          </h2>
          <ul className="mt-2 flex flex-wrap gap-3 text-sm">
            {Object.entries(dropoff).map(([step, total]) => (
              <li key={step} className="rounded border border-gray-200 bg-white px-3 py-1.5">
                <span className="font-mono text-xs text-gray-600">{step}</span>{" "}
                <span className="font-medium text-gray-900">{total}</span>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}
