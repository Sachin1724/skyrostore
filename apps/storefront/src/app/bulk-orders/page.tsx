import Link from "next/link";
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
} from "lucide-react";

export const metadata = {
  title: "Bulk Orders & Custom UAV Builds | Skyrostore",
  description:
    "Institutional supply, wholesale UAV components, and mission-critical custom drone engineering with rigorous bench validation.",
};

export default function BulkOrdersLandingPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-[1280px] px-8 py-10 md:px-10">
        {/* Breadcrumb */}
        <nav className="text-[11px] font-mono uppercase tracking-[0.08em] text-text-muted">
          <Link href="/" className="hover:text-text-secondary">Home</Link>
          <span className="mx-2 text-text-disabled">/</span>
          <span className="text-graphite">Bulk & Custom Orders</span>
        </nav>

        {/* Hero Section */}
        <div className="mt-8 grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <div
              className="inline-flex items-center gap-2 bg-surface-soft px-3 py-1 font-mono text-[11px] font-medium tracking-[0.08em] text-graphite"
              style={{ borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)" }}
            >
              <Cpu className="h-3.5 w-3.5 text-accent" />
              INSTITUTIONAL & CUSTOM UAV ENGINEERING
            </div>
            <h1 className="mt-4 text-[34px] font-bold leading-[1.08] tracking-[-0.03em] text-graphite sm:text-[42px]">
              Bulk Component Supply & Custom Aerial Systems
            </h1>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-text-secondary">
              Skyrostore supplies certified propulsion, power systems, avionics, and bespoke airframes for enterprises, defense labs, academic teams, and commercial drone fleet operators across India.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/bulk-orders/request"
                className="inline-flex items-center gap-2 bg-graphite px-6 py-3.5 text-[13px] font-semibold text-white transition-colors hover:bg-graphite-soft"
                style={{ borderRadius: "var(--radius-sm)" }}
              >
                Submit Formal Request
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/build"
                className="inline-flex items-center gap-2 bg-surface px-6 py-3.5 text-[13px] font-semibold text-graphite transition-colors hover:bg-surface-muted"
                style={{ borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)" }}
              >
                <Sliders className="h-4 w-4 text-text-muted" />
                Launch UAV Builder
              </Link>
            </div>
          </div>

          {/* Quick Pillars Bento Box */}
          <div
            className="grid grid-cols-2 gap-4 bg-surface-soft p-6"
            style={{ borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}
          >
            {[
              {
                icon: Package,
                title: "Tiered Volume Pricing",
                desc: "Progressive batch discounts on motors, ESCs, avionics, and LiPo batteries with guaranteed lots.",
              },
              {
                icon: Plane,
                title: "Custom Airframes",
                desc: "Configured hexacopters, quadcopters, and VTOLs calibrated for your payload and endurance requirements.",
              },
              {
                icon: ShieldCheck,
                title: "Bench & Flight Testing",
                desc: "Every custom build and batch component passes oscilloscope, thermal, and thrust-stand inspection.",
              },
              {
                icon: Truck,
                title: "Pan-India Logistics",
                desc: "High-value insured express dispatch with GST invoices for seamless business tax credit.",
              },
            ].map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.title}
                  className="bg-surface p-4"
                  style={{ borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)" }}
                >
                  <Icon className="h-5 w-5 text-graphite" strokeWidth={1.8} />
                  <h3 className="mt-2 text-[13px] font-bold text-graphite">{card.title}</h3>
                  <p className="mt-1 text-[11px] leading-relaxed text-text-muted">{card.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Workflow Diagram Strip */}
        <section className="mt-16">
          <h2 className="text-[20px] font-bold tracking-tight text-graphite">
            Transparent Quotation & Fulfillment Lifecycle
          </h2>
          <p className="mt-1 text-[13px] text-text-muted">
            From technical requirement intake to flight readiness and order delivery.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                step: "01",
                title: "Submit Requirements",
                desc: "Specify components, target payloads, operating limits, and required unit counts.",
              },
              {
                step: "02",
                title: "Engineering Review",
                desc: "Our propulsion and avionics engineers evaluate compatibility and thermal margins.",
              },
              {
                step: "03",
                title: "Formal Quotation",
                desc: "Receive an itemized quote with confirmed unit pricing, freight, GST, and validity dates.",
              },
              {
                step: "04",
                title: "Accept & Dispatch",
                desc: "Review and accept your quotation online. Track production, QA certificates, and dispatch.",
              },
            ].map((step) => (
              <div
                key={step.step}
                className="bg-surface p-5"
                style={{ borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}
              >
                <span className="font-mono text-[12px] font-bold text-accent bg-graphite px-2 py-0.5 rounded-xs">
                  STEP {step.step}
                </span>
                <h3 className="mt-3 text-[14px] font-bold text-graphite">{step.title}</h3>
                <p className="mt-1 text-[12px] leading-relaxed text-text-muted">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Custom Engineering Capabilities Table */}
        <section
          className="mt-16 bg-surface p-8"
          style={{ borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}
        >
          <div className="flex items-center gap-2.5 border-b border-color-border pb-4">
            <Sliders className="h-5 w-5 text-graphite" />
            <h2 className="text-[18px] font-bold text-graphite tracking-tight">
              Custom Build Application Scenarios
            </h2>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {[
              {
                title: "Survey & Precision LiDAR",
                specs: ["Payload: 1.5kg – 4.0kg", "Endurance: 35 – 55 mins", "PPK/RTK GNSS Integration", "Low Vibration Isolated Gimbal Mount"],
              },
              {
                title: "Agricultural Spraying / Seeding",
                specs: ["High MTOW Propulsion (10L – 25L)", "Corrosion Resistant Sealed Motors", "Obstacle Avoidance Radar", "High Discharge 12S/14S LiPo Packs"],
              },
              {
                title: "Industrial & Utility Inspection",
                specs: ["Thermal / Radiometric Dual Camera", "Dual Redundant IMU & Autopilot", "IP54 Weather Sealed Airframe", "Encrypted Long-Range Radio Link"],
              },
            ].map((scenario) => (
              <div
                key={scenario.title}
                className="bg-surface-soft p-5"
                style={{ borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)" }}
              >
                <h3 className="text-[14px] font-bold text-graphite">{scenario.title}</h3>
                <ul className="mt-3 space-y-2 text-[12px] text-text-secondary">
                  {scenario.specs.map((s) => (
                    <li key={s} className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-8 flex items-center justify-between border-t border-color-border pt-6">
            <span className="text-[13px] text-text-secondary">
              Need custom technical specifications not listed above?
            </span>
            <Link
              href="/bulk-orders/request"
              className="inline-flex items-center gap-1.5 font-semibold text-[13px] text-graphite hover:underline"
            >
              Start Custom Build Form &rarr;
            </Link>
          </div>
        </section>

        {/* Bottom CTA */}
        <section
          className="mt-16 bg-graphite p-8 text-center"
          style={{ borderRadius: "var(--radius-md)" }}
        >
          <h2 className="text-[22px] font-bold text-white">
            Ready to Configure Your Enterprise Order?
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-[13px] text-text-disabled">
            Submit your quantities and engineering criteria. Our engineering team reviews all requests within 1 business day.
          </p>
          <div className="mt-6 flex justify-center gap-4">
            <Link
              href="/bulk-orders/request"
              className="inline-flex bg-accent px-6 py-3 text-[13px] font-semibold text-graphite transition-colors hover:bg-accent-hover"
              style={{ borderRadius: "var(--radius-sm)" }}
            >
              Request Bulk Quotation
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
