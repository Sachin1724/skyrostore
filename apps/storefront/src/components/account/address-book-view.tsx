"use client";

import { useEffect, useState } from "react";
import { MapPin, Plus, Trash2, Building2 } from "lucide-react";

type Address = {
  id: string;
  address_name: string | null;
  company: string | null;
  first_name: string;
  last_name: string;
  address_1: string;
  address_2: string | null;
  city: string;
  province: string;
  postal_code: string;
  country_code: string;
  phone: string | null;
  is_default_shipping: boolean;
  is_default_billing: boolean;
};

const EMPTY = {
  address_name: "",
  company: "",
  first_name: "",
  last_name: "",
  address_1: "",
  address_2: "",
  city: "",
  province: "",
  postal_code: "",
  phone: "",
  country_code: "in",
};

export function AddressBookView() {
  const [addresses, setAddresses] = useState<Address[] | null>(null);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(false);

  function load() {
    fetch("/api/account/addresses")
      .then((r) => r.json())
      .then((d) => setAddresses(d.addresses ?? []))
      .catch(() => setError("Could not load addresses"));
  }
  useEffect(load, []);

  async function addAddress(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/account/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save address");
      setForm(EMPTY);
      setShowForm(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save address");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    await fetch(`/api/account/addresses/${id}`, { method: "DELETE" }).catch(() => null);
    load();
  }

  async function setDefault(id: string, kind: "is_default_shipping" | "is_default_billing") {
    await fetch(`/api/account/addresses/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [kind]: true }),
    }).catch(() => null);
    load();
  }

  if (!addresses) return <p className="card p-6 text-[14px] text-text-secondary">{error || "Loading…"}</p>;

  return (
    <div className="space-y-4">
      {error ? <p className="text-[13px] font-semibold text-error">{error}</p> : null}

      {addresses.length === 0 && !showForm ? (
        <div className="card flex flex-col items-center gap-3 p-10 text-center">
          <MapPin className="h-8 w-8 text-text-muted" aria-hidden />
          <p className="text-[15px] font-bold text-navy">No saved addresses</p>
          <p className="max-w-xs text-[13px] text-text-secondary">
            Save a billing (HQ) and a shipping (lab/field) address so checkout fills in faster.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {addresses.map((a) => (
            <li key={a.id} className="card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="flex items-center gap-1.5 text-[14px] font-bold text-navy">
                    {a.company ? <Building2 className="h-3.5 w-3.5 text-brand" aria-hidden /> : null}
                    {a.address_name || a.company || `${a.first_name} ${a.last_name}`}
                  </p>
                  <p className="mt-1 text-[13px] text-text-secondary">
                    {[a.address_1, a.address_2, a.city, a.province, a.postal_code].filter(Boolean).join(", ")}
                  </p>
                  {a.phone ? <p className="text-[13px] text-text-muted">{a.phone}</p> : null}
                  <div className="mt-1.5 flex gap-2">
                    {a.is_default_shipping ? (
                      <span className="rounded bg-brand-soft px-2 py-0.5 text-[11px] font-bold text-brand">Default shipping</span>
                    ) : null}
                    {a.is_default_billing ? (
                      <span className="rounded bg-surface-soft px-2 py-0.5 text-[11px] font-bold text-navy">Default billing (GST)</span>
                    ) : null}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5 text-[12px]">
                  {!a.is_default_shipping ? (
                    <button type="button" onClick={() => setDefault(a.id, "is_default_shipping")} className="font-bold text-brand hover:underline">
                      Set as shipping
                    </button>
                  ) : null}
                  {!a.is_default_billing ? (
                    <button type="button" onClick={() => setDefault(a.id, "is_default_billing")} className="font-bold text-brand hover:underline">
                      Set as billing
                    </button>
                  ) : null}
                  <button type="button" onClick={() => remove(a.id)} className="flex items-center gap-1 text-error hover:underline">
                    <Trash2 className="h-3 w-3" aria-hidden /> Remove
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {showForm ? (
        <form onSubmit={addAddress} className="card space-y-3 p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <input placeholder="Label (e.g. Headquarters, Field Lab)" value={form.address_name} onChange={(e) => setForm({ ...form, address_name: e.target.value })} className="h-10 rounded-md border border-border bg-white px-3 text-[14px]" />
            <input placeholder="Company (optional)" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className="h-10 rounded-md border border-border bg-white px-3 text-[14px]" />
            <input required placeholder="First name" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} className="h-10 rounded-md border border-border bg-white px-3 text-[14px]" />
            <input required placeholder="Last name" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} className="h-10 rounded-md border border-border bg-white px-3 text-[14px]" />
            <input required placeholder="Address line 1" value={form.address_1} onChange={(e) => setForm({ ...form, address_1: e.target.value })} className="h-10 rounded-md border border-border bg-white px-3 text-[14px] sm:col-span-2" />
            <input placeholder="Address line 2 (optional)" value={form.address_2} onChange={(e) => setForm({ ...form, address_2: e.target.value })} className="h-10 rounded-md border border-border bg-white px-3 text-[14px] sm:col-span-2" />
            <input required placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="h-10 rounded-md border border-border bg-white px-3 text-[14px]" />
            <input required placeholder="State" value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })} className="h-10 rounded-md border border-border bg-white px-3 text-[14px]" />
            <input required placeholder="PIN code" value={form.postal_code} onChange={(e) => setForm({ ...form, postal_code: e.target.value })} className="h-10 rounded-md border border-border bg-white px-3 text-[14px]" />
            <input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="h-10 rounded-md border border-border bg-white px-3 text-[14px]" />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={busy} className="btn btn-primary">
              {busy ? "Saving…" : "Save address"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="btn">
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-1.5 text-[13px] font-bold text-brand hover:underline"
        >
          <Plus className="h-4 w-4" aria-hidden /> Add address
        </button>
      )}
    </div>
  );
}
