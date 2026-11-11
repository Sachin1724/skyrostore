"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Save, Trash2, AlertTriangle } from "lucide-react";

type Customer = {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  company_name: string | null;
  has_account: boolean;
  created_at: string;
  addresses?: Array<Record<string, any>>;
};

type Order = {
  id: string;
  display_id?: number;
  status: string;
  total: number;
  currency_code: string;
  created_at: string;
  payment_status?: string;
  fulfillment_status?: string;
};

const FIELD = "mt-1 w-full rounded border border-gray-300 px-2.5 py-1.5 text-sm";
const LABEL = "block text-xs font-medium text-gray-600";

export function CustomerDetail({
  customer,
  orders,
}: {
  customer: Customer;
  orders: Order[];
}) {
  const router = useRouter();

  const [firstName, setFirstName] = useState(customer.first_name || "");
  const [lastName, setLastName] = useState(customer.last_name || "");
  const [email, setEmail] = useState(customer.email || "");
  const [phone, setPhone] = useState(customer.phone || "");
  const [company, setCompany] = useState(customer.company_name || "");

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  const dirty =
    firstName !== (customer.first_name || "") ||
    lastName !== (customer.last_name || "") ||
    email !== (customer.email || "") ||
    phone !== (customer.phone || "") ||
    company !== (customer.company_name || "");

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (saving || !dirty) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/customers/${customer.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          email,
          phone,
          company_name: company,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ kind: "error", text: data.error || "Could not save." });
        return;
      }
      setMessage({ kind: "ok", text: "Customer updated." });
      router.refresh();
    } catch (err: unknown) {
      setMessage({ kind: "error", text: err instanceof Error ? err.message : "Request failed." });
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    setDeleting(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/customers/${customer.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ kind: "error", text: data.error || "Could not delete." });
        setConfirmDelete(false);
        return;
      }
      router.push("/customers");
      router.refresh();
    } catch (err: unknown) {
      setMessage({ kind: "error", text: err instanceof Error ? err.message : "Request failed." });
    } finally {
      setDeleting(false);
    }
  }

  const name = [customer.first_name, customer.last_name].filter(Boolean).join(" ") || "Customer";

  return (
    <div className="mt-2 space-y-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-xl font-semibold text-gray-900">{name}</h1>
        <span className="font-mono text-xs text-gray-500">{customer.id}</span>
      </div>

      {message ? (
        <div
          role="alert"
          className={`rounded border px-3 py-2 text-sm ${
            message.kind === "ok"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          {message.text}
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <form onSubmit={save} className="rounded-md border border-gray-200 bg-white p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Profile</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className={LABEL}>
              First name
              <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className={FIELD} />
            </label>
            <label className={LABEL}>
              Last name
              <input value={lastName} onChange={(e) => setLastName(e.target.value)} className={FIELD} />
            </label>
            <label className={LABEL}>
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={FIELD}
              />
            </label>
            <label className={LABEL}>
              Phone
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={FIELD}
              />
            </label>
            <label className={`${LABEL} sm:col-span-2`}>
              Company
              <input value={company} onChange={(e) => setCompany(e.target.value)} className={FIELD} />
            </label>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button
              type="submit"
              disabled={saving || !dirty}
              className="inline-flex items-center gap-2 rounded bg-gray-900 px-3 py-2 text-xs font-semibold text-white disabled:opacity-40"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving…" : "Save changes"}
            </button>
            {dirty ? <span className="text-xs text-amber-700">Unsaved changes</span> : null}
          </div>
        </form>

        <div className="space-y-5">
          <section className="rounded-md border border-gray-200 bg-white p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Account</h2>
            <dl className="mt-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Registered</dt>
                <dd>{customer.has_account ? "Yes" : "Guest"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Since</dt>
                <dd>{new Date(customer.created_at).toLocaleDateString()}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Orders</dt>
                <dd className="font-medium">{orders.length}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-md border border-rose-200 bg-white p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-rose-700">
              Delete customer
            </h2>
            {orders.length > 0 ? (
              <p className="mt-2 flex items-start gap-2 text-xs text-gray-600">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                This customer has {orders.length} order{orders.length === 1 ? "" : "s"}. Deletion is
                blocked so the order history stays intact.
              </p>
            ) : !confirmDelete ? (
              <>
                <p className="mt-2 text-xs text-gray-600">
                  Permanently removes the customer record. This cannot be undone.
                </p>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="mt-3 inline-flex items-center gap-2 rounded border border-rose-300 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete customer
                </button>
              </>
            ) : (
              <>
                <p className="mt-2 text-xs font-medium text-rose-800">
                  Delete {customer.email} permanently?
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={remove}
                    disabled={deleting}
                    className="rounded bg-rose-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-40"
                  >
                    {deleting ? "Deleting…" : "Yes, delete"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="rounded border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      </div>

      <section className="rounded-md border border-gray-200 bg-white p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Orders</h2>
        {orders.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">No orders yet.</p>
        ) : (
          <table className="mt-2 w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wider text-gray-500">
                <th className="pb-2 pr-4">Order</th>
                <th className="pb-2 pr-4">Date</th>
                <th className="pb-2 pr-4">Payment</th>
                <th className="pb-2 pr-4">Fulfilment</th>
                <th className="pb-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="py-2 pr-4 font-mono text-xs">
                    <Link href={`/orders/${order.id}`} className="font-semibold hover:underline">
                      #{order.display_id ?? order.id}
                    </Link>
                  </td>
                  <td className="py-2 pr-4 text-gray-500">
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-2 pr-4 font-mono text-xs">{order.payment_status || "—"}</td>
                  <td className="py-2 pr-4 font-mono text-xs">{order.fulfillment_status || "—"}</td>
                  <td className="py-2 text-right font-medium">
                    {order.total} {order.currency_code?.toUpperCase()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
