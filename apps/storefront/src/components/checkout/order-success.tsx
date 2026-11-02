"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createTimeline, stagger, svg } from "animejs";
import { useIconHover } from "@animateicons/react";
import { PackageCheckIcon, TruckIcon, ClipboardCheckIcon, ArrowRightIcon } from "@animateicons/react/lucide";
import { formatPrice } from "@/lib/utils";

type Summary = {
  display_id?: number | string;
  email?: string;
  total?: number;
  currency_code?: string;
  item_count?: number;
};

// A quad seen from above: four arms, four motors, four two-blade props, a body.
const ARMS = [
  [120, 120, 52, 52],
  [120, 120, 188, 52],
  [120, 120, 52, 188],
  [120, 120, 188, 188],
] as const;

function NextStep({ icon: Icon, title, body }: { icon: typeof TruckIcon; title: string; body: string }) {
  const { ref, triggerProps } = useIconHover();
  return (
    <li {...triggerProps} className="success-rise flex gap-4 py-4">
      <span className="mt-0.5 text-brand">
        <Icon ref={ref} size={22} />
      </span>
      <span>
        <span className="block text-[16px] font-semibold text-navy">{title}</span>
        <span className="block text-[15px] text-text-secondary">{body}</span>
      </span>
    </li>
  );
}

function ActionLink({ href, children, primary }: { href: string; children: React.ReactNode; primary?: boolean }) {
  const { ref, triggerProps } = useIconHover();
  return (
    <Link
      href={href}
      {...triggerProps}
      className={`inline-flex min-h-12 items-center justify-center gap-2 px-6 text-[15px] font-semibold transition-colors ${
        primary ? "bg-brand text-white hover:bg-navy" : "bg-brand-soft text-navy hover:bg-[#d9e9f9]"
      }`}
    >
      {children}
      {primary ? <ArrowRightIcon ref={ref} size={18} /> : null}
    </Link>
  );
}

/**
 * Payment confirmed: the quad draws itself, its props spin up, the check lands
 * in the body, then the order details rise in. About 1.6s; a click skips to the
 * end, and reduced motion shows the finished state straight away.
 */
export function OrderSuccess({ orderId, summary }: { orderId?: string; summary: Summary | null }) {
  const root = useRef<HTMLDivElement>(null);
  const timeline = useRef<ReturnType<typeof createTimeline> | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDone(true);
      return;
    }

    const arms = svg.createDrawable(el.querySelectorAll(".quad-arm"));
    const check = svg.createDrawable(el.querySelectorAll(".quad-check"));

    const tl = createTimeline({ defaults: { ease: "outExpo" }, onComplete: () => setDone(true) })
      .add(arms, { draw: ["0 0", "0 1"], opacity: [0, 1], duration: 520, delay: stagger(70) })
      .add(".quad-motor", { scale: [0, 1], opacity: [0, 1], duration: 420, delay: stagger(60), ease: "outBack(2)" }, "-=260")
      .add(".quad-prop", { rotate: [0, 720], opacity: [0, 1], duration: 900, delay: stagger(40), ease: "inOutQuad" }, "-=300")
      .add(".quad-body", { scale: [0.6, 1], opacity: [0, 1], duration: 380, ease: "outBack(2.4)" }, "-=700")
      .add(check, { draw: ["0 0", "0 1"], opacity: [0, 1], duration: 360, ease: "outQuad" }, "-=200")
      .add(".success-rise", { y: [24, 0], opacity: [0, 1], duration: 520, delay: stagger(80) }, "-=160");

    timeline.current = tl;
    return () => {
      tl.revert();
    };
  }, []);

  const skip = () => {
    if (done || !timeline.current) return;
    timeline.current.seek(timeline.current.duration);
  };

  return (
    <div ref={root} onClick={skip} className={done ? "success-done" : "success-playing"}>
      <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-14">
        <svg
          viewBox="0 0 240 240"
          role="img"
          aria-label="Order confirmed"
          className="mx-auto w-full max-w-[200px] lg:max-w-[440px]"
        >
          {ARMS.map(([x1, y1, x2, y2], i) => (
            <line key={`arm-${i}`} className="quad-arm" x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--color-navy)" strokeWidth={8} strokeLinecap="round" />
          ))}
          {ARMS.map(([, , x, y], i) => (
            <g key={`motor-${i}`}>
              <g className="quad-prop" style={{ transformOrigin: `${x}px ${y}px`, transformBox: "view-box" }}>
                <line x1={x - 30} y1={y} x2={x + 30} y2={y} stroke="var(--color-brand-bright)" strokeWidth={5} strokeLinecap="round" />
              </g>
              <circle className="quad-motor" cx={x} cy={y} r={11} fill="var(--color-navy)" style={{ transformOrigin: `${x}px ${y}px`, transformBox: "view-box" }} />
            </g>
          ))}
          <circle className="quad-body" cx={120} cy={120} r={34} fill="var(--color-brand)" style={{ transformOrigin: "120px 120px", transformBox: "view-box" }} />
          <path className="quad-check" d="M104 121 L116 133 L138 109" fill="none" stroke="#fff" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
        </svg>

        <div>
          <h1 className="success-rise text-[clamp(3.25rem,1.6rem+6.4vw,7.5rem)] font-bold leading-[0.95] tracking-[-0.04em] text-navy">
            Order placed.
          </h1>
          <p className="success-rise mt-5 max-w-[46ch] text-[18px] text-text-secondary">
            Payment received.{" "}
            {summary?.email ? <>A confirmation is on its way to {summary.email}. </> : null}
            {summary?.display_id ? (
              <>Order <span className="font-semibold text-navy tabular-nums">#{summary.display_id}</span>
                {summary.total != null ? <>, {formatPrice(summary.total, (summary.currency_code || "inr").toUpperCase())}</> : null}
                {summary.item_count ? <>, {summary.item_count} {summary.item_count === 1 ? "item" : "items"}</> : null}.</>
            ) : orderId ? (
              <>Reference <span className="font-semibold text-navy">{orderId}</span>.</>
            ) : null}
          </p>

          <div className="success-rise mt-7 flex flex-wrap gap-3">
            <ActionLink href="/account/orders" primary>Track my order</ActionLink>
            <ActionLink href="/parts">Keep shopping</ActionLink>
          </div>

          <ol className="mt-10">
            <NextStep icon={ClipboardCheckIcon} title="We check and pack it" body="Every part is inspected and packed in our Odisha workshop." />
            <NextStep icon={PackageCheckIcon} title="Courier booked" body="Delhivery picks it up; you get the tracking number by email." />
            <NextStep icon={TruckIcon} title="Track it any time" body="Live status sits under My orders until it reaches you." />
          </ol>


        </div>
      </div>
    </div>
  );
}
