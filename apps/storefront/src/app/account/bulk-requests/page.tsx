import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import Link from "next/link";
import { cookies } from "next/headers";
import { formatPrice } from "@/lib/utils";
import {
  Package,
  Layers,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Sliders,
} from "lucide-react";

export const metadata = { title: "My Bulk & Custom UAV Requests | Skyrostore" };

const BASE = process.env.NEXT_PUBLIC_MEDUSA_URL || "http://localhost:9000";
const PK = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "pk_11e52cb93d15418c56289d434fee7c53a391460b6a393b72ad48192afe3c4816";

function getStatusBadge(status: string) {
  switch (status) {
    case "SUBMITTED":
      return <span className="bg-gray-100 text-gray-800 font-mono text-[11px] px-2 py-0.5 rounded">Submitted</span>;
    case "UNDER_REVIEW":
      return <span className="bg-blue-50 text-blue-800 font-mono text-[11px] px-2 py-0.5 rounded border border-blue-200">Under Review</span>;
    case "NEEDS_INFORMATION":
      return <span className="bg-amber-50 text-amber-800 font-mono text-[11px] px-2 py-0.5 rounded border border-amber-200">Action Needed</span>;
    case "QUOTED":
      return <span className="bg-lime-100 text-gray-900 font-mono text-[11px] px-2 py-0.5 rounded border border-lime-300 font-semibold">Quote Ready</span>;
    case "ACCEPTED":
      return <span className="bg-emerald-100 text-emerald-800 font-mono text-[11px] px-2 py-0.5 rounded border border-emerald-300 font-semibold">Accepted</span>;
    case "CONVERTED_TO_ORDER":
      return <span className="bg-graphite text-white font-mono text-[11px] px-2 py-0.5 rounded font-semibold">Ordered</span>;
    case "CANCELLED":
    case "REJECTED":
      return <span className="bg-rose-50 text-rose-800 font-mono text-[11px] px-2 py-0.5 rounded">Closed</span>;
    default:
      return <span className="bg-gray-100 text-gray-700 font-mono text-[11px] px-2 py-0.5 rounded">{status}</span>;
  }
}

export default async function CustomerBulkRequestsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("customer_token")?.value;

  if (!token) {
    return (
      <>
        <Header />
        <main className="mx-auto max-w-[640px] px-8 py-16 text-center">
          <Package className="mx-auto h-12 w-12 text-text-muted" strokeWidth={1.5} />
          <h1 className="mt-4 text-[24px] font-bold text-graphite">Account Authentication Required</h1>
          <p className="mt-2 text-[14px] text-text-secondary">
            Sign in to inspect your bulk procurement requests, formal quotations, and custom UAV specifications.
          </p>
          <div className="mt-6">
            <Link
              href="/account"
              className="inline-flex bg-graphite px-6 py-2.5 text-[13px] font-semibold text-white rounded-sm hover:bg-graphite-soft"
            >
              Sign In to Skyrostore
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  let requests: any[] = [];
  try {
    const res = await fetch(`${BASE}/store/bulk-orders`, {
      headers: {
        "x-publishable-api-key": PK,
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      requests = data.requests || [];
    }
  } catch (err) {
    console.error("Failed to fetch customer bulk requests:", err);
  }

  return (
    <>
      <Header />
      <main className="mx-auto max-w-[1280px] px-8 py-10 md:px-10">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-color-border pb-5">
          <div>
            <nav className="text-[11px] font-mono uppercase tracking-[0.08em] text-text-muted">
              <Link href="/account" className="hover:text-text-secondary">Account</Link>
              <span className="mx-2 text-text-disabled">/</span>
              <span className="text-graphite">Bulk & Custom Requests</span>
            </nav>
            <h1 className="mt-2 text-[26px] font-bold text-graphite tracking-tight">
              My Bulk & Custom UAV Requests
            </h1>
          </div>

          <Link
            href="/bulk-orders/request"
            className="inline-flex items-center gap-2 bg-graphite px-4 py-2 text-[13px] font-semibold text-white rounded-sm hover:bg-graphite-soft"
          >
            New Request
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {requests.length === 0 ? (
          <div className="mt-12 bg-surface p-12 text-center rounded-md border border-color-border">
            <Package className="mx-auto h-10 w-10 text-text-muted stroke-[1.5]" />
            <h2 className="mt-3 text-[16px] font-bold text-graphite">No Bulk Requests Found</h2>
            <p className="mt-1 text-[13px] text-text-secondary max-w-sm mx-auto">
              You haven&apos;t submitted any volume component orders or custom drone build specifications yet.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link
                href="/bulk-orders/request"
                className="bg-accent px-5 py-2.5 text-[13px] font-semibold text-graphite rounded-sm hover:bg-accent-hover"
              >
                Submit a Request
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-8 overflow-x-auto rounded-md border border-color-border bg-surface">
            <table className="w-full text-left text-[13px]">
              <thead className="border-b border-color-border bg-surface-soft text-[11px] font-mono uppercase text-text-muted">
                <tr>
                  <th className="py-3 px-4">Reference</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Request Type</th>
                  <th className="py-3 px-4">Items / Units</th>
                  <th className="py-3 px-4">Quotation Total</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-color-border">
                {requests.map((r) => (
                  <tr key={r.id} className="hover:bg-surface-soft transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-graphite">
                      <Link href={`/account/bulk-requests/${r.id}`} className="hover:underline">
                        {r.reference_no}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4 text-text-secondary text-[12px]">
                      {new Date(r.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-medium text-graphite">
                        {r.request_type.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[12px] text-text-muted">
                      {r.items?.length || 1} line item(s) &bull; {r.target_unit_count || 1} unit(s)
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-graphite">
                      {r.quote_total ? formatPrice(Number(r.quote_total), "inr") : "—"}
                    </td>
                    <td className="py-3.5 px-4">
                      {getStatusBadge(r.status)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/account/bulk-requests/${r.id}`}
                        className="inline-flex items-center gap-1 font-semibold text-[12px] text-graphite hover:underline"
                      >
                        Inspect &rarr;
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
