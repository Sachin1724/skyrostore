"use client";

import { useState } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import {
  Package,
  Layers,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  ShieldCheck,
  Building2,
  MapPin,
  Cpu,
  ArrowRight,
  XCircle,
} from "lucide-react";

interface RequestDetailClientProps {
  initialRequest: any;
}

export function RequestDetailClient({ initialRequest }: RequestDetailClientProps) {
  const [request, setRequest] = useState(initialRequest);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const isQuoted = request.status === "QUOTED";
  const isAccepted = request.status === "ACCEPTED";
  const isOrdered = request.status === "CONVERTED_TO_ORDER";
  const isExpired = request.quote_valid_until && new Date(request.quote_valid_until) < new Date();

  async function handleAccept() {
    if (!confirm("Are you sure you want to accept this official quotation?")) return;
    setIsProcessing(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/bulk-orders/${request.id}/accept`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to accept quotation.");
      }
      setRequest(data.request || { ...request, status: "ACCEPTED" });
      setMessage({ type: "success", text: "Quotation accepted! Our logistics and production team will prepare your order." });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setMessage({ type: "error", text: msg });
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleDecline() {
    const reason = prompt("Please provide a reason for declining this quotation (optional):");
    if (reason === null) return;

    setIsProcessing(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/bulk-orders/${request.id}/decline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to decline quotation.");
      }
      setRequest(data.request || { ...request, status: "CANCELLED" });
      setMessage({ type: "success", text: "Request has been closed." });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setMessage({ type: "error", text: msg });
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-color-border pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-[26px] font-bold text-graphite tracking-tight">
              {request.reference_no}
            </h1>
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider bg-surface-soft px-2.5 py-1 rounded border border-color-border text-graphite">
              {request.request_type.replace(/_/g, " ")}
            </span>
          </div>
          <p className="mt-1 font-mono text-[12px] text-text-muted">
            Submitted on {new Date(request.created_at).toLocaleDateString()} &bull; ID: {request.id}
          </p>
        </div>

        <div>
          <span className="font-mono text-[12px] font-semibold px-3 py-1 rounded border border-color-border bg-surface">
            STATUS: <span className="text-graphite font-bold">{request.status}</span>
          </span>
        </div>
      </div>

      {/* Action Notification */}
      {message && (
        <div
          className={`flex items-center gap-2.5 p-4 text-[13px] rounded-sm border ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Official Quotation Workbench (Rendered when QUOTED, ACCEPTED, or CONVERTED) */}
      {(isQuoted || isAccepted || isOrdered) && (
        <div
          className="bg-surface p-6 sm:p-8"
          style={{ borderRadius: "var(--radius-md)", border: "2px solid var(--color-graphite)" }}
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-color-border pb-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-graphite" />
              <h2 className="text-[18px] font-bold text-graphite">
                Official Engineering Quotation (Revision #{request.quote_revision || 1})
              </h2>
            </div>
            {request.quote_valid_until && (
              <div className="flex items-center gap-1.5 text-[12px] font-mono">
                <Clock className="h-3.5 w-3.5 text-text-muted" />
                <span className={isExpired ? "text-rose-600 font-bold" : "text-text-muted"}>
                  Valid Until: {new Date(request.quote_valid_until).toLocaleDateString()}
                  {isExpired && " (EXPIRED)"}
                </span>
              </div>
            )}
          </div>

          {/* Quotation Financial Summary */}
          <div className="mt-6 space-y-3">
            <div className="overflow-x-auto rounded border border-color-border">
              <table className="w-full text-left text-[13px]">
                <thead className="bg-surface-soft font-mono text-[11px] uppercase text-text-muted border-b border-color-border">
                  <tr>
                    <th className="py-2.5 px-4">Item</th>
                    <th className="py-2.5 px-4 text-center">Quantity</th>
                    <th className="py-2.5 px-4 text-right">Quoted Unit Price</th>
                    <th className="py-2.5 px-4 text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-color-border">
                  {request.items?.map((item: any) => (
                    <tr key={item.id}>
                      <td className="py-2.5 px-4 font-medium text-graphite">{item.title}</td>
                      <td className="py-2.5 px-4 text-center font-mono">{item.requested_quantity}</td>
                      <td className="py-2.5 px-4 text-right font-mono text-text-muted">
                        {item.quoted_unit_price ? formatPrice(Number(item.quoted_unit_price), "inr") : "Pending"}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-graphite">
                        {item.quoted_total ? formatPrice(Number(item.quoted_total), "inr") : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Calculations Box */}
            <div className="ml-auto max-w-xs space-y-1.5 pt-3 text-[13px]">
              <div className="flex justify-between text-text-secondary">
                <span>Subtotal (Net):</span>
                <span className="font-mono">{formatPrice(Number(request.quote_subtotal || 0), "inr")}</span>
              </div>
              <div className="flex justify-between text-text-secondary">
                <span>Shipping & Express Freight:</span>
                <span className="font-mono">{formatPrice(Number(request.quote_shipping || 0), "inr")}</span>
              </div>
              <div className="flex justify-between text-text-secondary">
                <span>Applicable GST / Tax:</span>
                <span className="font-mono">{formatPrice(Number(request.quote_tax || 0), "inr")}</span>
              </div>
              <div className="flex justify-between text-[16px] font-bold text-graphite border-t border-color-border pt-2">
                <span>Total Payable:</span>
                <span className="font-mono text-graphite">{formatPrice(Number(request.quote_total || 0), "inr")}</span>
              </div>
            </div>

            {request.quote_notes && (
              <div className="mt-4 p-3 bg-surface-soft rounded text-[12px] text-text-secondary border border-color-border">
                <span className="font-bold text-graphite block">Engineering Notes:</span>
                {request.quote_notes}
              </div>
            )}
          </div>

          {/* Interactive Acceptance Buttons */}
          {isQuoted && !isExpired && (
            <div className="mt-6 flex flex-wrap items-center justify-end gap-3 border-t border-color-border pt-5">
              <button
                type="button"
                onClick={handleDecline}
                disabled={isProcessing}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-[13px] font-semibold text-rose-600 hover:bg-rose-50 rounded-sm border border-rose-200"
              >
                <XCircle className="h-4 w-4" />
                Decline Quotation
              </button>
              <button
                type="button"
                onClick={handleAccept}
                disabled={isProcessing}
                className="inline-flex items-center gap-2 bg-graphite px-6 py-2.5 text-[13px] font-semibold text-white rounded-sm hover:bg-graphite-soft shadow-xs"
              >
                <CheckCircle2 className="h-4 w-4 text-accent" />
                {isProcessing ? "Processing..." : "Accept Quotation"}
              </button>
            </div>
          )}

          {isAccepted && (
            <div className="mt-6 p-4 bg-emerald-50 rounded border border-emerald-200 flex items-center justify-between text-[13px] text-emerald-800">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <span className="font-semibold">Quotation Accepted on {request.accepted_at ? new Date(request.accepted_at).toLocaleDateString() : "recently"}. Awaiting production conversion.</span>
              </div>
            </div>
          )}

          {isOrdered && (
            <div className="mt-6 p-4 bg-graphite rounded text-white flex items-center justify-between text-[13px]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-accent" />
                <span>Converted to Formal Commercial Order ID: <span className="font-mono font-bold">{request.linked_order_id}</span></span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Engineering Criteria Card (if custom build) */}
      {request.request_type !== "BULK_PURCHASE" && (
        <div
          className="bg-surface p-6"
          style={{ borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}
        >
          <div className="flex items-center gap-2 border-b border-color-border pb-3">
            <Cpu className="h-4 w-4 text-graphite" />
            <h2 className="text-[16px] font-bold text-graphite">Custom Engineering Requirements</h2>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-3 text-[13px]">
            <div>
              <span className="text-[11px] font-mono uppercase text-text-muted block">Intended Application</span>
              <p className="font-medium text-graphite">{request.intended_application || "General Aerial Operation"}</p>
            </div>
            <div>
              <span className="text-[11px] font-mono uppercase text-text-muted block">Target Payload</span>
              <p className="font-medium text-graphite">{request.target_payload_g ? `${request.target_payload_g}g` : "Not specified"}</p>
            </div>
            <div>
              <span className="text-[11px] font-mono uppercase text-text-muted block">Target Flight Time</span>
              <p className="font-medium text-graphite">{request.target_flight_time_min ? `${request.target_flight_time_min} mins` : "Not specified"}</p>
            </div>
            <div>
              <span className="text-[11px] font-mono uppercase text-text-muted block">Operating Environment</span>
              <p className="font-medium text-graphite">{request.operating_environment || "Standard"}</p>
            </div>
            <div>
              <span className="text-[11px] font-mono uppercase text-text-muted block">Sensors / Payload</span>
              <p className="font-medium text-graphite">{request.sensors_payload || "Standard"}</p>
            </div>
            <div>
              <span className="text-[11px] font-mono uppercase text-text-muted block">Telemetry & Link</span>
              <p className="font-medium text-graphite">{request.telemetry_requirements || "Standard"}</p>
            </div>
          </div>
        </div>
      )}

      {/* Commercial & Contact Information */}
      <div
        className="bg-surface p-6"
        style={{ borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}
      >
        <h2 className="text-[16px] font-bold text-graphite border-b border-color-border pb-3">
          Commercial Assurances & Delivery Details
        </h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-3 text-[13px]">
          <div>
            <span className="text-[11px] font-mono uppercase text-text-muted block">Contact Person</span>
            <p className="font-medium text-graphite">{request.contact_name}</p>
            <p className="text-[12px] text-text-secondary">{request.email}</p>
          </div>
          <div>
            <span className="text-[11px] font-mono uppercase text-text-muted block">Organization / GST</span>
            <p className="font-medium text-graphite">{request.company_name || "Direct Purchaser"}</p>
            <p className="text-[12px] font-mono text-text-muted">{request.gstin ? `GST: ${request.gstin}` : "No GST provided"}</p>
          </div>
          <div>
            <span className="text-[11px] font-mono uppercase text-text-muted block">Destination</span>
            <p className="font-medium text-graphite">{request.delivery_city ? `${request.delivery_city}, ${request.delivery_state || ""}` : "Pan-India Express"}</p>
            <p className="text-[12px] text-text-muted">Target Timeframe: {request.timeframe_weeks ? `${request.timeframe_weeks} weeks` : "Standard"}</p>
          </div>
        </div>
      </div>

      {/* Audit Log Timeline */}
      {request.audit_logs?.length > 0 && (
        <div
          className="bg-surface-soft p-6"
          style={{ borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}
        >
          <h2 className="text-[14px] font-bold text-graphite border-b border-color-border pb-2">
            Request Activity & Audit Trail
          </h2>
          <div className="mt-4 space-y-3">
            {request.audit_logs.map((log: any) => (
              <div key={log.id} className="flex items-start gap-3 text-[12px]">
                <span className="font-mono text-[11px] text-text-muted shrink-0 w-36">
                  {new Date(log.created_at).toLocaleString()}
                </span>
                <span className="font-semibold text-graphite shrink-0 w-28 uppercase">
                  [{log.action}]
                </span>
                <span className="text-text-secondary">{log.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
