import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import Link from "next/link";
import { cookies } from "next/headers";
import { formatPrice } from "@/lib/utils";
import { AccountNav } from "@/components/account/account-nav";
import {
  Package,
  Layers,
  ArrowRight,
  Plus,
} from "lucide-react";

export const metadata = { title: "B2B & Bulk Quotations — Skyrostore" };

const BASE = process.env.NEXT_PUBLIC_MEDUSA_URL || "http://localhost:9000";
const PK = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "pk_11e52cb93d15418c56289d434fee7c53a391460b6a393b72ad48192afe3c4816";

function getStatusBadge(status: string) {
  switch (status) {
    case "SUBMITTED":
      return <span className="bg-surface-soft text-navy text-[12px] font-bold px-2 py-0.5 rounded border border-border">Submitted</span>;
    case "UNDER_REVIEW":
      return <span className="bg-brand-soft text-brand text-[12px] font-bold px-2 py-0.5 rounded border border-brand/20">Under Review</span>;
    case "NEEDS_INFORMATION":
      return <span className="bg-amber-50 text-amber-800 text-[12px] font-bold px-2 py-0.5 rounded border border-amber-200">Action Needed</span>;
    case "QUOTED":
      return <span className="bg-emerald-50 text-emerald-800 text-[12px] font-bold px-2 py-0.5 rounded border border-emerald-300">Quote Ready</span>;
    case "ACCEPTED":
      return <span className="bg-success text-white text-[12px] font-bold px-2 py-0.5 rounded">Accepted</span>;
    case "CONVERTED_TO_ORDER":
      return <span className="bg-navy text-white text-[12px] font-bold px-2 py-0.5 rounded">Ordered</span>;
    case "CANCELLED":
    case "REJECTED":
      return <span className="bg-rose-50 text-rose-800 text-[12px] font-bold px-2 py-0.5 rounded">Closed</span>;
    default:
      return <span className="bg-surface-soft text-navy text-[12px] font-bold px-2 py-0.5 rounded">{status}</span>;
  }
}

export default async function CustomerBulkRequestsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("customer_token")?.value;

  if (!token) {
    return (
      <>
        <Header />
        <main id="main" className="min-h-screen bg-surface-soft pb-20">
          <div className="mx-auto max-w-[640px] px-4 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-soft text-brand">
              <Package className="h-6 w-6" aria-hidden />
            </div>
            <h1 className="mt-4 text-[24px] font-extrabold text-navy">
              Sign in to view your bulk RFQ quotations
            </h1>
            <p className="mt-2 text-[14px] text-text-secondary">
              Review institutional purchase orders, formal GST quotations, and custom UAV specifications.
            </p>
            <div className="mt-6">
              <Link
                href="/account"
                className="inline-flex h-11 items-center rounded-md bg-brand px-6 text-[14px] font-bold text-white hover:bg-navy transition-colors shadow-sm"
              >
                Sign In to Skyrostore
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  interface BulkRequestItem {
    id: string;
    reference_no: string;
    created_at: string;
    request_type: string;
    items?: Array<{ quantity?: number }>;
    target_unit_count?: number;
    quote_total?: number | string | null;
    status: string;
  }

  let requests: BulkRequestItem[] = [];
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
      <main id="main" className="min-h-screen bg-surface-soft pb-20">
        <div className="mx-auto max-w-[1376px] px-4 md:px-8">
          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 pt-5 text-[13px] text-text-secondary">
            <Link href="/" className="hover:text-brand">Home</Link>
            <span aria-hidden>/</span>
            <Link href="/account" className="hover:text-brand">Account</Link>
            <span aria-hidden>/</span>
            <span className="font-semibold text-navy">Bulk Quotations</span>
          </nav>

          <div className="flex flex-wrap items-center justify-between gap-4 pb-6 pt-4">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand">
                Institutional Procurement
              </span>
              <h1 className="mt-1 text-[clamp(1.6rem,1.2rem+1.4vw,2.1rem)] font-extrabold tracking-[-0.03em] text-navy">
                B2B &amp; Bulk UAV Quotations
              </h1>
            </div>

            <Link
              href="/bulk-orders/request"
              className="inline-flex h-11 items-center gap-2 rounded-md bg-navy px-5 text-[13px] font-bold text-white hover:bg-brand transition-colors shadow-sm"
            >
              <Plus className="h-4 w-4" aria-hidden />
              <span>Submit New RFQ</span>
            </Link>
          </div>

          <div className="flex flex-col lg:flex-row gap-8 items-start">
            <AccountNav />

            <div className="flex-1 min-w-0 w-full">
              {requests.length === 0 ? (
                <div className="rounded-xl border border-border bg-white p-8 md:p-14 text-center shadow-sm">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-soft text-brand">
                    <Layers className="h-6 w-6" aria-hidden />
                  </div>
                  <h2 className="mt-4 text-[18px] font-extrabold text-navy">No Bulk RFQ Requests Found</h2>
                  <p className="mt-1.5 text-[14px] text-text-secondary max-w-[44ch] mx-auto">
                    You haven&apos;t submitted any volume component requests or institutional build specifications yet.
                  </p>
                  <div className="mt-6 flex justify-center">
                    <Link
                      href="/bulk-orders/request"
                      className="inline-flex h-11 items-center gap-2 rounded-md bg-brand px-6 text-[14px] font-bold text-white hover:bg-navy transition-colors shadow-sm"
                    >
                      Request a Formal Quotation
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-border bg-white shadow-sm">
                  <table className="w-full text-left text-[13px]">
                    <thead className="border-b border-border bg-surface-soft text-[11px] font-extrabold uppercase text-text-muted">
                      <tr>
                        <th className="py-3 px-4">Reference</th>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Request Type</th>
                        <th className="py-3 px-4">Units</th>
                        <th className="py-3 px-4">Quote Total</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {requests.map((r) => (
                        <tr key={r.id} className="hover:bg-surface-soft/60 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-navy">
                            <Link href={`/account/bulk-requests/${r.id}`} className="hover:text-brand">
                              {r.reference_no}
                            </Link>
                          </td>
                          <td className="py-3.5 px-4 text-text-secondary">
                            {new Date(r.created_at).toLocaleDateString("en-IN")}
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-navy">
                            {r.request_type.replace(/_/g, " ")}
                          </td>
                          <td className="py-3.5 px-4 tabular-nums text-text-secondary">
                            {r.target_unit_count || 1} units
                          </td>
                          <td className="py-3.5 px-4 font-extrabold tabular-nums text-navy">
                            {r.quote_total ? formatPrice(Number(r.quote_total), "inr") : "Pending Review"}
                          </td>
                          <td className="py-3.5 px-4">
                            {getStatusBadge(r.status)}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <Link
                              href={`/account/bulk-requests/${r.id}`}
                              className="inline-flex items-center gap-1 text-[13px] font-bold text-brand hover:text-navy transition-colors"
                            >
                              <span>Inspect</span>
                              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
