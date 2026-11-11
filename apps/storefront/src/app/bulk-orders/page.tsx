import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import {
  Package,
  Cpu,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Sliders,
  Plane,
  Truck,
  ArrowRight,
  Headphones,
  Building2,
  Receipt,
  Scale,
} from "lucide-react";

export const metadata = {
  title: "Bulk orders",
  description:
    "Institutional procurement, volume component supply, and custom aerial platform engineering with bench validation and GST tax invoicing across India.",
};

export default function BulkOrdersLandingPage() {
  return (
    <>
      <Header />
      <main id="main" className="min-h-screen bg-surface-soft pb-20">
        <div className="mx-auto max-w-[1760px] px-4 md:px-8">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 pt-5 text-[13px] text-text-secondary">
            <Link href="/" className="hover:text-brand">Home</Link>
            <span aria-hidden>/</span>
            <span className="font-semibold text-navy">Institutional &amp; Bulk Orders</span>
          </nav>

          {/* Hero Banner */}
          <section className="mt-4 grid items-center overflow-hidden rounded-2xl bg-white text-navy md:grid-cols-[1.1fr_1fr]">
            <div className="p-6 md:p-12">

              <h1 className="mt-3 text-[clamp(2rem,1.5rem+2.6vw,3.6rem)] font-extrabold leading-[1.08] tracking-[-0.03em] text-navy">
                Bulk Component Supply &amp; Custom Aerial Platforms
              </h1>

              <p className="mt-3 text-[14px] md:text-[16px] leading-relaxed text-text-secondary">
                Skyrostore equips universities, defense research labs, commercial fleet operators, and industrial enterprises across India with certified UAV hardware, guaranteed lot matching, and formal institutional purchase order fulfillment.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link
                  href="/bulk-orders/request"
                  className="btn btn-primary"
                >
                  Request Formal Quotation (RFQ)
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>

                <Link
                  href="/build"
                  className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface-soft px-5 py-3 text-[14px] font-bold text-navy transition-all hover:bg-surface-muted"
                >
                  <Sliders className="h-4 w-4 text-brand" aria-hidden />
                  Launch UAV Configurator
                </Link>
              </div>
            </div>


                      <div className="relative hidden h-full min-h-[360px] bg-surface-soft md:block">
              <Image src="/images/hero/bulk-hero-drone.png" alt="" fill sizes="45vw" className="object-cover object-right" />
            </div>
          </section>

          {/* Volume Pricing Tiers */}
          <section className="mt-10 card p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-2 border-b border-border pb-5">
              <div>
                <h2 className="mt-1 text-[22px] font-extrabold text-navy">
                  Tiered Volume Pricing &amp; Batch Allowances
                </h2>
                <p className="mt-1 text-[13px] text-text-secondary">
                  Discount schedules apply across propulsion motors, ESCs, carbon propellers, autopilot stacks, and smart batteries.
                </p>
              </div>

              <span className="text-[13px] font-mono text-text-muted">
                Updated for FY 2026–2027
              </span>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Tier 1 */}
              <div className="rounded-xl border border-border bg-surface-soft p-5 text-left flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="rounded bg-navy/10 px-2.5 py-0.5 text-[13px] font-mono font-bold text-navy">
                      TIER 1
                    </span>
                    <span className="text-[13px] font-bold text-emerald-700">8% Volume Rebate</span>
                  </div>
                  <h3 className="mt-3 text-[18px] font-extrabold text-navy">5 to 15 Units</h3>
                  <p className="mt-1 text-[13px] text-text-muted">
                    Ideal for academic robotics labs, university competition teams, and small test fleets.
                  </p>
                  <ul className="mt-4 space-y-2 border-t border-border pt-4 text-[13px] text-text-secondary">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" aria-hidden />
                      <span>Single-batch motor KV matching</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" aria-hidden />
                      <span>GST B2B Tax Invoice with HSN breakdown</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" aria-hidden />
                      <span>Standard 48-hour bench dispatch</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-6 border-t border-border pt-4">
                  <Link
                    href="/bulk-orders/request?tier=1"
                    className="block text-center card py-2 text-[13px] font-bold text-navy hover:bg-surface-soft"
                  >
                    Select Tier 1
                  </Link>
                </div>
              </div>

              {/* Tier 2 */}
              <div className="rounded-xl border-2 border-navy bg-white p-5 text-left flex flex-col justify-between relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-navy px-3 py-0.5 text-[13px] font-semibold uppercase tracking-wider text-white">
                  Most Requested by Fleet Operators
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <span className="rounded bg-brand/20 px-2.5 py-0.5 text-[13px] font-mono font-bold text-brand">
                      TIER 2
                    </span>
                    <span className="text-[13px] font-bold text-emerald-700">15% Volume Rebate</span>
                  </div>
                  <h3 className="mt-3 text-[18px] font-extrabold text-navy">16 to 50 Units</h3>
                  <p className="mt-1 text-[13px] text-text-muted">
                    For commercial survey outfits, agricultural spraying fleets, and drone service providers (DSPs).
                  </p>
                  <ul className="mt-4 space-y-2 border-t border-border pt-4 text-[13px] text-text-secondary">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" aria-hidden />
                      <span>Priority burn-in testing on thrust stands</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" aria-hidden />
                      <span>Dedicated technical applications engineer</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" aria-hidden />
                      <span>Certificate of Conformance (CoC) per batch</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-6 border-t border-border pt-4">
                  <Link
                    href="/bulk-orders/request?tier=2"
                    className="block text-center rounded-lg bg-navy py-2 text-[13px] font-extrabold text-white hover:bg-brand"
                  >
                    Select Tier 2
                  </Link>
                </div>
              </div>

              {/* Tier 3 */}
              <div className="rounded-xl border border-border bg-surface-soft p-5 text-left flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="rounded bg-navy/10 px-2.5 py-0.5 text-[13px] font-mono font-bold text-navy">
                      TIER 3
                    </span>
                    <span className="text-[13px] font-bold text-emerald-700">22% Enterprise Rebate</span>
                  </div>
                  <h3 className="mt-3 text-[18px] font-extrabold text-navy">50+ Units</h3>
                  <p className="mt-1 text-[13px] text-text-muted">
                    For defense contractors, aerospace manufacturers, government tenders, and institutional labs.
                  </p>
                  <ul className="mt-4 space-y-2 border-t border-border pt-4 text-[13px] text-text-secondary">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" aria-hidden />
                      <span>Net-30 purchase order terms eligible</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" aria-hidden />
                      <span>Custom firmware flashing &amp; harness wiring</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" aria-hidden />
                      <span>Reserved reserve inventory stock allocation</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-6 border-t border-border pt-4">
                  <Link
                    href="/bulk-orders/request?tier=3"
                    className="block text-center card py-2 text-[13px] font-bold text-navy hover:bg-surface-soft"
                  >
                    Select Enterprise Tier
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* Workflow Diagram */}
          <section className="mt-10 card p-6 md:p-8">
            <h2 className="text-[20px] font-extrabold tracking-tight text-navy">
              Institutional Quotation &amp; Delivery Lifecycle
            </h2>
            <p className="mt-1 text-[13px] text-text-secondary">
              Engineered for predictable procurement: every quotation features fixed pricing, lead time commitments, and formal technical specifications.
            </p>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  step: "01",
                  title: "Submit Bill of Quantities",
                  desc: "List part numbers, required quantities, target payloads, and compliance criteria via our online RFQ portal.",
                },
                {
                  step: "02",
                  title: "Technical Review",
                  desc: "Our propulsion and avionics engineers audit compatibility, voltage drops, and thermal margins within 24 hours.",
                },
                {
                  step: "03",
                  title: "Itemized Formal Quote",
                  desc: "Receive an official quotation with GST breakdown, unit discounts, lead times, and payment terms.",
                },
                {
                  step: "04",
                  title: "Bench QA & Insured Dispatch",
                  desc: "Units undergo burn-in testing and ship with certificates of conformance via high-security tracked freight.",
                },
              ].map((step) => (
                <div
                  key={step.step}
                  className="rounded-lg border border-border bg-surface-soft p-5 text-left"
                >
                  <span className="inline-block rounded bg-navy px-2 py-0.5 font-mono text-[13px] font-bold text-white">
                    STEP {step.step}
                  </span>
                  <h3 className="mt-3 text-[14px] font-extrabold text-navy">{step.title}</h3>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-text-muted">{step.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Custom Engineering Capabilities */}
          <section className="mt-10 card p-6 md:p-8">
            <div className="flex items-center gap-2 border-b border-border pb-4">
              <Sliders className="h-5 w-5 text-navy" aria-hidden />
              <h2 className="text-[18px] font-extrabold text-navy tracking-tight">
                Turnkey Custom Build Platforms
              </h2>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  title: "Survey & Precision RTK LiDAR",
                  specs: [
                    "Payload: 1.5kg – 4.0kg",
                    "Endurance: 35 – 55 mins hover",
                    "Dual-Antenna PPK/RTK GNSS",
                    "Vibration-isolated carbon gimbal mount",
                  ],
                },
                {
                  title: "Agricultural Spraying & Seeding",
                  specs: [
                    "High MTOW Propulsion (10L – 25L tanks)",
                    "IP67 corrosion-resistant sealed motors",
                    "Obstacle avoidance millimeter-wave radar",
                    "High-discharge 12S/14S smart LiPo packs",
                  ],
                },
                {
                  title: "Industrial & Utility Inspection",
                  specs: [
                    "Dual thermal/optical radiometric payload",
                    "Triple redundant IMU & heated autopilot",
                    "IP54 rain-resistant carbon frame",
                    "AES-256 encrypted long-range radio link",
                  ],
                },
              ].map((scenario) => (
                <div
                  key={scenario.title}
                  className="rounded-xl border border-border bg-surface-soft p-5 text-left"
                >
                  <h3 className="text-[14px] font-extrabold text-navy">{scenario.title}</h3>
                  <ul className="mt-3 space-y-2 text-[13px] text-text-secondary">
                    {scenario.specs.map((s) => (
                      <li key={s} className="flex items-center gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" aria-hidden />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border pt-6">
              <span className="text-[13px] text-text-secondary">
                Require specialized payload dimensions or custom motor winding specifications?
              </span>
              <Link
                href="/bulk-orders/request"
                className="inline-flex items-center gap-1.5 font-extrabold text-[13px] text-navy hover:text-brand"
              >
                Launch Custom Engineering Requisition <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </div>
          </section>

          {/* Bottom Action CTA */}
          <section className="mt-10 rounded-xl border border-navy/20 bg-navy p-8 text-center text-white">
            <h2 className="text-[22px] font-extrabold text-white">
              Ready to Order Fleet Lots or Request Institutional Pricing?
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-[14px] text-on-dark">
              Submit your hardware requirements online. Our applications engineering group will deliver a formal quotation within one business day.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link
                href="/bulk-orders/request"
                className="btn btn-light"
              >
                Request Bulk Quotation (RFQ)
              </Link>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
