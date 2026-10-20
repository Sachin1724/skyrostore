"use client";

import { useState } from "react";

type Option = { id: string; name: string };

/** Category and brand pickers. Each change saves immediately. */
export function ProductClassification({
  productId,
  categories,
  brands,
  initialCategoryId,
  initialBrandId,
}: {
  productId: string;
  categories: Option[];
  brands: Option[];
  initialCategoryId: string;
  initialBrandId: string;
}) {
  const [categoryId, setCategoryId] = useState(initialCategoryId);
  const [brandId, setBrandId] = useState(initialBrandId);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function save(body: Record<string, unknown>, onOk: () => void) {
    setMessage(null);
    const res = await fetch(`/api/products/${productId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMessage({ ok: false, text: data.error || "Could not save" });
      return;
    }
    onOk();
    setMessage({ ok: true, text: "Saved" });
  }

  const SELECT = "mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900";

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-xs">
      <h3 className="text-sm font-semibold text-gray-900">Where customers find it</h3>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <label className="block text-xs font-medium text-gray-700">
          Category
          <select
            value={categoryId}
            onChange={(e) => {
              const next = e.target.value;
              void save({ category_ids: next ? [next] : [] }, () => setCategoryId(next));
            }}
            className={SELECT}
          >
            <option value="">No category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </label>
        <label className="block text-xs font-medium text-gray-700">
          Brand
          <select
            value={brandId}
            onChange={(e) => {
              const next = e.target.value;
              void save({ collection_id: next || null }, () => setBrandId(next));
            }}
            className={SELECT}
          >
            <option value="">No brand</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </label>
      </div>
      {message ? (
        <p className={`mt-2 text-xs ${message.ok ? "text-emerald-700" : "text-rose-600"}`}>{message.text}</p>
      ) : null}
    </div>
  );
}
