"use client";

import { useEffect, useState } from "react";

/**
 * The fixed half of the landing page: a quad seen from above that assembles
 * as the reading column scrolls. Each section marked [data-stage="n"] advances
 * it: 1 frame, 2 motors, 3 props, 4 pack and flight controller, 5 checked.
 * Without script, or under reduced motion, the finished quad is shown.
 */
const ARMS = [
  [52, 52],
  [188, 52],
  [52, 188],
  [188, 188],
] as const;

const CAPTIONS = [
  "",
  "Frame — the X that everything bolts to.",
  "Four motors, matched by KV to the props and the pack.",
  "Props sized to the motor's recommended range.",
  "Flight controller and a 6S pack at the centre.",
  "Every part checked against the others before it ships.",
];

export function BuildStage() {
  const [step, setStep] = useState(5);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-stage]"));
    if (!sections.length) return;
    setStep(1);
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setStep(Number((e.target as HTMLElement).dataset.stage));
        }
      },
      { rootMargin: "-45% 0px -45% 0px" }
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  const on = (n: number) => (step >= n ? "opacity-100 scale-100" : "opacity-0 scale-75");

  return (
    <div className="flex h-full flex-col justify-between bg-navy px-8 py-10 text-white">
      <svg viewBox="0 0 240 240" role="img" aria-label="A quadcopter seen from above" className="mx-auto my-auto w-full max-w-[520px]">
        {ARMS.map(([x, y], i) => (
          <line
            key={`a${i}`}
            x1={120}
            y1={120}
            x2={x}
            y2={y}
            stroke="#C9D6E6"
            strokeWidth={9}
            strokeLinecap="round"
            className={`origin-center transition-[transform,opacity] duration-700 ${on(1)}`}
            style={{ transformBox: "view-box", transitionDelay: `${i * 70}ms` }}
          />
        ))}
        {ARMS.map(([x, y], i) => (
          <g key={`m${i}`}>
            <g
              className={`transition-opacity duration-500 ${step >= 3 ? "opacity-100" : "opacity-0"}`}
              style={{ transitionDelay: `${i * 60}ms` }}
            >
              <g className={step >= 3 ? "stage-prop-spin" : ""} style={{ transformOrigin: `${x}px ${y}px`, transformBox: "view-box" }}>
                <line x1={x - 34} y1={y} x2={x + 34} y2={y} stroke="var(--color-brand-bright)" strokeWidth={6} strokeLinecap="round" />
              </g>
            </g>
            <circle
              cx={x}
              cy={y}
              r={13}
              fill="#FFFFFF"
              className={`transition-[transform,opacity] duration-500 ${on(2)}`}
              style={{ transformOrigin: `${x}px ${y}px`, transformBox: "view-box", transitionDelay: `${i * 60}ms` }}
            />
            <circle cx={x} cy={y} r={4} fill="var(--color-navy)" className={`transition-opacity duration-500 ${step >= 2 ? "opacity-100" : "opacity-0"}`} />
          </g>
        ))}
        <rect
          x={96}
          y={96}
          width={48}
          height={48}
          fill="var(--color-brand)"
          className={`transition-[transform,opacity] duration-500 ${on(4)}`}
          style={{ transformOrigin: "120px 120px", transformBox: "view-box" }}
        />
        <rect x={104} y={110} width={32} height={20} fill="var(--color-brand-cyan)" className={`transition-opacity duration-500 ${step >= 4 ? "opacity-100" : "opacity-0"}`} />
        <path
          d="M108 121 L117 130 L134 112"
          fill="none"
          stroke="var(--color-navy)"
          strokeWidth={6}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-opacity duration-500 ${step >= 5 ? "opacity-100" : "opacity-0"}`}
        />
      </svg>
      <p className="min-h-[3em] text-[18px] leading-[1.5] text-[#C9D6E6]" aria-live="polite">
        {CAPTIONS[step]}
      </p>
    </div>
  );
}
