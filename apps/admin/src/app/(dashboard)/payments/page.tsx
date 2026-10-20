import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthToken } from "@/lib/auth";
import { getPaymentAttempts } from "@/lib/data/fulfilment";

export const metadata = { title: "Payments" };

const STATUS_STYLE: Record<string, string> = {
  succeeded: "bg-emerald-50 text-emerald-800 border border-emerald-200",
  failed: "bg-rose-50 text-rose-800 border border-rose-200",
  pending: "bg-amber-50 text-amber-800 border border-amber-200",
  attempted: "bg-gray-100 text-gray-700",
};

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const token = await getAuthToken();
  if (!token) redirect("/login");

  const { status } = await searchParams;

  let data;
  try {
    data = await getPaymentAttempts(token, { status, limit: 200 });
  } catch {
    return (
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Payments</h1>
        <p className="mt-1 text-sm text-rose-700">Unable to load payment attempts.</p>
      </div>
    );
  }

  const { attempts, count, failures_by_category: failures } = data;

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900">Payment attempts</h1>
      <p className="mt-1 text-sm text-gray-500">
        {count} recorded. Payment state itself stays with the payment provider and the commerce
        payment module; these rows exist to investigate failures.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {["", "failed", "pending", "attempted", "succeeded"].map((s) => (
          <Link
            key={s || "all"}
            href={s ? `/payments?status=${s}` : "/payments"}
            className={`rounded border px-2.5 py-1 text-xs font-medium ${
              (status || "") === s
                ? "border-gray-900 bg-gray-900 text-white"
                : "border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {s || "All"}
          </Link>
        ))}
      </div>

      {Object.keys(failures).length ? (
        <div className="mt-4 rounded-md border border-gray-200 bg-white p-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Failures by category
          </h2>
          <ul className="mt-2 flex flex-wrap gap-3 text-sm">
            {Object.entries(failures).map(([category, total]) => (
              <li key={category} className="rounded bg-gray-50 px-2.5 py-1">
                <span className="font-medium text-gray-900">{total}</span>{" "}
                <span className="text-gray-600">{category}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {attempts.length === 0 ? (
        <p className="mt-6 text-sm text-gray-500">
          No payment attempts recorded yet. Rows appear as soon as a customer reaches the payment
          step.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wider text-gray-500">
                <th className="pb-2 pr-4">When</th>
                <th className="pb-2 pr-4">Status</th>
                <th className="pb-2 pr-4">Provider</th>
                <th className="pb-2 pr-4">Reference</th>
                <th className="pb-2 pr-4">Cart / Order</th>
                <th className="pb-2 pr-4">Amount</th>
                <th className="pb-2 pr-4">Attempt</th>
                <th className="pb-2">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {attempts.map((attempt) => (
                <tr key={attempt.id}>
                  <td className="py-2.5 pr-4 text-gray-500">
                    {new Date(attempt.attempted_at).toLocaleString()}
                  </td>
                  <td className="py-2.5 pr-4">
                    <span
                      className={`rounded px-2 py-0.5 font-mono text-xs ${
                        STATUS_STYLE[attempt.status] || "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {attempt.status}
                    </span>
                  </td>
                  <td className="py-2.5 pr-4 font-mono text-xs">{attempt.provider_id}</td>
                  <td className="py-2.5 pr-4 font-mono text-xs text-gray-600">
                    {attempt.provider_reference || "—"}
                  </td>
                  <td className="py-2.5 pr-4 font-mono text-xs">
                    {attempt.order_id ? (
                      <Link href={`/orders/${attempt.order_id}`} className="hover:underline">
                        {attempt.order_id}
                      </Link>
                    ) : (
                      attempt.cart_id || "—"
                    )}
                  </td>
                  <td className="py-2.5 pr-4">
                    {attempt.amount ?? "—"} {attempt.currency_code?.toUpperCase() || ""}
                  </td>
                  <td className="py-2.5 pr-4 text-gray-600">
                    #{attempt.attempt_no}
                    {attempt.is_retry ? " (retry)" : ""}
                  </td>
                  <td className="py-2.5 text-gray-700">{attempt.error_category || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
