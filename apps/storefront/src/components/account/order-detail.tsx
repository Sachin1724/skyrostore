"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Package,
  Truck,
  Printer,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowLeft,
  MapPin,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";

type OrderItem = {
  id: string;
  title: string;
  quantity: number;
  unit_price: number;
  total: number;
  thumbnail?: string | null;
};

type Order = {
  id: string;
  display_id: number;
  status: string;
  total: number;
  subtotal: number;
  shipping_total: number;
  currency_code: string;
  email: string;
  created_at: string;
  items: OrderItem[];
  shipping_address?: {
    first_name: string;
    last_name: string;
    address_1: string;
    city: string;
    province: string;
    postal_code: string;
    country_code: string;
  };
  fulfillments?: Array<{
    id: string;
    shipped_at?: string | null;
    delivered_at?: string | null;
    canceled_at?: string | null;
    metadata?: { courier?: string } | null;
    labels?: Array<{ tracking_number?: string | null; tracking_url?: string | null }>;
  }>;
};

export function OrderDetail({ orderId, gstin }: { orderId: string; gstin?: string }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  useEffect(() => {
    fetch(`/api/account/orders/${orderId}`)
      .then((r) => {
        if (r.status === 401) {
          setError("Please sign in to view this order.");
          return null;
        }
        if (r.status === 404) {
          setError("Order not found.");
          return null;
        }
        if (!r.ok) throw new Error("Failed to load order");
        return r.json();
      })
      .then((data) => {
        if (data?.order) setOrder(data.order);
      })
      .catch(() => setError("Unable to load order."))
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-24 rounded-xl" />
        <div className="skeleton h-64 rounded-xl" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="card p-8 text-center">
        <p className="text-[16px] font-bold text-navy">{error || "Order not found."}</p>
        <Link
          href="/account"
          className="btn btn-primary mt-4"
        >
          Sign In to Your Account
        </Link>
      </div>
    );
  }

  const currency = order.currency_code || "inr";
  const shipments = (order.fulfillments || []).filter(
    (fulfillment) => fulfillment.shipped_at && !fulfillment.canceled_at
  );
  const trackingNumber = shipments[0]?.labels?.[0]?.tracking_number;
  const isDelivered = order.status === "completed" || Boolean(shipments[0]?.delivered_at);
  const isShipped = Boolean(shipments[0]?.shipped_at);

  const formattedDate = new Date(order.created_at).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // 18% GST estimate
  const gstPaise = Math.round((order.total * 18) / 118);

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/account/orders"
          className="inline-flex items-center gap-1.5 text-[13px] font-bold text-brand hover:text-navy transition-colors"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          <span>Back to All Orders</span>
        </Link>
      </div>

      {/* Order Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 card p-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-extrabold text-brand">
              Order Details
            </span>
            <span className="text-text-muted">·</span>
            <span className="rounded bg-surface-soft px-2 py-0.5 text-[13px] font-bold text-navy">
              {order.status}
            </span>
          </div>

          <h1 className="mt-1 text-[24px] md:text-[28px] font-extrabold text-navy">
            Order #{order.display_id}
          </h1>

          <p className="mt-1 text-[13px] text-text-secondary">
            Placed on {formattedDate} · Billed to {order.email}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowInvoiceModal(true)}
            className="inline-flex h-11 items-center gap-2 rounded-md border border-border bg-white px-5 text-[13px] font-bold text-navy hover:border-brand hover:text-brand transition-colors"
          >
            <FileText className="h-4 w-4 text-brand" aria-hidden />
            <span>GST Tax Invoice</span>
          </button>
        </div>
      </div>

      {/* Shipment & Tracking Card */}
      <div className="card p-6">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-brand" aria-hidden />
            <h2 className="text-[16px] font-extrabold text-navy">Fulfillment &amp; Courier Tracking</h2>
          </div>
          <span className="text-[13px] font-bold text-text-muted">
            Partner: Delhivery Air Express
          </span>
        </div>

        {/* Visual Progress Steps */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-start gap-3 rounded-lg border border-border bg-surface-soft/40 p-3.5">
            <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" aria-hidden />
            <div>
              <p className="text-[13px] font-bold text-navy">Order Placed &amp; QA Checked</p>
              <p className="text-[13px] text-text-secondary">{formattedDate}</p>
            </div>
          </div>

          <div className={`flex items-start gap-3 rounded-lg border p-3.5 ${isShipped ? "border-border bg-surface-soft/40" : "border-dashed border-border bg-white"}`}>
            {isShipped ? (
              <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" aria-hidden />
            ) : (
              <Clock className="h-5 w-5 text-brand shrink-0 mt-0.5" aria-hidden />
            )}
            <div>
              <p className="text-[13px] font-bold text-navy">Air Express Dispatch</p>
              <p className="text-[13px] text-text-secondary">
                {isShipped ? "Handed over to Delhivery Hub" : "Preparing ESD anti-static packaging"}
              </p>
            </div>
          </div>

          <div className={`flex items-start gap-3 rounded-lg border p-3.5 ${isDelivered ? "border-border bg-surface-soft/40" : "border-dashed border-border bg-white"}`}>
            {isDelivered ? (
              <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" aria-hidden />
            ) : (
              <Package className="h-5 w-5 text-text-muted shrink-0 mt-0.5" aria-hidden />
            )}
            <div>
              <p className="text-[13px] font-bold text-navy">Delivery Complete</p>
              <p className="text-[13px] text-text-secondary">
                {isDelivered ? "Delivered to recipient address" : "In transit to destination PIN"}
              </p>
            </div>
          </div>
        </div>

        {trackingNumber ? (
          <div className="mt-4 flex items-center justify-between rounded-lg bg-brand-soft p-3 text-[13px] text-navy">
            <span>
              Delhivery AWB Number: <strong className="font-mono">{trackingNumber}</strong>
            </span>
            <a
              href={`https://www.delhivery.com/track/package/${trackingNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-brand hover:underline"
            >
              Track on Delhivery.com &rarr;
            </a>
          </div>
        ) : null}
      </div>

      {/* Grid: Items & Order Summary */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* Items */}
        <div className="card p-6">
          <h2 className="text-[16px] font-extrabold text-navy border-b border-border pb-3">
            Hardware Line Items ({order.items.length})
          </h2>

          <div className="mt-4 divide-y divide-border">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-4">
                <div className="min-w-0 pr-4">
                  <p className="text-[16px] font-bold text-navy leading-snug">
                    {item.title?.replace("[DEV] ", "")}
                  </p>
                  <p className="mt-1 text-[13px] tabular-nums text-text-muted">
                    Qty: {item.quantity} × {formatPrice(item.unit_price, currency)}
                  </p>
                </div>
                <p className="text-[16px] font-extrabold tabular-nums text-navy shrink-0">
                  {formatPrice(item.total, currency)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Summary & Address */}
        <div className="space-y-6">
          {/* Price Breakdown */}
          <div className="card p-6">
            <h3 className="text-[16px] font-extrabold text-navy border-b border-border pb-3">
              Payment Summary
            </h3>

            <dl className="mt-4 space-y-2 text-[14px] text-text-secondary">
              <div className="flex justify-between">
                <dt>Subtotal</dt>
                <dd className="tabular-nums font-semibold text-navy">
                  {formatPrice(order.subtotal, currency)}
                </dd>
              </div>

              <div className="flex justify-between">
                <dt>Delhivery Express Shipping</dt>
                <dd className="tabular-nums font-semibold text-navy">
                  {order.shipping_total > 0 ? formatPrice(order.shipping_total, currency) : "FREE"}
                </dd>
              </div>

              <div className="flex justify-between">
                <dt>Included 18% GST (ITC)</dt>
                <dd className="tabular-nums text-text-muted">
                  {formatPrice(gstPaise, currency)}
                </dd>
              </div>

              <div className="flex items-baseline justify-between border-t border-border pt-3">
                <dt className="text-[16px] font-extrabold text-navy">Total Paid</dt>
                <dd className="text-[22px] font-extrabold tabular-nums text-navy">
                  {formatPrice(order.total, currency)}
                </dd>
              </div>
            </dl>
          </div>

          {/* Delivery Address */}
          {order.shipping_address ? (
            <div className="card p-6 text-[13px]">
              <div className="flex items-center gap-2 text-navy font-bold border-b border-border pb-2.5">
                <MapPin className="h-4 w-4 text-brand" aria-hidden />
                <span>Shipping Address</span>
              </div>
              <div className="mt-3 text-text-secondary leading-relaxed">
                <p className="font-bold text-navy">
                  {order.shipping_address.first_name} {order.shipping_address.last_name}
                </p>
                <p>{order.shipping_address.address_1}</p>
                <p>
                  {order.shipping_address.city}, {order.shipping_address.province} {order.shipping_address.postal_code}
                </p>
                <p>{order.shipping_address.country_code?.toUpperCase()}</p>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Invoice Modal */}
      {showInvoiceModal ? (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-navy/70 print:static print:bg-white print:p-0"
        >
          <div className="absolute inset-0 print:hidden" onClick={() => setShowInvoiceModal(false)} aria-hidden />

          <div className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col card shadow-2xl overflow-hidden print:static print:max-h-none print:w-full print:max-w-none print:shadow-none print:overflow-visible">
            <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-surface-soft print:hidden">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-brand" aria-hidden />
                <h2 className="text-[16px] font-extrabold text-navy">Tax Invoice #{order.display_id}</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border bg-white px-3 py-1.5 text-[13px] font-bold text-navy hover:bg-surface-soft"
                >
                  <Printer className="h-3.5 w-3.5" aria-hidden />
                  <span>Print / Save as PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowInvoiceModal(false)}
                  className="rounded-md border border-border bg-white px-2.5 py-1 text-[13px] font-bold text-text-muted hover:text-navy"
                >
                  Close
                </button>
              </div>
            </div>

            <div id="printable-invoice" className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 text-navy print:overflow-visible">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-border pb-6">
                <div>
                  <span className="text-[18px] font-extrabold tracking-tight text-navy">
                    SKYROSTORE SYSTEMS PRIVATE LIMITED
                  </span>
                  <p className="mt-1 text-[13px] text-text-secondary leading-relaxed">
                    Infocity Complex, Bhubaneswar, Odisha 751024<br />
                    <strong>GSTIN:</strong> {gstin || "21AAECS9821R1ZM"}<br />
                    <strong>State Code:</strong> 21 (Odisha)
                  </p>
                </div>

                <div className="text-left sm:text-right text-[13px]">
                  <p className="font-bold text-navy text-[14px]">Invoice #{order.display_id}</p>
                  <p className="text-text-secondary">Date: {formattedDate}</p>
                  <p className="text-text-secondary">Payment: Prepaid (Razorpay)</p>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full text-left text-[13px] border border-border rounded-lg overflow-hidden">
                <thead className="bg-surface-soft text-[13px] font-extrabold text-text-muted border-b border-border">
                  <tr>
                    <th className="p-3">Description</th>
                    <th className="p-3 text-center">HSN</th>
                    <th className="p-3 text-center">Qty</th>
                    <th className="p-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {order.items.map((item) => (
                    <tr key={item.id}>
                      <td className="p-3 font-semibold text-navy">{item.title?.replace("[DEV] ", "")}</td>
                      <td className="p-3 text-center font-mono text-[13px]">88069000</td>
                      <td className="p-3 text-center tabular-nums">{item.quantity}</td>
                      <td className="p-3 text-right font-bold tabular-nums">{formatPrice(item.total, currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-between items-center rounded-lg border border-border bg-surface-soft/40 p-4 text-[13px]">
                <div>
                  <span className="font-bold text-navy">18% GST Included (ITC claimable)</span>
                  <span className="block text-[13px] text-text-muted">HSN Code 88069000: Unmanned Aircraft Systems &amp; Avionics</span>
                </div>
                <div className="text-right">
                  <span className="text-[13px] uppercase text-text-muted">Total Paid</span>
                  <span className="block text-[18px] font-extrabold tabular-nums text-navy">
                    {formatPrice(order.total, currency)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
