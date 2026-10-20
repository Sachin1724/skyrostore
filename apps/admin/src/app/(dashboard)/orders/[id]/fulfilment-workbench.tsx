"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Package, Truck, CheckCircle2, AlertTriangle } from "lucide-react";
import { STATE_LABELS } from "@/lib/data/fulfilment";

type Props = {
  orderId: string;
  order: Record<string, any>;
  packingList: Array<Record<string, any>>;
  fulfilments: Array<Record<string, any>>;
  paymentAttempts: Array<Record<string, any>>;
  bulkRequest: Record<string, any> | null;
  history: Array<{ at: string; event: string; detail?: string | null }>;
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-md border border-gray-200 bg-white p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export function FulfilmentWorkbench({
  orderId,
  order,
  packingList,
  fulfilments,
  paymentAttempts,
  bulkRequest,
  history,
}: Props) {
  const router = useRouter();
  const [courier, setCourier] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [busy, setBusy] = useState<"" | "pack" | "ship" | "deliver">("");
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  const state: string = order.fulfilment_state;
  const address = order.shipping_address || {};
  const isInvoiced = order.metadata?.payment_terms === "invoice";

  async function run(action: "pack" | "ship" | "deliver", body: Record<string, unknown> = {}) {
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
        <span className="rounded bg-gray-900 px-2.5 py-1 font-mono text-xs font-medium text-white">
          {STATE_LABELS[state] || state}
        </span>
      </div>

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
                  <th className="pb-2 text-right">Packed</th>
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
                    <td className="py-2 text-right text-gray-600">{item.fulfilled_quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => run("pack", isInvoiced ? { allow_unpaid: true } : {})}
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

          <Section title="Shipping details">
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
              <button
                type="button"
                onClick={() => run("deliver")}
                disabled={busy !== "" || state !== "shipped"}
                className="inline-flex items-center gap-2 rounded border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-800 disabled:opacity-40"
              >
                <CheckCircle2 className="h-4 w-4" />
                {busy === "deliver" ? "Confirming…" : "Mark delivered"}
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
          </Section>

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
