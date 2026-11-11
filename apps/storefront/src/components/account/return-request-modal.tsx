"use client";

import { useState } from "react";
import { X, CheckCircle2 } from "lucide-react";
import { Select } from "@/components/ui/select";

const REASONS = [
  { value: "DAMAGED", label: "Arrived damaged" },
  { value: "DEFECTIVE", label: "Not working / defective" },
  { value: "WRONG_ITEM", label: "Wrong item received" },
  { value: "NOT_AS_DESCRIBED", label: "Not as described" },
  { value: "OTHER", label: "Other" },
];

export function ReturnRequestModal({ orderId, onClose }: { orderId: string; onClose: () => void }) {
  const [reason, setReason] = useState("DAMAGED");
  const [resolution, setResolution] = useState<"REFUND" | "REPLACEMENT">("REFUND");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) {
      setError("Tell us what went wrong.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: orderId, reason, resolution, description }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not submit return request.");
      setDone(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not submit return request.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-[120] flex items-center justify-center bg-navy/70 p-4">
      <div className="absolute inset-0" onClick={onClose} aria-hidden />
      <div className="relative z-10 w-full max-w-md rounded-lg bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-[16px] font-extrabold text-navy">{done ? "Request submitted" : "Request a return"}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="text-text-muted hover:text-navy">
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        {done ? (
          <div className="mt-4 flex flex-col items-center gap-2 py-4 text-center">
            <CheckCircle2 className="h-8 w-8 text-success" aria-hidden />
            <p className="text-[14px] text-text-secondary">We'll review it and email you once there's an update.</p>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-4 space-y-3">
            {error ? <p className="text-[13px] font-semibold text-error">{error}</p> : null}
            <div className="block text-[13px] font-bold text-navy">
              Reason
              <div className="mt-1">
                <Select ariaLabel="Reason" value={reason} onChange={setReason} options={REASONS} className="w-full" />
              </div>
            </div>
            <label className="block text-[13px] font-bold text-navy">
              I'd like a
              <div className="mt-1 flex gap-2">
                {(["REFUND", "REPLACEMENT"] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setResolution(r)}
                    className={`h-10 flex-1 rounded-md border text-[13px] font-bold ${
                      resolution === r ? "border-brand bg-brand-soft text-brand" : "border-border bg-white text-text-secondary"
                    }`}
                  >
                    {r === "REFUND" ? "Refund" : "Replacement"}
                  </button>
                ))}
              </div>
            </label>
            <label className="block text-[13px] font-bold text-navy">
              What happened?
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the issue"
                className="mt-1 w-full rounded-md border border-border bg-surface-soft px-2.5 py-2 text-[14px] text-navy"
              />
            </label>
            <button type="submit" disabled={busy} className="btn btn-primary mt-2 flex w-full">
              {busy ? "Submitting…" : "Submit request"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
