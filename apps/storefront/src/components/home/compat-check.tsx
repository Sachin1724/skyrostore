"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check as CheckIcon, X } from "lucide-react";
import { formatPrice } from "@/lib/utils";

type Option = { variant_id: string; title: string; price: number | null; summary: string };
type Check = { code: string; severity: "PASS" | "WARNING" | "ERROR"; message: string };

const ROLES = [
  { key: "motor", label: "Motor" },
  { key: "propeller", label: "Propeller" },
  { key: "battery", label: "Battery" },
] as const;

/**
 * The live thing: pick a motor, prop and pack and read the verdict from the
 * store's own compatibility engine. Without script it is a link to the builder.
 */
export function CompatCheck({ options }: { options: Record<string, Option[]> }) {
  const [picked, setPicked] = useState<Record<string, string>>(() =>
    Object.fromEntries(ROLES.map((r) => [r.key, options[r.key]?.[0]?.variant_id ?? ""]))
  );
  const [checks, setChecks] = useState<Check[] | null>(null);
  const [state, setState] = useState<"idle" | "checking" | "error">("idle");

  useEffect(() => {
    const body = Object.fromEntries(
      Object.entries(picked).filter(([, v]) => v).map(([k, v]) => [`${k}_variant_id`, v])
    );
    if (Object.keys(body).length < 2) return;
    const ctrl = new AbortController();
    setState("checking");
    fetch("/api/uav/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    })
      .then((r) => r.json())
      .then((data) => {
        // Only the pairings asked about; "frame not selected" is not news here.
        setChecks((data.checks || []).filter((c: Check) => !c.code.startsWith("MISSING_")));
        setState("idle");
      })
      .catch((err) => {
        if (err?.name !== "AbortError") setState("error");
      });
    return () => ctrl.abort();
  }, [picked]);

  const failing = checks?.filter((c) => c.severity === "ERROR") ?? [];
  const total = ROLES.reduce((sum, r) => {
    const o = options[r.key]?.find((x) => x.variant_id === picked[r.key]);
    return sum + (o?.price ?? 0);
  }, 0);

  return (
    <div className="rounded-lg border border-border bg-white p-5 md:p-6">
      <p className="text-[22px] font-bold text-navy">Will these fly together?</p>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {ROLES.map((r) => (
          <label key={r.key} className="block text-[15px] font-semibold text-navy">
            {r.label}
            <select
              value={picked[r.key]}
              onChange={(e) => setPicked((p) => ({ ...p, [r.key]: e.target.value }))}
              className="mt-1.5 h-12 w-full rounded-md border border-border-strong bg-white px-3 text-[16px] font-normal text-navy"
            >
              {(options[r.key] || []).map((o) => (
                <option key={o.variant_id} value={o.variant_id}>
                  {o.summary || o.title}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>

      <div className="mt-6 min-h-[7rem]" aria-live="polite">
        {state === "error" ? (
          <p className="text-[16px] text-error">The check is unavailable right now. Try the full builder.</p>
        ) : checks ? (
          <>
            <p className={`text-[20px] font-bold ${failing.length ? "text-error" : "text-brand"}`}>
              {state === "checking" ? "Checking…" : failing.length ? "These parts don't match." : "These parts work together."}
            </p>
            <ul className="mt-2 space-y-1 text-[16px] text-navy">
              {checks.map((c) => (
                <li key={c.code} className="flex gap-2">
                  {c.severity === "ERROR" ? (
                    <X className="mt-1 h-4 w-4 shrink-0 text-error" aria-hidden="true" />
                  ) : (
                    <CheckIcon className="mt-1 h-4 w-4 shrink-0 text-brand" aria-hidden="true" />
                  )}
                  <span>{c.message}</span>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="text-[16px] text-text-secondary">Checking against published specifications…</p>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <Link href="/build" className="inline-flex min-h-12 items-center rounded-md bg-brand px-6 text-[16px] font-semibold text-white hover:bg-navy">
          Build the full drone
        </Link>
        {total > 0 ? <span className="text-[16px] tabular-nums text-text-secondary">Parts total {formatPrice(total, "INR")}</span> : null}
      </div>
    </div>
  );
}
