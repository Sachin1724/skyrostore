import { getAuthToken } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

export const metadata = { title: "Bulk & Custom Orders Management | Admin" };

const BASE_URL = process.env.NEXT_PUBLIC_MEDUSA_URL || "http://localhost:9000";

function getStatusBadge(status: string) {
  switch (status) {
    case "SUBMITTED":
      return <span className="bg-gray-100 text-gray-800 font-mono text-xs px-2 py-0.5 rounded font-medium">Submitted</span>;
    case "UNDER_REVIEW":
      return <span className="bg-blue-50 text-blue-800 font-mono text-xs px-2 py-0.5 rounded border border-blue-200 font-medium">Under Review</span>;
    case "NEEDS_INFORMATION":
      return <span className="bg-amber-50 text-amber-800 font-mono text-xs px-2 py-0.5 rounded border border-amber-200 font-medium">Needs Info</span>;
    case "QUOTED":
      return <span className="bg-lime-100 text-gray-900 font-mono text-xs px-2 py-0.5 rounded border border-lime-300 font-semibold">Quoted</span>;
    case "ACCEPTED":
      return <span className="bg-emerald-100 text-emerald-800 font-mono text-xs px-2 py-0.5 rounded border border-emerald-300 font-semibold">Accepted</span>;
    case "CONVERTED_TO_ORDER":
      return <span className="bg-gray-900 text-white font-mono text-xs px-2 py-0.5 rounded font-semibold">Ordered</span>;
    case "CANCELLED":
    case "REJECTED":
      return <span className="bg-rose-50 text-rose-800 font-mono text-xs px-2 py-0.5 rounded font-medium">Closed</span>;
    default:
      return <span className="bg-gray-100 text-gray-700 font-mono text-xs px-2 py-0.5 rounded">{status}</span>;
  }
}

export default async function AdminBulkOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const token = await getAuthToken();
  if (!token) redirect("/login");

  const { status, q } = await searchParams;

  const url = new URL(`${BASE_URL}/admin/bulk-orders`);
  if (status && status !== "ALL") url.searchParams.set("status", status);
  if (q) url.searchParams.set("q", q);

  let requests: any[] = [];
  let count = 0;

  try {
    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      requests = data.requests || [];
      count = data.count || 0;
    }
  } catch (err) {
    console.error("Failed to load admin bulk orders:", err);
  }

  const statusFilters = [
    "ALL",
    "SUBMITTED",
    "UNDER_REVIEW",
    "NEEDS_INFORMATION",
    "QUOTED",
    "ACCEPTED",
    "CONVERTED_TO_ORDER",
    "REJECTED",
    "CANCELLED",
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Bulk Orders & Custom UAV Quotations
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {count} request(s) registered in engineering quotation workflow
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 pb-3 text-xs">
        <span className="font-semibold text-gray-500 mr-2">Filter Status:</span>
        {statusFilters.map((st) => (
          <Link
            key={st}
            href={`/bulk-orders?status=${st}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
            className={`rounded px-2.5 py-1 font-mono transition-colors ${
              (status || "ALL") === st
                ? "bg-gray-900 font-semibold text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {st}
          </Link>
        ))}
      </div>

      {requests.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center text-sm text-gray-500">
          No bulk or custom UAV build requests match the selected criteria.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-gray-200 bg-gray-50 font-medium uppercase tracking-wider text-gray-500">
              <tr>
                <th className="py-3 px-4">Reference</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Customer / Org</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Line Items</th>
                <th className="py-3 px-4">Quoted Total</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {requests.map((r: any) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 font-mono font-bold text-gray-900">
                    <Link href={`/bulk-orders/${r.id}`} className="hover:underline">
                      {r.reference_no}
                    </Link>
                  </td>
                  <td className="py-3 px-4 text-gray-500 font-mono">
                    {new Date(r.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-gray-900 block">{r.contact_name}</span>
                    <span className="text-[11px] text-gray-500">{r.company_name || r.email}</span>
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-gray-700">
                    {r.request_type.replace(/_/g, " ")}
                  </td>
                  <td className="py-3 px-4 font-mono text-gray-600">
                    {r.items?.length || 1} item(s) &bull; Qty: {r.target_unit_count || 1}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-gray-900">
                    {r.quote_total ? `₹${Number(r.quote_total).toLocaleString("en-IN")}` : "—"}
                  </td>
                  <td className="py-3 px-4">
                    {getStatusBadge(r.status)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      href={`/bulk-orders/${r.id}`}
                      className="rounded bg-gray-900 px-3 py-1 font-medium text-white hover:bg-gray-800"
                    >
                      Manage &rarr;
                    </Link>
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
