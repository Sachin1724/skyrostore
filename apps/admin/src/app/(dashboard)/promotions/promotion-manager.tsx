"use client";

import { useCallback, useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { useConfirm } from "@/components/ui/confirm-dialog";

type Promotion = {
  id: string;
  code: string;
  status: "draft" | "active" | "inactive";
  application_method: { type: "fixed" | "percentage"; value: number; currency_code: string | null; target_type: string } | null;
  public: boolean;
};

async function call(url: string, method: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

function describe(am: Promotion["application_method"]) {
  if (!am) return "—";
  const discount = am.type === "percentage" ? `${am.value}% off` : `₹${am.value} off`;
  return `${discount} ${am.target_type === "order" ? "entire order" : "line items"}`;
}

const STATUS_STYLE: Record<Promotion["status"], string> = {
  active: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  draft: "bg-gray-100 text-gray-600 border border-gray-200",
  inactive: "bg-rose-50 text-rose-700 border border-rose-200",
};

function PromotionRow({ promo, reload, setError }: { promo: Promotion; reload: () => Promise<void>; setError: (m: string) => void }) {
  const confirm = useConfirm();
  const run = async (fn: () => Promise<unknown>) => {
    setError("");
    try {
      await fn();
      await reload();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Request failed");
    }
  };

  return (
    <li className="flex items-center gap-3 px-3 py-2.5">
      <span className="font-mono text-sm font-semibold text-gray-900">{promo.code}</span>
      <span className="text-sm text-gray-600">{describe(promo.application_method)}</span>
      <label className="ml-auto flex items-center gap-1.5 text-xs text-gray-600" title="Listed under Available offers on every product page while the code is active">
        <input
          type="checkbox"
          checked={promo.public}
          onChange={(e) => run(() => call(`/api/promotions/${promo.id}`, "PATCH", { public: e.target.checked }))}
        />
        Show on product pages
      </label>
      <select
        value={promo.status}
        onChange={(e) => run(() => call(`/api/promotions/${promo.id}`, "PATCH", { status: e.target.value }))}
        className={`rounded px-2 py-1 text-xs font-medium ${STATUS_STYLE[promo.status]}`}
      >
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
        <option value="draft">Draft</option>
      </select>
      <button
        type="button"
        aria-label="Delete"
        onClick={async () => {
          if (await confirm({ title: `Delete code "${promo.code}"?`, confirmLabel: "Delete" })) void run(() => call(`/api/promotions/${promo.id}`, "DELETE"));
        }}
        className="text-gray-400 hover:text-rose-600"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </li>
  );
}

export function PromotionManager() {
  const [promotions, setPromotions] = useState<Promotion[] | null>(null);
  const [error, setError] = useState("");
  const [code, setCode] = useState("");
  const [methodType, setMethodType] = useState<"percentage" | "fixed">("percentage");
  const [value, setValue] = useState("");
  const [targetType, setTargetType] = useState<"order" | "items">("order");

  const reload = useCallback(async () => {
    try {
      const data = await call("/api/promotions", "GET");
      setPromotions(data.promotions as Promotion[]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not load promotions");
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return (
    <div className="mt-6 space-y-4">
      {error ? <p className="rounded border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p> : null}
      <form
        className="grid grid-cols-2 gap-3 rounded-md border border-gray-200 bg-white p-4 sm:grid-cols-4"
        onSubmit={async (e) => {
          e.preventDefault();
          const num = Number(value);
          if (!code.trim() || !Number.isFinite(num) || num <= 0) return;
          setError("");
          try {
            await call("/api/promotions", "POST", { code, method_type: methodType, value: num, target_type: targetType });
            setCode("");
            setValue("");
            await reload();
          } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Request failed");
          }
        }}
      >
        <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Code, e.g. SKYRO10" className="rounded border border-gray-300 px-2 py-1.5 text-sm uppercase" />
        <select value={methodType} onChange={(e) => setMethodType(e.target.value as "percentage" | "fixed")} className="rounded border border-gray-300 px-2 py-1.5 text-sm">
          <option value="percentage">% off</option>
          <option value="fixed">₹ off</option>
        </select>
        <input
          type="number"
          min={0}
          step="0.01"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={methodType === "percentage" ? "10" : "500"}
          className="rounded border border-gray-300 px-2 py-1.5 text-sm"
        />
        <select value={targetType} onChange={(e) => setTargetType(e.target.value as "order" | "items")} className="rounded border border-gray-300 px-2 py-1.5 text-sm">
          <option value="order">Entire order</option>
          <option value="items">Line items</option>
        </select>
        <button type="submit" disabled={!code.trim() || !value} className="col-span-2 rounded bg-gray-900 px-2.5 py-1.5 text-xs font-semibold text-white disabled:opacity-40 sm:col-span-4">
          Create code
        </button>
      </form>
      <div className="rounded-md border border-gray-200 bg-white">
        {promotions === null ? (
          <p className="p-4 text-sm text-gray-500">Loading…</p>
        ) : promotions.length === 0 ? (
          <p className="p-4 text-sm text-gray-500">No promotion codes yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {promotions.map((p) => (
              <PromotionRow key={p.id} promo={p} reload={reload} setError={setError} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
