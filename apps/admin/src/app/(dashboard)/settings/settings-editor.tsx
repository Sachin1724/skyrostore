"use client";

import { useEffect, useState } from "react";
import type { SiteSettings } from "@/app/api/settings/route";

const input = "mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none";
const EMPTY: SiteSettings = { gstin: "", freeShippingThreshold: 0 };

function StatusDot({ ok }: { ok: boolean | null }) {
  if (ok === null) return <span className="text-gray-400">unknown</span>;
  return ok ? (
    <span className="text-green-700">configured</span>
  ) : (
    <span className="text-amber-600">not configured</span>
  );
}

export function SettingsEditor() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [configured, setConfigured] = useState<Record<string, boolean> | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || "Could not load settings");
        setSettings({ ...EMPTY, ...data.settings });
        setConfigured(data.configured);
      })
      .catch((err: Error) => setMessage({ ok: false, text: err.message }));
  }, []);

  if (!settings) {
    return <p className="mt-6 text-sm text-gray-500">{message?.text ?? "Loading…"}</p>;
  }

  async function save() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save");
      setSettings(data.settings);
      setMessage({ ok: true, text: "Saved. The storefront picks it up within a few seconds." });
    } catch (err: unknown) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : "Could not save" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-6 max-w-lg space-y-6">
      <section className="space-y-4 rounded border border-gray-200 p-4">
        <h2 className="text-sm font-semibold text-gray-900">Billing &amp; shipping</h2>
        <label className="block text-sm font-medium text-gray-700">
          Company GSTIN
          <input
            maxLength={15}
            value={settings.gstin}
            onChange={(e) => setSettings({ ...settings, gstin: e.target.value })}
            placeholder="21AAECS9821R1ZM"
            className={input}
          />
        </label>
        <label className="block text-sm font-medium text-gray-700">
          Free shipping threshold (₹, whole rupees)
          <input
            type="number"
            min={0}
            value={settings.freeShippingThreshold / 100}
            onChange={(e) => setSettings({ ...settings, freeShippingThreshold: Math.max(0, Number(e.target.value) || 0) * 100 })}
            className={input}
          />
        </label>
        <button
          onClick={save}
          disabled={busy}
          className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {busy ? "Saving…" : "Save"}
        </button>
        {message && <p className={`text-sm ${message.ok ? "text-green-700" : "text-red-600"}`}>{message.text}</p>}
      </section>

      <section className="space-y-2 rounded border border-gray-200 p-4">
        <h2 className="text-sm font-semibold text-gray-900">Integrations</h2>
        <p className="text-xs text-gray-500">
          Keys live in the backend&apos;s environment, never in this form — this only shows whether each is set.
        </p>
        <dl className="space-y-1 text-sm">
          <div className="flex justify-between"><dt>Razorpay</dt><dd><StatusDot ok={configured?.razorpay ?? null} /></dd></div>
          <div className="flex justify-between"><dt>Shipmozo</dt><dd><StatusDot ok={configured?.shipmozo ?? null} /></dd></div>
          <div className="flex justify-between"><dt>Transactional email</dt><dd><StatusDot ok={configured?.email ?? null} /></dd></div>
        </dl>
      </section>
    </div>
  );
}
