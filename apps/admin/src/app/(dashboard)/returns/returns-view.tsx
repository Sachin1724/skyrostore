"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useConfirm } from "@/components/ui/confirm-dialog";

type ReturnRequest = {
  id: string;
  order_id: string;
  display_id: string | null;
  reason: string;
  description: string;
  resolution: "REFUND" | "REPLACEMENT";
  status: "REQUESTED" | "APPROVED" | "REJECTED" | "COMPLETED";
  admin_note: string | null;
  created_at: string;
};

const STATUS_STYLE: Record<ReturnRequest["status"], string> = {
  REQUESTED: "bg-amber-100 text-amber-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  COMPLETED: "bg-gray-900 text-white",
};

export function ReturnsView() {
  const [requests, setRequests] = useState<ReturnRequest[] | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const confirm = useConfirm();

  function load() {
    fetch("/api/returns")
      .then((r) => r.json())
      .then((d) => setRequests(d.requests ?? []))
      .catch(() => setError("Could not load return requests"));
  }

  useEffect(load, []);

  async function transition(id: string, status: string) {
    if (status === "REJECTED" && !(await confirm({ title: "Reject this return request?", confirmLabel: "Reject" }))) return;
    setBusy(id);
    setError("");
    try {
      const res = await fetch(`/api/returns/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, admin_note: notes[id] || undefined }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Could not update request");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update request");
    } finally {
      setBusy(null);
    }
  }

  if (!requests) return <p className="mt-6 text-sm text-gray-500">{error || "Loading…"}</p>;
  if (requests.length === 0) return <p className="mt-6 text-sm text-gray-500">No return requests.</p>;

  return (
    <div className="mt-6 max-w-3xl space-y-3">
      {error && <p className="text-sm text-red-600">{error}</p>}
      {requests.map((r) => (
        <div key={r.id} className="rounded border border-gray-200 p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-gray-900">
                Order{" "}
                <Link href={`/orders/${r.order_id}`} className="underline hover:text-gray-700">
                  #{r.display_id ?? r.order_id}
                </Link>{" "}
                — {r.resolution === "REFUND" ? "Refund requested" : "Replacement requested"}
              </p>
              <p className="mt-1 text-xs text-gray-500">{r.reason.replace(/_/g, " ")} · {new Date(r.created_at).toLocaleString()}</p>
              <p className="mt-2 text-sm text-gray-700">{r.description}</p>
            </div>
            <span className={`shrink-0 rounded px-2 py-0.5 text-xs font-semibold ${STATUS_STYLE[r.status]}`}>{r.status}</span>
          </div>

          {r.status === "REQUESTED" || r.status === "APPROVED" ? (
            <div className="mt-3 border-t border-gray-100 pt-3">
              <input
                value={notes[r.id] ?? r.admin_note ?? ""}
                onChange={(e) => setNotes({ ...notes, [r.id]: e.target.value })}
                placeholder="Note to customer (optional)"
                className="w-full rounded border border-gray-300 px-2.5 py-1.5 text-xs text-gray-900"
              />
              <div className="mt-2 flex gap-2">
                {r.status === "REQUESTED" ? (
                  <>
                    <button disabled={busy === r.id} onClick={() => transition(r.id, "APPROVED")} className="rounded bg-green-100 px-3 py-1.5 text-xs font-medium text-green-800">
                      Approve
                    </button>
                    <button disabled={busy === r.id} onClick={() => transition(r.id, "REJECTED")} className="rounded bg-red-100 px-3 py-1.5 text-xs font-medium text-red-800">
                      Reject
                    </button>
                  </>
                ) : (
                  <button disabled={busy === r.id} onClick={() => transition(r.id, "COMPLETED")} className="rounded bg-gray-900 px-3 py-1.5 text-xs font-medium text-white">
                    Mark completed
                  </button>
                )}
              </div>
              {r.resolution === "REFUND" && r.status === "APPROVED" ? (
                <p className="mt-2 text-xs text-gray-500">
                  Issue the refund from the order&apos;s fulfilment page, then mark completed here.
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
