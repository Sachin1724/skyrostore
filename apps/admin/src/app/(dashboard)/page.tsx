import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthToken } from "@/lib/auth";
import { getAnalyticsOverview } from "@/lib/data/fulfilment";

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
  try {
    overview = await getAnalyticsOverview(token, 30);
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

  const paymentsToCheck = (payments.failed || 0) + (payments.pending || 0) + (payments.attempted || 0);

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
      <p className="mt-1 text-sm text-gray-500">Last 30 days. Every figure is a count of recorded data.</p>

      <h2 className="mt-6 text-sm font-semibold uppercase tracking-wider text-gray-500">Fulfilment</h2>
      <div className="mt-2 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Awaiting fulfilment" value={fulfilment.awaiting_fulfilment} href="/orders?state=paid_processing" />
        <StatCard label="Packed — to ship" value={fulfilment.packed} href="/orders?state=packed" />
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
