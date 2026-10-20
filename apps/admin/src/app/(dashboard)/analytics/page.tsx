import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthToken } from "@/lib/auth";
import { getAbandonedCarts, getAnalyticsOverview, getJourneyEvents } from "@/lib/data/fulfilment";

export const metadata = { title: "Analytics" };

function Metric({ label, value, href }: { label: string; value: number | string; href?: string }) {
  const body = (
    <div className="rounded-md border border-gray-200 bg-white px-4 py-3 hover:border-gray-300">
      <p className="text-xs font-medium uppercase tracking-wider text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const token = await getAuthToken();
  if (!token) redirect("/login");

  const { days } = await searchParams;
  const window = Math.min(Math.max(Number(days) || 30, 1), 365);

  let overview;
  let abandoned;
  let recent;
  try {
    [overview, abandoned, recent] = await Promise.all([
      getAnalyticsOverview(token, window),
      getAbandonedCarts(token, { limit: 25 }),
      getJourneyEvents(token, { limit: 25 }),
    ]);
  } catch {
    return (
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Analytics</h1>
        <p className="mt-1 text-sm text-rose-700">Unable to load analytics from the backend.</p>
      </div>
    );
  }

  const { journey, checkout_dropoff_by_step: dropoff, event_collection: collection } = overview;

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-xl font-semibold text-gray-900">Analytics</h1>
        <div className="flex gap-2">
          {[7, 30, 90].map((d) => (
            <Link
              key={d}
              href={`/analytics?days=${d}`}
              className={`rounded border px-2.5 py-1 text-xs font-medium ${
                window === d ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 text-gray-600"
              }`}
            >
              {d}d
            </Link>
          ))}
        </div>
      </div>

      {!collection.active ? (
        <p className="mt-4 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {collection.note || "Event collection is starting; no events have been recorded yet."}
        </p>
      ) : (
        <p className="mt-1 text-sm text-gray-500">
          Collecting since {new Date(collection.first_event_at as string).toLocaleString()}.
        </p>
      )}

      <section className="mt-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
          Customer journey ({window}d)
        </h2>
        <div className="mt-2 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Metric label="Sessions" value={journey.sessions} href="/analytics/events?event_type=session_started" />
          <Metric label="Product views" value={journey.product_views} href="/analytics/events?event_type=product_viewed" />
          <Metric label="Searches" value={journey.searches} href="/analytics/events?event_type=search_performed" />
          <Metric label="Add to cart" value={journey.add_to_cart} href="/analytics/events?event_type=product_added_to_cart" />
          <Metric label="Checkouts started" value={journey.checkouts_started} href="/analytics/events?event_type=checkout_started" />
          <Metric label="Payments succeeded" value={journey.payments_succeeded} href="/payments?status=succeeded" />
          <Metric label="Payments failed" value={journey.payments_failed} href="/payments?status=failed" />
          <Metric label="Orders placed" value={journey.orders_placed} href="/orders" />
        </div>
      </section>

      <section className="mt-6 grid gap-5 lg:grid-cols-2">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
            Checkout drop-off by step
          </h2>
          {Object.keys(dropoff).length === 0 ? (
            <p className="mt-2 text-sm text-gray-500">No checkout steps recorded yet.</p>
          ) : (
            <ul className="mt-2 space-y-1 text-sm">
              {Object.entries(dropoff).map(([step, total]) => (
                <li key={step} className="flex justify-between rounded border border-gray-200 bg-white px-3 py-2">
                  <span className="font-mono text-xs text-gray-600">{step}</span>
                  <span className="font-medium text-gray-900">{total}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
            Abandoned carts ({overview.abandoned_after_minutes} min idle)
          </h2>
          {abandoned.carts.length === 0 ? (
            <p className="mt-2 text-sm text-gray-500">No abandoned carts at this threshold.</p>
          ) : (
            <table className="mt-2 w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wider text-gray-500">
                  <th className="pb-2 pr-3">Cart</th>
                  <th className="pb-2 pr-3">Items</th>
                  <th className="pb-2 pr-3">Idle</th>
                  <th className="pb-2 pr-3">Last step</th>
                  <th className="pb-2">State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {abandoned.carts.map((cart) => (
                  <tr key={cart.cart_id}>
                    <td className="py-2 pr-3 font-mono text-xs">{cart.email || cart.cart_id}</td>
                    <td className="py-2 pr-3">{cart.item_count}</td>
                    <td className="py-2 pr-3 text-gray-600">{cart.idle_minutes} min</td>
                    <td className="py-2 pr-3 font-mono text-xs text-gray-600">
                      {cart.last_checkout_step || cart.last_action || "—"}
                    </td>
                    <td className="py-2 font-mono text-xs">{cart.state}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Latest events</h2>
        {recent.events.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">Nothing recorded yet.</p>
        ) : (
          <table className="mt-2 w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wider text-gray-500">
                <th className="pb-2 pr-3">When</th>
                <th className="pb-2 pr-3">Event</th>
                <th className="pb-2 pr-3">Session</th>
                <th className="pb-2 pr-3">Page / step</th>
                <th className="pb-2">Reference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recent.events.map((event) => (
                <tr key={event.id}>
                  <td className="py-2 pr-3 text-gray-500">
                    {new Date(event.occurred_at).toLocaleString()}
                  </td>
                  <td className="py-2 pr-3 font-medium text-gray-900">{event.event_type}</td>
                  <td className="py-2 pr-3 font-mono text-xs text-gray-500">{event.session_id}</td>
                  <td className="py-2 pr-3 font-mono text-xs text-gray-600">
                    {event.checkout_step || event.page_path || "—"}
                  </td>
                  <td className="py-2 font-mono text-xs text-gray-600">
                    {event.order_id || event.product_id || event.cart_id || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
