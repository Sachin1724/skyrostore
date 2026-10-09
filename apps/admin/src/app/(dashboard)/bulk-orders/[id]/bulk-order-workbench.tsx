"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  Send,
  ShoppingCart,
  RefreshCw,
  Building2,
  Cpu,
  Layers,
} from "lucide-react";

interface BulkOrderWorkbenchProps {
  initialRequest: any;
}

const ALLOWED_STATUS_TRANSITIONS: Record<string, string[]> = {
  SUBMITTED: ["UNDER_REVIEW", "NEEDS_INFORMATION", "REJECTED", "CANCELLED"],
  UNDER_REVIEW: ["NEEDS_INFORMATION", "QUOTED", "REJECTED", "CANCELLED"],
  NEEDS_INFORMATION: ["UNDER_REVIEW", "QUOTED", "REJECTED", "CANCELLED"],
  QUOTED: ["ACCEPTED", "REJECTED", "EXPIRED", "CANCELLED", "UNDER_REVIEW"],
  ACCEPTED: ["CONVERTED_TO_ORDER", "CANCELLED"],
  CONVERTED_TO_ORDER: [],
  REJECTED: [],
  EXPIRED: ["UNDER_REVIEW"],
  CANCELLED: [],
};

export function BulkOrderWorkbench({ initialRequest }: BulkOrderWorkbenchProps) {
  const [request, setRequest] = useState(initialRequest);
  const [isProcessing, setIsProcessing] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Status transition state
  const allowedNextStatuses = ALLOWED_STATUS_TRANSITIONS[request.status] || [];
  const [targetStatus, setTargetStatus] = useState<string>(allowedNextStatuses[0] || "");
  const [adminNotes, setAdminNotes] = useState(request.admin_notes || "");

  // Quotation form state
  const [quotedPrices, setQuotedPrices] = useState<Record<string, number>>(() => {
    const prices: Record<string, number> = {};
    for (const item of request.items || []) {
      prices[item.id] = Number(item.quoted_unit_price) || 0;
    }
    return prices;
  });

  const [quoteShipping, setQuoteShipping] = useState<number>(Number(request.quote_shipping) || 0);
  const [quoteTax, setQuoteTax] = useState<number>(Number(request.quote_tax) || 0);
  const [quoteNotes, setQuoteNotes] = useState(request.quote_notes || "");

  // Default validity: 14 days in future if not set
  const defaultValidity = request.quote_valid_until
    ? new Date(request.quote_valid_until).toISOString().split("T")[0]
    : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const [quoteValidity, setQuoteValidity] = useState(defaultValidity);

  // Calculate live totals
  let calculatedSubtotal = 0;
  for (const item of request.items || []) {
    const unitPrice = quotedPrices[item.id] || 0;
    calculatedSubtotal += unitPrice * Number(item.requested_quantity);
  }
  const calculatedGrandTotal = calculatedSubtotal + Number(quoteShipping || 0) + Number(quoteTax || 0);

  // Auto tax calculator (e.g. 18% standard GST)
  const apply18PercentTax = () => {
    const tax = Math.round(calculatedSubtotal * 0.18);
    setQuoteTax(tax);
  };

  // Status Change Handler
  const handleStatusChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetStatus) return;
    setIsProcessing(true);
    setNotification(null);

    try {
      const res = await fetch(`/api/bulk-orders/${request.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: targetStatus,
          admin_notes: adminNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update status.");

      setRequest((prev: any) => ({
        ...prev,
        ...data.request,
      }));
      setNotification({ type: "success", text: `Status updated to ${data.request.status}.` });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setNotification({ type: "error", text: msg });
    } finally {
      setIsProcessing(false);
    }
  };

  // Quote Submission Handler
  const handleIssueQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setNotification(null);

    try {
      const itemsPayload = (request.items || []).map((i: any) => ({
        id: i.id,
        quoted_unit_price: Number(quotedPrices[i.id] || 0),
      }));

      const res = await fetch(`/api/bulk-orders/${request.id}/quote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: itemsPayload,
          quote_shipping: Number(quoteShipping || 0),
          quote_tax: Number(quoteTax || 0),
          quote_valid_until: new Date(quoteValidity).toISOString(),
          quote_notes: quoteNotes,
          admin_notes: adminNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to issue quotation.");

      setRequest(data.request);
      setNotification({
        type: "success",
        text: `Quotation revision #${data.request.quote_revision} issued successfully. Total: ₹${Number(data.request.quote_total).toLocaleString("en-IN")}`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setNotification({ type: "error", text: msg });
    } finally {
      setIsProcessing(false);
    }
  };

  // Order Conversion Handler
  const handleConvertToOrder = async () => {
    if (!confirm("Convert this accepted quotation to an active order in Medusa?")) return;
    setIsProcessing(true);
    setNotification(null);

    try {
      const res = await fetch(`/api/bulk-orders/${request.id}/convert`, {
        method: "POST",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to convert to order.");

      setRequest(data.request);
      setNotification({
        type: "success",
        text: `Quotation successfully converted to active order ID: ${data.order_id}`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setNotification({ type: "error", text: msg });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div className="flex items-center gap-4">
          <Link
            href="/bulk-orders"
            className="flex h-9 w-9 items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">{request.reference_no}</h1>
              <span className="rounded bg-gray-100 px-2 py-0.5 font-mono text-xs font-semibold text-gray-700">
                {request.request_type}
              </span>
            </div>
            <p className="mt-0.5 font-mono text-xs text-gray-500">
              Customer: {request.contact_name} ({request.email}) &bull; Created: {new Date(request.created_at).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-gray-500">CURRENT STATUS:</span>
          <span className="rounded bg-gray-900 px-2.5 py-1 font-mono text-xs font-bold text-white uppercase">
            {request.status}
          </span>
        </div>
      </div>

      {/* Notifications */}
      {notification && (
        <div
          className={`flex items-center gap-2 rounded-md p-3 text-sm border ${
            notification.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          )}
          <span>{notification.text}</span>
        </div>
      )}

      {/* Order Conversion Banner (when ACCEPTED or CONVERTED) */}
      {request.status === "ACCEPTED" && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border-2 border-emerald-600 bg-emerald-50 p-5">
          <div>
            <div className="flex items-center gap-2 font-bold text-emerald-900">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              Customer Accepted Quotation
            </div>
            <p className="mt-1 text-xs text-emerald-700">
              Customer accepted formal quote (Total: ₹{Number(request.quote_total).toLocaleString("en-IN")}) on{" "}
              {request.accepted_at ? new Date(request.accepted_at).toLocaleString() : "recently"}.
            </p>
          </div>

          <button
            type="button"
            onClick={handleConvertToOrder}
            disabled={isProcessing}
            className="inline-flex items-center gap-2 rounded-md bg-emerald-700 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-800 disabled:opacity-50"
          >
            <ShoppingCart className="h-4 w-4" />
            Convert to Medusa Order Workflow
          </button>
        </div>
      )}

      {request.status === "CONVERTED_TO_ORDER" && (
        <div className="flex items-center justify-between rounded-lg bg-gray-900 p-5 text-white">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-6 w-6 text-lime-400" />
            <div>
              <p className="font-bold text-sm">Converted to Active Commercial Order</p>
              <p className="font-mono text-xs text-gray-300">
                Linked Order Reference: <span className="text-white font-bold">{request.linked_order_id}</span>
              </p>
            </div>
          </div>
          <span className="rounded bg-lime-400 text-gray-950 font-mono text-xs px-2 py-0.5 font-bold">
            CONVERTED
          </span>
        </div>
      )}

      {/* 2-Column Overview: Customer & Engineering Requirements */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Customer & Delivery Card */}
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-xs space-y-3 text-xs">
          <h3 className="font-bold text-sm text-gray-900 border-b border-gray-100 pb-2">
            Customer & Delivery Information
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-gray-400 block font-mono">Contact Name</span>
              <span className="font-semibold text-gray-900">{request.contact_name}</span>
            </div>
            <div>
              <span className="text-gray-400 block font-mono">Email</span>
              <span className="font-semibold text-gray-900">{request.email}</span>
            </div>
            <div>
              <span className="text-gray-400 block font-mono">Phone</span>
              <span className="font-semibold text-gray-900">{request.phone || "—"}</span>
            </div>
            <div>
              <span className="text-gray-400 block font-mono">Organization</span>
              <span className="font-semibold text-gray-900">{request.company_name || "—"}</span>
            </div>
            <div>
              <span className="text-gray-400 block font-mono">GSTIN</span>
              <span className="font-mono text-gray-900">{request.gstin || "—"}</span>
            </div>
            <div>
              <span className="text-gray-400 block font-mono">Destination</span>
              <span className="text-gray-900">{request.delivery_city ? `${request.delivery_city}, ${request.delivery_state || ""}` : "—"}</span>
            </div>
            <div>
              <span className="text-gray-400 block font-mono">Requested Timeframe</span>
              <span className="text-gray-900">{request.timeframe_weeks ? `${request.timeframe_weeks} weeks` : "Standard"}</span>
            </div>
            <div>
              <span className="text-gray-400 block font-mono">Budget Range</span>
              <span className="text-gray-900">{request.budget_range || "—"}</span>
            </div>
          </div>
        </div>

        {/* Custom Engineering Criteria */}
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-xs space-y-3 text-xs">
          <h3 className="font-bold text-sm text-gray-900 border-b border-gray-100 pb-2">
            Engineering & Operational Criteria
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-gray-400 block font-mono">Application</span>
              <span className="font-medium text-gray-900">{request.intended_application || "Standard Wholesale"}</span>
            </div>
            <div>
              <span className="text-gray-400 block font-mono">Target Payload</span>
              <span className="font-medium text-gray-900">{request.target_payload_g ? `${request.target_payload_g}g` : "—"}</span>
            </div>
            <div>
              <span className="text-gray-400 block font-mono">Target Flight Time</span>
              <span className="font-medium text-gray-900">{request.target_flight_time_min ? `${request.target_flight_time_min} mins` : "—"}</span>
            </div>
            <div>
              <span className="text-gray-400 block font-mono">Environment</span>
              <span className="font-medium text-gray-900">{request.operating_environment || "Standard"}</span>
            </div>
            <div className="col-span-2">
              <span className="text-gray-400 block font-mono">Sensors / Payload</span>
              <span className="text-gray-900">{request.sensors_payload || "Standard"}</span>
            </div>
            <div className="col-span-2">
              <span className="text-gray-400 block font-mono">Telemetry / Communication</span>
              <span className="text-gray-900">{request.telemetry_requirements || "Standard"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* State Machine Status Transition Card */}
      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-xs">
        <h3 className="font-bold text-sm text-gray-900 border-b border-gray-100 pb-2">
          State Machine Status Transition
        </h3>
        <form onSubmit={handleStatusChange} className="mt-4 flex flex-wrap items-center gap-4 text-xs">
          <div>
            <label className="block text-gray-500 font-mono">Next Allowed Status:</label>
            <select
              value={targetStatus}
              onChange={(e) => setTargetStatus(e.target.value)}
              disabled={allowedNextStatuses.length === 0 || isProcessing}
              className="mt-1 rounded border border-gray-300 bg-white px-3 py-1.5 font-mono text-xs font-semibold text-gray-900"
            >
              {allowedNextStatuses.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[240px]">
            <label className="block text-gray-500 font-mono">Transition / Admin Notes:</label>
            <input
              type="text"
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="e.g. Reviewed propulsion curves, requesting telemetry details"
              className="mt-1 w-full rounded border border-gray-300 px-3 py-1.5 text-xs text-gray-900"
            />
          </div>

          <button
            type="submit"
            disabled={!targetStatus || allowedNextStatuses.length === 0 || isProcessing}
            className="mt-4 rounded bg-gray-900 px-4 py-2 font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
          >
            Update Status
          </button>
        </form>
      </div>

      {/* Quotation Workbench */}
      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <h3 className="font-bold text-sm text-gray-900">
              Quotation Pricing & Revision Workbench
            </h3>
            <p className="text-xs text-gray-500">
              Define proposed unit prices, freight, and taxes. Click &quot;Issue / Revise Quotation&quot; to formally notify the customer.
            </p>
          </div>
          <span className="font-mono text-xs text-gray-500">
            Revision: #{request.quote_revision || 0}
          </span>
        </div>

        <form onSubmit={handleIssueQuote} className="mt-4 space-y-4">
          <div className="overflow-x-auto rounded border border-gray-200">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-gray-200 bg-gray-50 font-mono uppercase text-gray-500">
                <tr>
                  <th className="py-2.5 px-4">Line Item</th>
                  <th className="py-2.5 px-4 text-center">Quantity</th>
                  <th className="py-2.5 px-4">Quoted Unit Price (₹)</th>
                  <th className="py-2.5 px-4 text-right">Line Total (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {request.items?.map((item: any) => {
                  const unitPrice = quotedPrices[item.id] || 0;
                  const lineTotal = unitPrice * Number(item.requested_quantity);
                  return (
                    <tr key={item.id}>
                      <td className="py-2.5 px-4">
                        <span className="font-semibold text-gray-900 block">{item.title}</span>
                        {item.notes && <span className="text-[11px] text-gray-500">{item.notes}</span>}
                      </td>
                      <td className="py-2.5 px-4 text-center font-mono font-bold text-gray-900">
                        {item.requested_quantity}
                      </td>
                      <td className="py-2.5 px-4 w-44">
                        <input
                          type="number"
                          min={0}
                          step="any"
                          value={quotedPrices[item.id] ?? ""}
                          onChange={(e) =>
                            setQuotedPrices({
                              ...quotedPrices,
                              [item.id]: Math.max(0, parseFloat(e.target.value) || 0),
                            })
                          }
                          className="w-full rounded border border-gray-300 px-2 py-1 text-xs font-mono font-bold text-gray-900"
                        />
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-gray-900">
                        ₹{lineTotal.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pricing Adjustments & Summary */}
          <div className="grid gap-4 sm:grid-cols-2 pt-2">
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-600 font-medium">Quotation Validity Date:</label>
                <input
                  type="date"
                  required
                  value={quoteValidity}
                  onChange={(e) => setQuoteValidity(e.target.value)}
                  className="mt-1 rounded border border-gray-300 px-3 py-1.5 text-xs text-gray-900"
                />
              </div>

              <div>
                <label className="block text-gray-600 font-medium">Customer-Facing Quotation Notes:</label>
                <textarea
                  rows={3}
                  value={quoteNotes}
                  onChange={(e) => setQuoteNotes(e.target.value)}
                  placeholder="e.g. Includes factory QC inspection certificates, express freight, and 12-month commercial replacement warranty."
                  className="mt-1 w-full rounded border border-gray-300 px-3 py-1.5 text-xs text-gray-900"
                />
              </div>
            </div>

            <div className="rounded bg-gray-50 p-4 border border-gray-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Calculated Subtotal:</span>
                <span className="font-mono font-bold text-gray-900">
                  ₹{calculatedSubtotal.toLocaleString("en-IN")}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-500">Shipping & Express Freight (₹):</span>
                <input
                  type="number"
                  min={0}
                  value={quoteShipping}
                  onChange={(e) => setQuoteShipping(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-28 rounded border border-gray-300 px-2 py-1 text-right font-mono text-xs text-gray-900"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-500">GST / Tax Amount (₹):</span>
                  <button
                    type="button"
                    onClick={apply18PercentTax}
                    className="text-[10px] text-blue-600 underline"
                  >
                    (18% GST)
                  </button>
                </div>
                <input
                  type="number"
                  min={0}
                  value={quoteTax}
                  onChange={(e) => setQuoteTax(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-28 rounded border border-gray-300 px-2 py-1 text-right font-mono text-xs text-gray-900"
                />
              </div>

              <div className="flex justify-between border-t border-gray-200 pt-2 text-sm font-bold text-gray-900">
                <span>Grand Total:</span>
                <span className="font-mono text-base text-gray-900">
                  ₹{calculatedGrandTotal.toLocaleString("en-IN")}
                </span>
              </div>

              <div className="pt-2 text-right">
                <button
                  type="submit"
                  disabled={isProcessing || calculatedSubtotal <= 0}
                  className="inline-flex items-center gap-2 rounded-md bg-gray-900 px-5 py-2 text-xs font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" />
                  {isProcessing ? "Processing..." : request.status === "QUOTED" ? "Revise Quotation" : "Issue Quotation"}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Activity Log */}
      {request.audit_logs?.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-xs text-xs">
          <h3 className="font-bold text-sm text-gray-900 border-b border-gray-100 pb-2">
            Audit Trail & History Log
          </h3>
          <div className="mt-4 space-y-2.5">
            {request.audit_logs.map((log: any) => (
              <div key={log.id} className="flex items-start gap-3">
                <span className="font-mono text-gray-400 w-36 shrink-0">
                  {new Date(log.created_at).toLocaleString()}
                </span>
                <span className="font-semibold text-gray-800 w-28 shrink-0">
                  [{log.actor_type}]
                </span>
                <span className="text-gray-600">{log.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
