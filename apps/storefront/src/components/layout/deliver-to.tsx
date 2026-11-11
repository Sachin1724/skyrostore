"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin } from "lucide-react";
import { saveDeliveryPin, useDeliveryPin } from "@/lib/delivery-pin";

type Check = "idle" | "checking" | "yes" | "no" | "unknown";

/**
 * "Deliver to 751024" in the header. The PIN is saved in the browser and reused by the product page,
 * so the buyer types it once. `row` is the phone layout: a full-width strip under the search box.
 */
export function DeliverTo({ variant = "chip" }: { variant?: "chip" | "row" }) {
  const saved = useDeliveryPin();
  const [open, setOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [check, setCheck] = useState<Check>("idle");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setPin(saved ?? "");
    setCheck("idle");
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, saved]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{6}$/.test(pin)) return;
    saveDeliveryPin(pin);
    setCheck("checking");
    const res = await fetch(`/api/delivery-check?pin=${pin}`).catch(() => null);
    const { serviceable } = res?.ok ? ((await res.json()) as { serviceable: boolean | null }) : { serviceable: null };
    setCheck(serviceable === null ? "unknown" : serviceable ? "yes" : "no");
  }

  const message: Record<Check, string> = {
    idle: "Delivery options and availability depend on your PIN code.",
    checking: "Checking…",
    yes: `We deliver to ${pin}.`,
    no: `Couriers do not reach ${pin} yet. Contact support for other options.`,
    unknown: "Saved. We confirm delivery to this PIN at checkout.",
  };

  return (
    <div ref={ref} className={variant === "row" ? "relative" : "relative hidden lg:block"}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={
          variant === "row"
            ? "flex h-9 w-full items-center gap-1.5 text-[14px] text-navy"
            : "flex h-11 items-center gap-1.5 rounded-md px-1 text-left text-navy hover:text-brand"
        }
      >
        <MapPin className="h-[18px] w-[18px] shrink-0" aria-hidden />
        {variant === "row" ? (
          <span>{saved ? <>Deliver to <strong className="font-semibold tabular-nums">{saved}</strong></> : "Enter your PIN code for delivery"}</span>
        ) : (
          <span className="leading-tight">
            <span className="block text-[12px] text-text-secondary">{saved ? "Deliver to" : "Delivering to"}</span>
            <span className="block text-[14px] font-semibold tabular-nums">{saved ?? "Enter PIN code"}</span>
          </span>
        )}
      </button>
      {open ? (
        <form
          onSubmit={submit}
          className="pop-in absolute left-0 top-[calc(100%+6px)] z-[60] w-[min(320px,calc(100vw-2rem))] card p-4 shadow-[0_12px_32px_rgba(10,26,47,0.12)]"
        >
          <label htmlFor={`pin-${variant}`} className="text-[15px] font-semibold text-navy">
            Your delivery PIN code
          </label>
          <div className="mt-2 flex gap-2">
            <input
              id={`pin-${variant}`}
              inputMode="numeric"
              autoComplete="postal-code"
              maxLength={6}
              autoFocus
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              placeholder="751024"
              className="h-11 min-w-0 flex-1 rounded-md border border-border-strong bg-white px-3 text-[16px] tabular-nums text-navy focus:border-brand"
            />
            <button type="submit" disabled={pin.length !== 6 || check === "checking"} className="btn btn-primary">
              Apply
            </button>
          </div>
          <p aria-live="polite" className={`mt-2 text-[13px] ${check === "yes" ? "text-success" : check === "no" ? "text-error" : "text-text-secondary"}`}>
            {message[check]}
          </p>
        </form>
      ) : null}
    </div>
  );
}
