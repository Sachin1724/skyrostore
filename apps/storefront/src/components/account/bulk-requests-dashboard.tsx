"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Package,
  Layers,
  Search,
  Plus,
  ArrowRight,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  Building2,
  ChevronRight,
  Cpu,
  RefreshCw,
  XCircle,
} from "lucide-react";

export interface BulkRequestItem {
  id: string;
  reference_no: string;
  created_at: string;
  request_type: "BULK_PURCHASE" | "CUSTOM_BUILD" | "BULK_CUSTOM_BUILD" | string;
  contact_name?: string;
  company_name?: string;
  target_unit_count?: number;
  items?: Array<{
    id?: string;
    title: string;
    requested_quantity?: number;
    quoted_unit_price?: number | null;
    quoted_total?: number | null;
  }>;
  quote_subtotal?: number | string | null;
  quote_shipping?: number | string | null;
  quote_tax?: number | string | null;
  quote_total?: number | string | null;
  quote_valid_until?: string | null;
  quote_revision?: number;
  status:
    | "SUBMITTED"
    | "UNDER_REVIEW"
    | "NEEDS_INFORMATION"
    | "QUOTED"
    | "ACCEPTED"
    | "CONVERTED_TO_ORDER"
    | "IN_PRODUCTION"
    | "EXPIRED"
    | "CANCELLED"
    | "REJECTED"
    | string;
}

function formatINR(val: number | string | null | undefined): string {
  if (val === null || val === undefined || isNaN(Number(val))) return "Pending Review";
  const num = Number(val);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(num);
}

function getTotalUnits(req: BulkRequestItem): number {
  if (req.items && req.items.length > 0) {
    const sum = req.items.reduce((acc, it) => acc + (Number(it.requested_quantity) || 1), 0);
    if (sum > 0) return sum;
  }
  return req.target_unit_count || 1;
}

function getStatusBadge(status: string, validUntil?: string | null) {
  const isExpired = validUntil && new Date(validUntil) < new Date();

  switch (status) {
    case "SUBMITTED":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-800">
          <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
          Submitted
        </span>
      );
    case "UNDER_REVIEW":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-300 bg-sky-50 px-2.5 py-0.5 text-[11px] font-bold text-sky-800">
          <span className="h-1.5 w-1.5 rounded-full bg-sky-500 animate-pulse" />
          Under Review
        </span>
      );
    case "NEEDS_INFORMATION":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-800">
          <AlertCircle className="h-3 w-3 text-amber-600" />
          Action Needed
        </span>
      );
    case "QUOTED":
      if (isExpired) {
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-600">
            Quote Expired
          </span>
        );
      }
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-extrabold text-emerald-800">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Quote Ready
        </span>
      );
    case "ACCEPTED":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500 bg-emerald-600 px-2.5 py-0.5 text-[11px] font-bold text-white">
          <CheckCircle2 className="h-3 w-3" />
          Accepted
        </span>
      );
    case "CONVERTED_TO_ORDER":
    case "IN_PRODUCTION":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-navy bg-navy px-2.5 py-0.5 text-[11px] font-bold text-white">
          In Production
        </span>
      );
    case "EXPIRED":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-600">
          Expired
        </span>
      );
    case "CANCELLED":
    case "REJECTED":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-[11px] font-bold text-rose-700">
          Declined
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center rounded-full border border-border bg-surface-soft px-2.5 py-0.5 text-[11px] font-bold text-navy">
          {status}
        </span>
      );
  }
}

export function BulkRequestsDashboard({
  initialRequests = [],
  isAuthenticated = true,
}: {
  initialRequests?: BulkRequestItem[];
  isAuthenticated?: boolean;
}) {
  const [requests, setRequests] = useState<BulkRequestItem[]>(initialRequests);
  const [loading, setLoading] = useState(!initialRequests.length && isAuthenticated);
  const [unauthenticated, setUnauthenticated] = useState(!isAuthenticated);
  const [activeTab, setActiveTab] = useState<
    "ALL" | "QUOTED" | "UNDER_REVIEW" | "ACCEPTED" | "CLOSED"
  >("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Direct reference lookup state for guests / procurement officers
  const [lookupRef, setLookupRef] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  // Fetch client-side if initial list is empty
  useEffect(() => {
    if (initialRequests.length > 0) return;

    fetch("/api/bulk-orders")
      .then((res) => {
        if (res.status === 401) {
          setUnauthenticated(true);
          return null;
        }
        if (!res.ok) throw new Error("Failed to fetch requests");
        return res.json();
      })
      .then((data) => {
        if (data?.requests) {
          setRequests(data.requests);
        }
      })
      .catch((err) => {
        console.warn("Client bulk requests fetch:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [initialRequests]);

  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      // Tab filter
      if (activeTab === "QUOTED") {
        if (r.status !== "QUOTED" && r.status !== "NEEDS_INFORMATION") return false;
      } else if (activeTab === "UNDER_REVIEW") {
        if (r.status !== "SUBMITTED" && r.status !== "UNDER_REVIEW") return false;
      } else if (activeTab === "ACCEPTED") {
        if (r.status !== "ACCEPTED" && r.status !== "CONVERTED_TO_ORDER" && r.status !== "IN_PRODUCTION") return false;
      } else if (activeTab === "CLOSED") {
        if (r.status !== "CANCELLED" && r.status !== "REJECTED" && r.status !== "EXPIRED") return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesRef = r.reference_no?.toLowerCase().includes(query);
        const matchesType = r.request_type?.toLowerCase().includes(query);
        const matchesCompany = r.company_name?.toLowerCase().includes(query);
        const matchesContact = r.contact_name?.toLowerCase().includes(query);
        const matchesItems = r.items?.some((i) => i.title.toLowerCase().includes(query));
        return matchesRef || matchesType || matchesCompany || matchesContact || matchesItems;
      }

      return true;
    });
  }, [requests, activeTab, searchQuery]);

  const counts = useMemo(() => {
    return {
      all: requests.length,
      quoted: requests.filter((r) => r.status === "QUOTED" || r.status === "NEEDS_INFORMATION").length,
      underReview: requests.filter((r) => r.status === "SUBMITTED" || r.status === "UNDER_REVIEW").length,
      accepted: requests.filter((r) => r.status === "ACCEPTED" || r.status === "CONVERTED_TO_ORDER" || r.status === "IN_PRODUCTION").length,
      closed: requests.filter((r) => r.status === "CANCELLED" || r.status === "REJECTED" || r.status === "EXPIRED").length,
    };
  }, [requests]);

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanRef = lookupRef.trim().toUpperCase();
    if (!cleanRef) return;
    setLookupLoading(true);
    setLookupError(null);

    // If already in list, navigate
    const found = requests.find((r) => r.reference_no.toUpperCase() === cleanRef);
    if (found) {
      window.location.href = `/account/bulk-requests/${found.id}`;
      return;
    }

    // Direct navigate to inspect
    window.location.href = `/account/bulk-requests/${cleanRef}`;
  };

  return (
    <div className="space-y-6">
      {/* 1. Unauthenticated or Guest Notice Card */}
      {unauthenticated && (
        <div className="rounded-xl border border-sky-200 bg-sky-50/70 p-5 text-navy shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Building2 className="h-5 w-5 text-brand shrink-0 mt-0.5" aria-hidden />
              <div>
                <p className="font-extrabold text-[14px]">Institutional Account Access</p>
                <p className="text-[13px] text-text-secondary mt-0.5">
                  Sign in with your registered corporate email to see all quotations, or track an active RFQ using your Reference Number below.
                </p>
              </div>
            </div>
            <Link
              href="/account"
              className="inline-flex h-9 items-center justify-center rounded-lg bg-navy px-4 text-[13px] font-bold text-white hover:bg-brand transition-colors whitespace-nowrap"
            >
              Sign In to Account
            </Link>
          </div>
        </div>
      )}

      {/* 2. Direct RFQ Reference Lookup Form */}
      <div className="rounded-xl border border-border bg-white p-4 shadow-xs">
        <form onSubmit={handleLookup} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex-1 flex items-center rounded-lg border border-border bg-surface-soft px-3 py-2 text-[13px]">
            <Search className="h-4 w-4 text-text-muted shrink-0 mr-2" aria-hidden />
            <input
              type="text"
              placeholder="Search or enter Reference No (e.g. REQ-2026-104928)"
              value={lookupRef || searchQuery}
              onChange={(e) => {
                setLookupRef(e.target.value);
                setSearchQuery(e.target.value);
              }}
              className="w-full bg-transparent text-navy placeholder:text-text-muted focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-navy px-5 py-2 text-[13px] font-bold text-white transition hover:bg-brand"
          >
            Track Reference
          </button>
        </form>
      </div>

      {/* 3. Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto border-b border-border pb-3 text-[13px]">
        {[
          { id: "ALL", label: "All Requests", count: counts.all },
          { id: "QUOTED", label: "Quotes Ready", count: counts.quoted },
          { id: "UNDER_REVIEW", label: "Under Review", count: counts.underReview },
          { id: "ACCEPTED", label: "In Production / Accepted", count: counts.accepted },
          { id: "CLOSED", label: "Closed / Expired", count: counts.closed },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 font-bold transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-navy text-white shadow-2xs"
                : "bg-white text-text-secondary border border-border hover:text-navy hover:bg-surface-soft"
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`rounded px-1.5 py-0.2 text-[11px] font-mono ${
                activeTab === tab.id ? "bg-white/20 text-white" : "bg-surface-soft text-text-muted"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* 4. Requests Presentation (Desktop Table + Mobile Cards) */}
      {loading ? (
        <div className="rounded-xl border border-border bg-white p-12 text-center text-[14px] text-text-muted shadow-sm">
          <RefreshCw className="h-5 w-5 animate-spin mx-auto text-brand mb-2" aria-hidden />
          Loading your bulk quotations...
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="rounded-xl border border-border bg-white p-8 md:p-14 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-soft text-brand">
            <Layers className="h-6 w-6" aria-hidden />
          </div>
          <h2 className="mt-4 text-[18px] font-extrabold text-navy">
            {searchQuery ? "No Matching Quotations Found" : "No Bulk RFQ Requests in this View"}
          </h2>
          <p className="mt-1.5 text-[14px] text-text-secondary max-w-[46ch] mx-auto">
            {searchQuery
              ? `No requests matching "${searchQuery}". Check the reference number or clear the search filter.`
              : "You do not have any requests in this state. You can submit custom build specifications or volume orders anytime."}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="rounded-lg border border-border bg-white px-5 py-2 text-[13px] font-bold text-navy hover:bg-surface-soft"
              >
                Clear Search
              </button>
            )}
            <Link
              href="/bulk-orders/request"
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-navy px-5 text-[13px] font-extrabold text-white hover:bg-brand transition-colors shadow-2xs"
            >
              <Plus className="h-4 w-4" aria-hidden />
              Submit New RFQ
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Desktop Table (Hidden on Mobile) */}
          <div className="hidden md:block overflow-x-auto rounded-xl border border-border bg-white shadow-sm">
            <table className="w-full text-left text-[13px]">
              <thead className="border-b border-border bg-surface-soft text-[11px] font-extrabold uppercase text-text-muted">
                <tr>
                  <th className="py-3 px-4">Reference No</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Request Type</th>
                  <th className="py-3 px-4 text-center">Total Units</th>
                  <th className="py-3 px-4 text-right">Quote Total (INR)</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredRequests.map((r) => {
                  const totalUnits = getTotalUnits(r);
                  const isQuoted = r.status === "QUOTED";

                  return (
                    <tr key={r.id} className="hover:bg-surface-soft/60 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-extrabold text-navy">
                        <Link href={`/account/bulk-requests/${r.id}`} className="hover:text-brand">
                          {r.reference_no}
                        </Link>
                        {r.company_name && (
                          <span className="block text-[11px] font-sans font-normal text-text-muted truncate max-w-[200px]">
                            {r.company_name}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-text-secondary whitespace-nowrap">
                        {new Date(r.created_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-navy">
                        {r.request_type.replace(/_/g, " ")}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-semibold text-navy">
                        {totalUnits} <span className="text-[11px] font-sans text-text-muted">units</span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-extrabold text-navy">
                        {r.quote_total ? formatINR(r.quote_total) : "Pending Review"}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {getStatusBadge(r.status, r.quote_valid_until)}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {isQuoted ? (
                          <Link
                            href={`/account/bulk-requests/${r.id}`}
                            className="inline-flex items-center gap-1 rounded-md bg-navy px-3 py-1.5 text-[12px] font-extrabold text-white hover:bg-brand transition-colors shadow-2xs"
                          >
                            <span>Review Quote</span>
                            <ArrowRight className="h-3 w-3" aria-hidden />
                          </Link>
                        ) : (
                          <Link
                            href={`/account/bulk-requests/${r.id}`}
                            className="inline-flex items-center gap-1 text-[13px] font-bold text-navy hover:text-brand transition-colors"
                          >
                            <span>Inspect</span>
                            <ChevronRight className="h-4 w-4" aria-hidden />
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards (Visible only on Mobile) */}
          <div className="md:hidden space-y-3">
            {filteredRequests.map((r) => {
              const totalUnits = getTotalUnits(r);
              const isQuoted = r.status === "QUOTED";

              return (
                <div
                  key={r.id}
                  className="rounded-xl border border-border bg-white p-4 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-2 border-b border-border pb-3">
                    <div>
                      <span className="font-mono text-[14px] font-extrabold text-navy">
                        {r.reference_no}
                      </span>
                      <p className="text-[11px] text-text-muted">
                        {new Date(r.created_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    {getStatusBadge(r.status, r.quote_valid_until)}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[12px]">
                    <div>
                      <span className="text-text-muted block">Request Type</span>
                      <span className="font-semibold text-navy">{r.request_type.replace(/_/g, " ")}</span>
                    </div>
                    <div>
                      <span className="text-text-muted block">Total Quantity</span>
                      <span className="font-mono font-semibold text-navy">{totalUnits} units</span>
                    </div>
                    <div className="col-span-2 pt-1 border-t border-border">
                      <span className="text-text-muted block">Quotation Total</span>
                      <span className="font-mono text-[15px] font-extrabold text-navy">
                        {r.quote_total ? formatINR(r.quote_total) : "Pending Engineering Review"}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Link
                      href={`/account/bulk-requests/${r.id}`}
                      className={`flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-[13px] font-extrabold transition-colors ${
                        isQuoted
                          ? "bg-navy text-white hover:bg-brand"
                          : "border border-border bg-surface-soft text-navy hover:bg-white"
                      }`}
                    >
                      <span>{isQuoted ? "Review Official Quotation" : "Inspect RFQ Details"}</span>
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

