import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthToken } from "@/lib/auth";
import { getJourneyEvents } from "@/lib/data/fulfilment";

export const metadata = { title: "Events" };

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ event_type?: string }>;
}) {
  const token = await getAuthToken();
  if (!token) redirect("/login");

  const { event_type } = await searchParams;

  let data;
  try {
    data = await getJourneyEvents(token, { event_type, limit: 200 });
  } catch {
    return (
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Events</h1>
        <p className="mt-1 text-sm text-rose-700">Unable to load events.</p>
      </div>
    );
  }

  return (
    <div>
      <Link href="/analytics" className="text-xs text-gray-500 hover:underline">
        &larr; Analytics
      </Link>
      <h1 className="mt-2 text-xl font-semibold text-gray-900">
        {event_type || "All events"}
      </h1>
      <p className="mt-1 text-sm text-gray-500">{data.count} recorded</p>

      {data.events.length === 0 ? (
        <p className="mt-6 text-sm text-gray-500">No records for this filter.</p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wider text-gray-500">
                <th className="pb-2 pr-3">When</th>
                <th className="pb-2 pr-3">Event</th>
                <th className="pb-2 pr-3">Session</th>
                <th className="pb-2 pr-3">Visitor</th>
                <th className="pb-2 pr-3">Page / step</th>
                <th className="pb-2 pr-3">Cart</th>
                <th className="pb-2 pr-3">Product</th>
                <th className="pb-2">Campaign</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.events.map((event) => (
                <tr key={event.id}>
                  <td className="py-2 pr-3 text-gray-500">
                    {new Date(event.occurred_at).toLocaleString()}
                  </td>
                  <td className="py-2 pr-3 font-medium text-gray-900">{event.event_type}</td>
                  <td className="py-2 pr-3 font-mono text-xs text-gray-500">{event.session_id}</td>
                  <td className="py-2 pr-3 font-mono text-xs text-gray-500">{event.visitor_id || "—"}</td>
                  <td className="py-2 pr-3 font-mono text-xs text-gray-600">
                    {event.checkout_step || event.page_path || "—"}
                  </td>
                  <td className="py-2 pr-3 font-mono text-xs text-gray-600">{event.cart_id || "—"}</td>
                  <td className="py-2 pr-3 font-mono text-xs text-gray-600">
                    {event.product_id || event.search_query || "—"}
                  </td>
                  <td className="py-2 font-mono text-xs text-gray-600">
                    {[event.utm_source, event.utm_medium, event.utm_campaign].filter(Boolean).join(" / ") || "—"}
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
