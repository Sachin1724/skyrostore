"use client";

import { useState } from "react";

/** On/off switch for customer visibility. Saves immediately; published = visible on the storefront. */
export function VisibilityToggle({ id, status }: { id: string; status: string }) {
  const [visible, setVisible] = useState(status === "published");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function toggle() {
    const next = !visible;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next ? "published" : "draft" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not update visibility");
      setVisible(next);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="inline-flex items-center gap-2">
      <button
        type="button"
        role="switch"
        aria-checked={visible}
        aria-label={visible ? "Visible to customers. Click to hide." : "Hidden from customers. Click to show."}
        disabled={busy}
        onClick={toggle}
        className={`relative h-5 w-9 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
          visible ? "bg-emerald-600" : "bg-gray-300"
        }`}
      >
        <span
          className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
            visible ? "translate-x-4" : ""
          }`}
        />
      </button>
      <span className={`text-xs font-medium ${visible ? "text-emerald-700" : "text-gray-500"}`}>
        {visible ? "Visible" : "Hidden"}
      </span>
      {error ? <span className="text-xs text-rose-600">{error}</span> : null}
    </div>
  );
}
