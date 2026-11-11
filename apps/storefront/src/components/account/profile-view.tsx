"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

type Profile = { email: string; first_name: string; last_name: string; phone: string };

const EMPTY: Profile = { email: "", first_name: "", last_name: "", phone: "" };
const field = "mt-1 h-11 w-full rounded-lg bg-surface-soft px-3 text-[14px] text-navy focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/40";

/** Name and phone, saved to the customer record. Addresses and cards live with Razorpay. */
export function ProfileView() {
  const [p, setP] = useState<Profile | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/account/profile")
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok || !d.customer) throw new Error(d.error || "Your session has ended. Sign in again.");
        setP({ ...EMPTY, ...d.customer });
      })
      .catch((e: Error) => setNote({ ok: false, text: e.message }));
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!p) return;
    setBusy(true);
    setNote(null);
    try {
      const res = await fetch("/api/account/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(p),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Could not save");
      setNote({ ok: true, text: "Saved." });
    } catch (e) {
      setNote({ ok: false, text: e instanceof Error ? e.message : "Could not save" });
    } finally {
      setBusy(false);
    }
  }

  if (!p) return <p className="text-[14px] text-text-secondary">{note?.text ?? "Loading…"}</p>;

  return (
    <div className="space-y-6">
      <form onSubmit={save} className="card max-w-[560px] p-6">
        <h2 className="text-[16px] font-medium text-navy">Your details</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block text-[13px] text-text-secondary">
            First name
            <input value={p.first_name} onChange={(e) => setP({ ...p, first_name: e.target.value })} className={field} autoComplete="given-name" />
          </label>
          <label className="block text-[13px] text-text-secondary">
            Last name
            <input value={p.last_name} onChange={(e) => setP({ ...p, last_name: e.target.value })} className={field} autoComplete="family-name" />
          </label>
          <label className="block text-[13px] text-text-secondary sm:col-span-2">
            Phone
            <input value={p.phone} onChange={(e) => setP({ ...p, phone: e.target.value })} className={field} inputMode="tel" autoComplete="tel" />
          </label>
          <label className="block text-[13px] text-text-secondary sm:col-span-2">
            Email
            <input value={p.email} readOnly disabled className={`${field} text-text-muted`} />
            <span className="mt-1 block text-[13px] text-text-muted">You sign in with this address, so it cannot be changed here.</span>
          </label>
        </div>
        <div className="mt-5 flex items-center gap-3">
          <button type="submit" disabled={busy} className="btn btn-primary btn-sm">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
            Save changes
          </button>
          <span aria-live="polite" className={`text-[13px] ${note?.ok === false ? "text-error" : "text-text-secondary"}`}>{note?.text ?? ""}</span>
        </div>
      </form>

      <div className="card max-w-[560px] p-6">
        <h2 className="text-[16px] font-medium text-navy">Delivery addresses and payment</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-text-secondary">
          Your addresses are kept by Razorpay and filled in at checkout from your phone number, so there is nothing to
          manage here. Cards and UPI stay with Razorpay too: we never see or store them.
        </p>
      </div>
    </div>
  );
}
