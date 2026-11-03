"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createTimeline, stagger, svg } from "animejs";
import { useIconHover } from "@animateicons/react";
import { PackageCheckIcon, TruckIcon, ClipboardCheckIcon, ArrowRightIcon } from "@animateicons/react/lucide";
import { Printer, FileText, CheckCircle2, ShieldCheck, MapPin } from "lucide-react";
import { formatPrice } from "@/lib/utils";

type Summary = {
  display_id?: number | string;
  email?: string;
  total?: number;
  currency_code?: string;
  item_count?: number;
};

// A quad seen from above: four arms, four motors, four two-blade props, a body.
const ARMS = [
  [120, 120, 52, 52],
  [120, 120, 188, 52],
  [120, 120, 52, 188],
  [120, 120, 188, 188],
] as const;

function NextStep({ icon: Icon, title, body }: { icon: typeof TruckIcon; title: string; body: string }) {
  const { ref, triggerProps } = useIconHover();
  return (
    <li {...triggerProps} className="success-rise flex gap-4 py-3.5">
      <span className="mt-0.5 text-brand">
        <Icon ref={ref} size={22} />
      </span>
      <span>
        <span className="block text-[15px] font-bold text-navy">{title}</span>
        <span className="block text-[14px] text-text-secondary">{body}</span>
      </span>
    </li>
  );
}

function ActionLink({ href, children, primary }: { href: string; children: React.ReactNode; primary?: boolean }) {
  const { ref, triggerProps } = useIconHover();
  return (
    <Link
      href={href}
      {...triggerProps}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-6 text-[14px] font-bold transition-colors ${
        primary ? "bg-brand text-white hover:bg-navy shadow-sm" : "border border-border bg-white text-navy hover:bg-surface-soft"
      }`}
    >
      {children}
      {primary ? <ArrowRightIcon ref={ref} size={16} /> : null}
    </Link>
  );
}

/**
 * Payment confirmed: the quad draws itself, its props spin up, the check lands
 * in the body, then the order details rise in.
 */
export function OrderSuccess({ orderId, summary }: { orderId?: string; summary: Summary | null }) {
  const root = useRef<HTMLDivElement>(null);
  const timeline = useRef<ReturnType<typeof createTimeline> | null>(null);
  const [done, setDone] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDone(true);
      return;
    }

    const arms = svg.createDrawable(el.querySelectorAll(".quad-arm"));
    const check = svg.createDrawable(el.querySelectorAll(".quad-check"));

    const tl = createTimeline({ defaults: { ease: "outExpo" }, onComplete: () => setDone(true) })
      .add(arms, { draw: ["0 0", "0 1"], opacity: [0, 1], duration: 520, delay: stagger(70) })
      .add(".quad-motor", { scale: [0, 1], opacity: [0, 1], duration: 420, delay: stagger(60), ease: "outBack(2)" }, "-=260")
      .add(".quad-prop", { rotate: [0, 720], opacity: [0, 1], duration: 900, delay: stagger(40), ease: "inOutQuad" }, "-=300")
      .add(".quad-body", { scale: [0.6, 1], opacity: [0, 1], duration: 380, ease: "outBack(2.4)" }, "-=700")
      .add(check, { draw: ["0 0", "0 1"], opacity: [0, 1], duration: 360, ease: "outQuad" }, "-=200")
      .add(".success-rise", { y: [24, 0], opacity: [0, 1], duration: 520, delay: stagger(80) }, "-=160");

    timeline.current = tl;
    return () => {
      tl.revert();
    };
  }, []);

  const skip = () => {
    if (done || !timeline.current) return;
    timeline.current.seek(timeline.current.duration);
  };

  const currency = (summary?.currency_code || "inr").toUpperCase();
  const today = new Date().toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div ref={root} onClick={skip} className={done ? "success-done" : "success-playing"}>
      <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-14">
        {/* Animated Quad SVG */}
        <svg
          viewBox="0 0 240 240"
          role="img"
          aria-label="Order confirmed"
          className="mx-auto w-full max-w-[200px] lg:max-w-[400px]"
        >
          {ARMS.map(([x1, y1, x2, y2], i) => (
            <line key={`arm-${i}`} className="quad-arm" x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--color-navy)" strokeWidth={8} strokeLinecap="round" />
          ))}
          {ARMS.map(([, , x, y], i) => (
            <g key={`motor-${i}`}>
              <g className="quad-prop" style={{ transformOrigin: `${x}px ${y}px`, transformBox: "view-box" }}>
                <line x1={x - 30} y1={y} x2={x + 30} y2={y} stroke="var(--color-brand-bright)" strokeWidth={5} strokeLinecap="round" />
              </g>
              <circle className="quad-motor" cx={x} cy={y} r={11} fill="var(--color-navy)" style={{ transformOrigin: `${x}px ${y}px`, transformBox: "view-box" }} />
            </g>
          ))}
          <circle className="quad-body" cx={120} cy={120} r={34} fill="var(--color-brand)" style={{ transformOrigin: "120px 120px", transformBox: "view-box" }} />
          <path className="quad-check" d="M104 121 L116 133 L138 109" fill="none" stroke="#fff" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
        </svg>

        <div>
          <div className="success-rise inline-flex items-center gap-1.5 rounded bg-success/10 px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wider text-success">
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
            Payment Verified &amp; Confirmed
          </div>

          <h1 className="success-rise mt-3 text-[clamp(2.5rem,1.6rem+4vw,4.5rem)] font-extrabold leading-[1.02] tracking-[-0.04em] text-navy">
            Order Confirmed.
          </h1>

          <p className="success-rise mt-4 max-w-[50ch] text-[16px] leading-relaxed text-text-secondary">
            Payment has been successfully processed through Razorpay.{" "}
            {summary?.email ? <>A confirmation receipt has been dispatched to <strong className="text-navy">{summary.email}</strong>. </> : null}
            {summary?.display_id ? (
              <>Order reference is <span className="font-extrabold text-navy tabular-nums">#{summary.display_id}</span>
                {summary.total != null ? <>, total <span className="font-bold text-navy">{formatPrice(summary.total, currency)}</span></> : null}
                {summary.item_count ? <>, containing <span className="font-bold text-navy">{summary.item_count} {summary.item_count === 1 ? "part" : "parts"}</span></> : null}.</>
            ) : orderId ? (
              <>Order Reference is <span className="font-bold text-navy">{orderId}</span>.</>
            ) : null}
          </p>

          <div className="success-rise mt-6 flex flex-wrap items-center gap-3">
            <ActionLink href="/account/orders" primary>
              Track Order Live
            </ActionLink>

            <button
              type="button"
              onClick={() => setShowInvoiceModal(true)}
              className="inline-flex min-h-11 items-center gap-2 rounded-md border border-border-strong bg-white px-5 text-[14px] font-bold text-navy shadow-sm transition-colors hover:border-brand hover:text-brand"
            >
              <FileText className="h-4 w-4 text-brand" aria-hidden />
              <span>View GST Tax Invoice</span>
            </button>

            <ActionLink href="/parts">
              Continue Shopping
            </ActionLink>
          </div>

          {/* Fulfillment Pipeline */}
          <ol className="mt-8 divide-y divide-border rounded-xl border border-border bg-white px-5 py-2 shadow-sm">
            <NextStep
              icon={ClipboardCheckIcon}
              title="Technical Inspection &amp; Batch QA"
              body="Every brushless motor, flight controller, and ESC is inspected for parameter tolerances in our Odisha facility."
            />
            <NextStep
              icon={PackageCheckIcon}
              title="Delhivery Air Express Dispatch"
              body="Parcels are secured in anti-static ESD packaging. AWB tracking number arrives via SMS and email."
            />
            <NextStep
              icon={TruckIcon}
              title="Tracked Courier Delivery"
              body="Monitor live GPS waypoints from Bhubaneswar to your PIN code under your account orders."
            />
          </ol>
        </div>
      </div>

      {/* GST Tax Invoice Modal */}
      {showInvoiceModal ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="invoice-modal-title"
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-navy/70 backdrop-blur-sm"
        >
          <div className="absolute inset-0" onClick={() => setShowInvoiceModal(false)} aria-hidden />

          <div className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl border border-border bg-white shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-surface-soft">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-brand" aria-hidden />
                <h2 id="invoice-modal-title" className="text-[17px] font-extrabold text-navy">
                  Tax Invoice / Receipt
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border bg-white px-3 py-1.5 text-[12px] font-bold text-navy hover:bg-surface-soft"
                >
                  <Printer className="h-3.5 w-3.5" aria-hidden />
                  <span>Print</span>
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

            {/* Printable Invoice Body */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 text-navy">
              {/* Company & Invoice Meta */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-border pb-6">
                <div>
                  <span className="text-[20px] font-extrabold tracking-tight text-navy">
                    SKYROSTORE SYSTEMS
                  </span>
                  <p className="mt-1 text-[12px] text-text-secondary leading-relaxed">
                    Technology Hub, Infocity Road<br />
                    Bhubaneswar, Odisha 751024, India<br />
                    <strong>GSTIN:</strong> 21AAECS9821R1ZM<br />
                    <strong>State:</strong> Odisha (Code: 21)
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <span className="inline-block rounded bg-brand-soft px-2.5 py-0.5 text-[11px] font-extrabold uppercase text-brand">
                    ORIGINAL FOR RECIPIENT
                  </span>
                  <p className="mt-2 text-[14px] font-bold text-navy">
                    Invoice #{summary?.display_id ?? orderId ?? "PENDING"}
                  </p>
                  <p className="text-[12px] text-text-secondary">Date: {today}</p>
                  <p className="text-[12px] text-text-secondary">Payment: Razorpay / Prepaid</p>
                </div>
              </div>

              {/* Recipient Details */}
              <div className="rounded-lg border border-border bg-surface-soft/60 p-4">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-text-muted">
                  Billed To
                </span>
                <p className="mt-1 text-[14px] font-bold text-navy">
                  {summary?.email ?? "Verified Customer"}
                </p>
                <p className="text-[12px] text-text-secondary">
                  Place of Supply: India · Courier via Delhivery Tracked Express
                </p>
              </div>

              {/* Items Breakdown Table */}
              <div className="rounded-lg border border-border overflow-hidden">
                <table className="w-full text-left text-[13px]">
                  <thead className="bg-surface-soft text-[11px] font-extrabold uppercase text-text-muted border-b border-border">
                    <tr>
                      <th className="p-3">Description</th>
                      <th className="p-3 text-center">HSN/SAC</th>
                      <th className="p-3 text-center">Qty</th>
                      <th className="p-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    <tr>
                      <td className="p-3">
                        <span className="font-bold text-navy">UAV Components &amp; Avionics Hardware</span>
                        <span className="block text-[11px] text-text-muted">Order Ref: #{summary?.display_id ?? orderId}</span>
                      </td>
                      <td className="p-3 text-center font-mono text-[12px]">88069000</td>
                      <td className="p-3 text-center tabular-nums">{summary?.item_count ?? 1}</td>
                      <td className="p-3 text-right font-bold tabular-nums">
                        {summary?.total != null ? formatPrice(summary.total, currency) : "Paid"}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Tax ITC Summary */}
              <div className="flex justify-between items-center rounded-lg border border-border bg-surface-soft/40 p-4 text-[13px]">
                <div>
                  <span className="font-bold text-navy">Statutory GST 18% Included</span>
                  <span className="block text-[11px] text-text-muted">
                    Eligible for Input Tax Credit (ITC) under Section 16 of CGST Act
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] uppercase text-text-muted">Total Paid</span>
                  <span className="block text-[18px] font-extrabold tabular-nums text-navy">
                    {summary?.total != null ? formatPrice(summary.total, currency) : "Paid in Full"}
                  </span>
                </div>
              </div>

              <div className="border-t border-border pt-4 text-center text-[11px] text-text-muted">
                Computer-generated tax invoice. No signature required. Skyrostore Systems Private Limited.
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
