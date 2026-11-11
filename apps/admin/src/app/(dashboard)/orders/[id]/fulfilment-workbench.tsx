"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Package, Truck, CheckCircle2, AlertTriangle, Printer, Ban, Undo2 } from "lucide-react";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { STATE_LABELS } from "@/lib/data/fulfilment";

type Props = {
  orderId: string;
  order: Record<string, any>;
  packingList: Array<Record<string, any>>;
  fulfilments: Array<Record<string, any>>;
  paymentAttempts: Array<Record<string, any>>;
  bulkRequest: Record<string, any> | null;
  history: Array<{ at: string; event: string; detail?: string | null }>;
  shipmozoConfigured: boolean;
  suggestedWeightG: number;
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-md border border-gray-200 bg-white p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

const MILESTONES = ["Paid", "Packed", "Courier booked", "Dispatched", "Delivered"] as const;

/** Current milestone index for the stepper; -1 before payment, cancelled has no place on the line. */
function milestoneIndex(state: string, booked: boolean): number {
  if (state === "delivered") return 4;
  if (state === "shipped") return 3;
  if (state === "packed") return booked ? 2 : 1;
  if (state === "paid_processing") return 0;
  return -1;
}

function MilestoneStepper({ state, booked }: { state: string; booked: boolean }) {
  if (state === "cancelled" || state === "payment_failed" || state === "awaiting_payment") return null;
  const current = milestoneIndex(state, booked);
  return (
    <ol className="flex items-center gap-1.5" aria-label="Fulfilment progress">
      {MILESTONES.map((label, i) => (
        <li key={label} className="flex items-center gap-1.5">
          <span
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
              i <= current ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-500"
            }`}
          >
            {label}
          </span>
          {i < MILESTONES.length - 1 ? <span className="h-px w-3 bg-gray-300" aria-hidden /> : null}
        </li>
      ))}
    </ol>
  );
}

const PACKAGE_PRESETS = [
  { label: "Component parcel", weight_g: "300", length_cm: "20", width_cm: "15", height_cm: "10" },
  { label: "Quadcopter kit", weight_g: "1200", length_cm: "40", width_cm: "30", height_cm: "15" },
  { label: "Heavy UAV box", weight_g: "4500", length_cm: "60", width_cm: "50", height_cm: "30" },
] as const;

export function FulfilmentWorkbench({
  orderId,
  order,
  packingList,
  fulfilments,
  paymentAttempts,
  bulkRequest,
  history,
  shipmozoConfigured,
  suggestedWeightG,
}: Props) {
  const router = useRouter();
  const [courier, setCourier] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [ewayBill, setEwayBill] = useState("");
  const [serials, setSerials] = useState<Record<string, string>>({});
  const [pkg, setPkg] = useState({
    weight_g: suggestedWeightG ? String(suggestedWeightG) : "",
    length_cm: "",
    width_cm: "",
    height_cm: "",
  });
  const [busy, setBusy] = useState<"" | "pack" | "book" | "ship" | "deliver" | "cancel" | "refund">("");
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const confirm = useConfirm();

  const state: string = order.fulfilment_state;
  const address = order.shipping_address || {};
  const isInvoiced = order.metadata?.payment_terms === "invoice";

  const booked = fulfilments.find((f) => f.awb && !f.canceled_at);
  const pkgReady = Object.values(pkg).every((v) => Number(v) > 0);

  // GST Rule 138: an inter-state consignment over ₹50,000 needs an e-Way Bill before transport.
  const interState = (address.province || "").trim().toLowerCase() !== "odisha";
  const ewayBillRequired = interState && Number(order.total || 0) >= 50000;

  // LiPo batteries are DGCA Class 9 dangerous goods (UN 3480/3481) — standard air
  // express refuses standalone battery parcels, so the one-click air-courier path
  // is blocked here; ops must arrange surface transport and enter tracking manually.
  const hasStandaloneBattery = (order.items || []).some((i: any) => i.product?.metadata?.component_type === "BATTERY");

  // Medusa's cancel-order workflow refuses once any fulfillment exists, i.e. once packed.
  const cancellable = ["awaiting_payment", "payment_failed", "paid_processing"].includes(state);
  const payment = order.payment_collections?.[0]?.payments?.find((p: any) => p.captured_at && !p.canceled_at);
  const [refundAmount, setRefundAmount] = useState(String(payment?.amount ?? order.total ?? ""));
  const [refundNote, setRefundNote] = useState("");

  async function cancelOrder() {
    if (!(await confirm({ title: "Cancel this order?", description: "This cannot be undone. Any captured payment is not refunded automatically.", confirmLabel: "Cancel order" }))) return;
    setBusy("cancel");
    setMessage(null);
    try {
      const res = await fetch(`/api/orders/${orderId}/cancel`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || data.error || "Could not cancel order.");
      setMessage({ kind: "ok", text: "Order cancelled." });
      router.refresh();
    } catch (err: unknown) {
      setMessage({ kind: "error", text: err instanceof Error ? err.message : "Could not cancel order." });
    } finally {
      setBusy("");
    }
  }

  async function issueRefund() {
    if (!payment) return;
    const amount = Number(refundAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setMessage({ kind: "error", text: "Enter a refund amount greater than 0." });
      return;
    }
    if (!(await confirm({ title: `Refund ${amount} ${order.currency_code?.toUpperCase()}?`, description: "Sent to the customer's original payment method via Razorpay.", confirmLabel: "Issue refund" }))) return;
    setBusy("refund");
    setMessage(null);
    try {
      const res = await fetch(`/api/payments/${payment.id}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, note: refundNote || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || data.error || "Could not issue refund.");
      setMessage({ kind: "ok", text: "Refund issued." });
      router.refresh();
    } catch (err: unknown) {
      setMessage({ kind: "error", text: err instanceof Error ? err.message : "Could not issue refund." });
    } finally {
      setBusy("");
    }
  }

  async function run(action: "pack" | "book" | "ship" | "deliver", body: Record<string, unknown> = {}) {
    setBusy(action);
    setMessage(null);
    try {
      const res = await fetch(`/api/fulfilment/${orderId}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ kind: "error", text: data.error || `Could not ${action} this order.` });
        return;
      }
      if (action === "book") {
        setMessage({
          kind: "ok",
          text: `${data.already_booked ? "Already booked" : "Booked"} with ${data.courier} · AWB ${data.awb}. Customer notified — print the label below.`,
        });
        router.refresh();
        return;
      }
      const already = data.already_packed || data.already_shipped || data.already_delivered;
      setMessage({
        kind: "ok",
        text: already
          ? `Already ${action === "pack" ? "packed" : action === "ship" ? "shipped" : "delivered"} — no change made.`
          : `Order ${action === "pack" ? "marked packed" : action === "ship" ? "marked shipped and customer notified" : "marked delivered"}.`,
      });
      router.refresh();
    } catch (err: unknown) {
      setMessage({ kind: "error", text: err instanceof Error ? err.message : "Request failed." });
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="mt-2 space-y-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-xl font-semibold text-gray-900">
          Order #{order.display_id ?? order.id}
          {bulkRequest ? (
            <span className="ml-2 rounded bg-lime-100 px-2 py-0.5 text-xs font-semibold text-gray-900">
              Bulk {bulkRequest.reference_no}
            </span>
          ) : null}
        </h1>
        <div className="flex items-center gap-2">
          {cancellable ? (
            <button
              type="button"
              onClick={cancelOrder}
              disabled={busy !== ""}
              className="inline-flex items-center gap-1.5 rounded border border-rose-200 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-40"
            >
              <Ban className="h-3.5 w-3.5" />
              {busy === "cancel" ? "Cancelling…" : "Cancel order"}
            </button>
          ) : null}
          <span className="rounded bg-gray-900 px-2.5 py-1 font-mono text-xs font-medium text-white">
            {STATE_LABELS[state] || state}
          </span>
        </div>
      </div>

      <MilestoneStepper state={state} booked={Boolean(booked)} />

      {message ? (
        <div
          className={`rounded border px-3 py-2 text-sm ${
            message.kind === "ok"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          {message.text}
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          <Section title="Pack this order">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wider text-gray-500">
                  <th className="pb-2 pr-4">Item</th>
                  <th className="pb-2 pr-4">SKU</th>
                  <th className="pb-2 pr-4 text-right">Qty</th>
                  <th className="pb-2 pr-4 text-right">Packed</th>
                  <th className="pb-2">Serial # (optional)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {packingList.map((item) => (
                  <tr key={item.line_item_id}>
                    <td className="py-2 pr-4">
                      <span className="font-medium text-gray-900">{item.title}</span>
                      {item.variant_title ? (
                        <span className="ml-1 text-gray-500">({item.variant_title})</span>
                      ) : null}
                      {item.is_bundle ? (
                        <ul className="mt-1 list-inside list-disc text-xs text-gray-600">
                          {item.bundle_contents.map((content: any, idx: number) => (
                            <li key={`${item.line_item_id}-${idx}`}>
                              {content.quantity} × {content.title}
                              {content.sku ? ` · ${content.sku}` : ""}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </td>
                    <td className="py-2 pr-4 font-mono text-xs text-gray-600">{item.sku || "—"}</td>
                    <td className="py-2 pr-4 text-right">{item.quantity}</td>
                    <td className="py-2 pr-4 text-right text-gray-600">{item.fulfilled_quantity}</td>
                    <td className="py-2">
                      {state === "packed" || state === "shipped" || state === "delivered" ? (
                        <span className="font-mono text-xs text-gray-700">
                          {fulfilments.find((f) => !f.canceled_at)?.metadata?.serial_numbers?.[item.line_item_id] || "—"}
                        </span>
                      ) : (
                        <input
                          value={serials[item.line_item_id] || ""}
                          onChange={(e) => setSerials({ ...serials, [item.line_item_id]: e.target.value })}
                          placeholder="e.g. PX4-CUBEOR-00417"
                          className="w-full rounded border border-gray-300 px-2 py-1 text-xs font-mono"
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => run("pack", { ...(isInvoiced ? { allow_unpaid: true } : {}), serial_numbers: serials })}
                disabled={busy !== "" || ["packed", "shipped", "delivered", "cancelled"].includes(state)}
                className="inline-flex items-center gap-2 rounded bg-gray-900 px-3 py-2 text-xs font-semibold text-white disabled:opacity-40"
              >
                <Package className="h-4 w-4" />
                {busy === "pack" ? "Marking packed…" : "Mark packed"}
              </button>
              {isInvoiced ? (
                <span className="inline-flex items-center gap-1 text-xs text-amber-800">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Invoiced bulk order — packing is allowed before payment capture.
                </span>
              ) : null}
            </div>
          </Section>

          <Section title="Courier booking & label">
            {booked ? (
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span>
                  <span className="font-medium text-gray-900">{booked.courier}</span>
                  <span className="ml-2 font-mono text-xs text-gray-600">AWB {booked.awb}</span>
                </span>
                <a
                  href={`/api/fulfilment/${orderId}/label`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded bg-gray-900 px-3 py-2 text-xs font-semibold text-white"
                >
                  <Printer className="h-4 w-4" />
                  Print label
                </a>
                {booked.tracking_urls?.[0] ? (
                  <a href={booked.tracking_urls[0]} target="_blank" rel="noreferrer" className="text-xs text-gray-600 underline">
                    Track parcel
                  </a>
                ) : null}
              </div>
            ) : !shipmozoConfigured ? (
              <p className="text-sm text-gray-600">
                Shipmozo is not configured, so couriers cannot be booked automatically. Set
                <span className="font-mono text-xs"> SHIPMOZO_PUBLIC_KEY</span> and
                <span className="font-mono text-xs"> SHIPMOZO_PRIVATE_KEY</span> on the backend, or ship manually below.
              </p>
            ) : hasStandaloneBattery ? (
              <p className="rounded border border-amber-300 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
                <strong>Contains a standalone LiPo battery</strong> — DGCA Class 9 dangerous goods (UN 3480/3481).
                Standard air express refuses these. Arrange Surface Express transport with the courier directly,
                then enter the tracking details in &quot;Ship manually&quot; below — one-click air booking is disabled for this order.
              </p>
            ) : (
              <>
                <p className="text-sm text-gray-600">
                  Weigh and measure the packed box. Booking sends the order to Shipmozo, assigns the courier
                  (Delhivery, per your auto-assign rule), generates the label and notifies the customer.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {PACKAGE_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setPkg({ weight_g: preset.weight_g, length_cm: preset.length_cm, width_cm: preset.width_cm, height_cm: preset.height_cm })}
                      className="rounded border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                      {preset.label} ({preset.weight_g}g)
                    </button>
                  ))}
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-4">
                  {(
                    [
                      ["weight_g", "Weight (g)"],
                      ["length_cm", "Length (cm)"],
                      ["width_cm", "Width (cm)"],
                      ["height_cm", "Height (cm)"],
                    ] as const
                  ).map(([key, label]) => (
                    <label key={key} className="text-xs font-medium text-gray-600">
                      {label}
                      <input
                        type="number"
                        inputMode="numeric"
                        min={1}
                        value={pkg[key]}
                        onChange={(e) => setPkg({ ...pkg, [key]: e.target.value })}
                        className="mt-1 w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
                      />
                    </label>
                  ))}
                </div>
                {pkgReady ? (() => {
                  const volumetricG = Math.round(((Number(pkg.length_cm) * Number(pkg.width_cm) * Number(pkg.height_cm)) / 5000) * 1000);
                  const chargeableG = Math.max(Number(pkg.weight_g), volumetricG);
                  return volumetricG > Number(pkg.weight_g) ? (
                    <p className="mt-2 text-xs text-amber-700">
                      Volumetric weight is {volumetricG}g (L×W×H ÷ 5000) — courier bills on the higher figure.
                      Chargeable weight: <strong>{chargeableG}g</strong>.
                    </p>
                  ) : null;
                })() : null}
                {ewayBillRequired ? (
                  <label className="mt-3 block text-xs font-medium text-gray-600">
                    e-Way Bill number — required, order is ₹{Number(order.total).toLocaleString("en-IN")} shipping out of state (GST Rule 138)
                    <input
                      value={ewayBill}
                      onChange={(e) => setEwayBill(e.target.value)}
                      placeholder="12-digit e-Way Bill number"
                      className="mt-1 w-full rounded border border-amber-300 bg-amber-50 px-2 py-1.5 text-sm"
                    />
                  </label>
                ) : null}
                <button
                  type="button"
                  onClick={() => run("book", { ...pkg, eway_bill_number: ewayBill || undefined })}
                  disabled={busy !== "" || state !== "packed" || !pkgReady || (ewayBillRequired && !ewayBill.trim())}
                  className="mt-4 inline-flex items-center gap-2 rounded bg-gray-900 px-3 py-2 text-xs font-semibold text-white disabled:opacity-40"
                >
                  <Printer className="h-4 w-4" />
                  {busy === "book" ? "Booking courier…" : "Book courier & generate label"}
                </button>
                {state !== "packed" ? (
                  <p className="mt-2 text-xs text-gray-500">Available once the order is marked packed.</p>
                ) : null}
              </>
            )}
            <div className="mt-4">
              <button
                type="button"
                onClick={() => run("deliver")}
                disabled={busy !== "" || state !== "shipped"}
                className="inline-flex items-center gap-2 rounded border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-800 disabled:opacity-40"
              >
                <CheckCircle2 className="h-4 w-4" />
                {busy === "deliver" ? "Confirming…" : "Mark delivered"}
              </button>
              {booked ? (
                <span className="ml-3 text-xs text-gray-500">Updates automatically when the courier reports delivery.</span>
              ) : null}
            </div>
          </Section>

          <details className="rounded-md border border-gray-200 bg-white p-5" open={!shipmozoConfigured}>
            <summary className="cursor-pointer text-sm font-semibold uppercase tracking-wider text-gray-500">
              Ship manually (own courier)
            </summary>
            <div className="mt-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="text-xs font-medium text-gray-600">
                Courier
                <input
                  value={courier}
                  onChange={(e) => setCourier(e.target.value)}
                  placeholder="Delhivery"
                  className="mt-1 w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
                />
              </label>
              <label className="text-xs font-medium text-gray-600">
                Tracking number
                <input
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="ABCD1234567"
                  className="mt-1 w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
                />
              </label>
              <label className="text-xs font-medium text-gray-600">
                Tracking URL (optional)
                <input
                  value={trackingUrl}
                  onChange={(e) => setTrackingUrl(e.target.value)}
                  placeholder="https://…"
                  className="mt-1 w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
                />
              </label>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() =>
                  run("ship", {
                    courier,
                    tracking_number: trackingNumber,
                    tracking_url: trackingUrl || undefined,
                  })
                }
                disabled={busy !== "" || state !== "packed" || !courier.trim() || !trackingNumber.trim()}
                className="inline-flex items-center gap-2 rounded bg-gray-900 px-3 py-2 text-xs font-semibold text-white disabled:opacity-40"
              >
                <Truck className="h-4 w-4" />
                {busy === "ship" ? "Marking shipped…" : "Mark shipped & notify customer"}
              </button>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Filling this form changes nothing on its own. The order moves to shipped only when you
              confirm, and confirming twice does not create a second shipment.
            </p>

            {fulfilments.length ? (
              <ul className="mt-4 space-y-2 text-xs text-gray-700">
                {fulfilments.map((f) => (
                  <li key={f.id} className="rounded border border-gray-200 px-2.5 py-2">
                    <span className="font-mono">{f.id}</span>
                    {f.courier ? <span> · {f.courier}</span> : null}
                    {f.tracking_numbers?.length ? <span> · {f.tracking_numbers.join(", ")}</span> : null}
                    <span className="ml-1 text-gray-500">
                      {f.delivered_at
                        ? `delivered ${new Date(f.delivered_at).toLocaleString()}`
                        : f.shipped_at
                        ? `shipped ${new Date(f.shipped_at).toLocaleString()}`
                        : "packed"}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
            </div>
          </details>

          <Section title="Status & transaction history">
            {history.length === 0 ? (
              <p className="text-sm text-gray-500">No history recorded.</p>
            ) : (
              <ol className="space-y-2 text-sm">
                {history.map((entry, idx) => (
                  <li key={`${entry.event}-${idx}`} className="flex gap-3">
                    <span className="w-40 shrink-0 font-mono text-xs text-gray-500">
                      {new Date(entry.at).toLocaleString()}
                    </span>
                    <span className="font-medium text-gray-900">{entry.event}</span>
                    {entry.detail ? <span className="text-gray-600">{entry.detail}</span> : null}
                  </li>
                ))}
              </ol>
            )}
          </Section>
        </div>

        <div className="space-y-5">
          <Section title="Customer & address">
            <p className="text-sm font-medium text-gray-900">
              {address.first_name} {address.last_name}
            </p>
            <p className="mt-1 text-sm text-gray-600">{order.email}</p>
            {address.phone ? <p className="text-sm text-gray-600">{address.phone}</p> : null}
            <p className="mt-2 text-sm text-gray-700">
              {[address.company, address.address_1, address.address_2, address.city, address.province, address.postal_code, address.country_code?.toUpperCase()]
                .filter(Boolean)
                .join(", ")}
            </p>
          </Section>

          <Section title="Payment">
            <dl className="space-y-1 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Status</dt>
                <dd className="font-mono text-xs">{order.payment_status}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Order total</dt>
                <dd className="font-medium">
                  {order.total} {order.currency_code?.toUpperCase()}
                </dd>
              </div>
            </dl>
            {paymentAttempts.length ? (
              <ul className="mt-3 space-y-2 text-xs">
                {paymentAttempts.map((attempt) => (
                  <li key={attempt.id} className="rounded border border-gray-200 px-2.5 py-2">
                    <span className="font-mono">{attempt.provider_id}</span> · {attempt.status}
                    {attempt.is_retry ? " (retry)" : ""}
                    {attempt.error_category ? (
                      <span className="text-rose-700"> · {attempt.error_category}</span>
                    ) : null}
                    <div className="text-gray-500">
                      {new Date(attempt.attempted_at).toLocaleString()}
                      {attempt.webhook_outcome ? ` · webhook: ${attempt.webhook_outcome}` : ""}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-xs text-gray-500">No payment attempts recorded for this order.</p>
            )}

            {payment ? (
              <div className="mt-4 border-t border-gray-100 pt-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Issue refund</p>
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    step="any"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    className="w-28 rounded border border-gray-300 px-2 py-1 text-sm"
                  />
                  <span className="text-xs text-gray-500">{order.currency_code?.toUpperCase()}</span>
                </div>
                <input
                  value={refundNote}
                  onChange={(e) => setRefundNote(e.target.value)}
                  placeholder="Note (optional)"
                  className="mt-2 w-full rounded border border-gray-300 px-2 py-1 text-sm"
                />
                <button
                  type="button"
                  onClick={issueRefund}
                  disabled={busy !== ""}
                  className="mt-2 inline-flex items-center gap-1.5 rounded bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
                >
                  <Undo2 className="h-3.5 w-3.5" />
                  {busy === "refund" ? "Refunding…" : "Issue refund via Razorpay"}
                </button>
              </div>
            ) : null}
          </Section>

          {bulkRequest ? (
            <Section title="Bulk request">
              <dl className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Reference</dt>
                  <dd className="font-mono text-xs">{bulkRequest.reference_no}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Quote total</dt>
                  <dd>{bulkRequest.quote_total}</dd>
                </div>
              </dl>
            </Section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
