"use client";

import { useState } from "react";

export function StockCell({ itemId, locationId, stockedQuantity }: { itemId: string; locationId: string | null; stockedQuantity: number | null }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(stockedQuantity ?? 0));
  const [current, setCurrent] = useState(stockedQuantity ?? 0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!locationId) return <span>{current}</span>;

  if (!editing) {
    return (
      <button type="button" onClick={() => setEditing(true)} className="underline decoration-dotted hover:text-gray-900">
        {current}
      </button>
    );
  }

  async function save() {
    const next = Number(value);
    if (!Number.isFinite(next) || next < 0) {
      setError("Enter a non-negative number");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/inventory/${itemId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location_id: locationId, stocked_quantity: next }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Could not update");
      setCurrent(next);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      <input
        type="number"
        min={0}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-20 rounded border border-gray-300 px-1.5 py-0.5 text-sm"
        autoFocus
      />
      <button type="button" disabled={busy} onClick={save} className="rounded bg-gray-900 px-2 py-0.5 text-xs text-white disabled:opacity-50">
        Save
      </button>
      <button type="button" onClick={() => { setEditing(false); setValue(String(current)); setError(""); }} className="text-xs text-gray-500">
        Cancel
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
