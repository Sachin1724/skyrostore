import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Cpu, Layers, ShieldCheck, Truck, FileText } from "lucide-react";

interface HeroBannerProps {
  title?: string;
  subtitle?: string;
}

export function HeroBanner({
  title = "Industrial UAV Hardware & Flight Systems",
  subtitle = "Precision brushless motors, digital avionics, and carbon fiber airframes. Rigorously cross-validated for compatibility before dispatch from Odisha.",
}: HeroBannerProps) {
  return (
    <section aria-label="Hero Overview" className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      {/* Main Campaign Hero Card */}
      <div className="relative flex flex-col justify-between overflow-hidden rounded-xl border border-border-strong bg-navy text-white shadow-sm md:p-10 p-6">
        {/* Subtle background glow/grid pattern */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
          aria-hidden
        />

        {/* Content Column */}
        <div className="relative z-10 max-w-[620px]">
          <div className="inline-flex items-center gap-2 rounded bg-brand/30 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-brand-cyan border border-brand/40">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-cyan animate-pulse" aria-hidden />
            Engineered Autonomy &amp; Propulsion
          </div>

          <h1 className="mt-4 text-[clamp(1.85rem,1.4rem+2.2vw,3rem)] font-extrabold leading-[1.08] tracking-[-0.03em] text-balance">
            {title}
          </h1>

          <p className="mt-4 text-[15px] md:text-[16px] leading-relaxed text-[#C9D6E6] max-w-[52ch]">
            {subtitle}
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              href="/parts"
              className="inline-flex h-11 items-center gap-2 rounded-md bg-white px-6 text-[15px] font-bold text-navy transition-colors hover:bg-brand-soft shadow-sm"
            >
              Shop All Parts
              <ArrowRight className="h-4 w-4 text-brand" aria-hidden />
            </Link>

            <Link
              href="/build"
              className="inline-flex h-11 items-center gap-2 rounded-md border border-white/40 bg-white/5 px-5 text-[15px] font-semibold text-white transition-all hover:border-white hover:bg-white/10"
            >
              <Cpu className="h-4 w-4 text-brand-cyan" aria-hidden />
              Build Configurator
            </Link>
          </div>
        </div>

        {/* Floating Drone Preview Visual on larger viewports */}
        <div className="pointer-events-none absolute -right-6 -bottom-6 hidden h-[280px] w-[340px] opacity-25 lg:block xl:h-[320px] xl:w-[400px] xl:opacity-35">
          <Image
            src="/images/hero/storefront-hero-drone.png"
            alt=""
            fill
            priority
            sizes="400px"
            className="object-contain"
          />
        </div>

        {/* Bottom micro-features strip */}
        <div className="relative z-10 mt-8 border-t border-white/15 pt-5 grid grid-cols-1 sm:grid-cols-3 gap-3 text-[12px] text-[#A6BFDB]">
          <div className="flex items-center gap-2">
            <Truck className="h-4 w-4 text-brand-cyan shrink-0" aria-hidden />
            <span>Dispatched within 24h</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-brand-cyan shrink-0" aria-hidden />
            <span>100% Genuine Hardware</span>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-brand-cyan shrink-0" aria-hidden />
            <span>GST ITC Invoices</span>
          </div>
        </div>
      </div>

      {/* Side Feature Stack */}
      <div className="flex flex-col gap-4">
        {/* Card 1: Build Compatibility Validator */}
        <div className="group relative flex flex-1 flex-col justify-between rounded-xl border border-border bg-white p-6 shadow-sm transition-all hover:border-brand hover:shadow-md">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded bg-brand-soft px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-brand">
              <Cpu className="h-3 w-3" aria-hidden />
              Compatibility First
            </div>
            <h2 className="mt-2 text-[18px] font-extrabold text-navy tracking-tight group-hover:text-brand transition-colors">
              Live Build Validator
            </h2>
            <p className="mt-1.5 text-[13px] leading-relaxed text-text-secondary">
              Verify motor KV ratings, ESC current thresholds, propeller pitch, and battery cell count before ordering.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-border/60">
            <Link
              href="/build"
              className="inline-flex items-center gap-1.5 text-[13px] font-bold text-brand hover:text-navy transition-colors"
            >
              Launch Configurator
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" aria-hidden />
            </Link>
          </div>
        </div>

        {/* Card 2: Institutional Procurement & RFQ */}
        <div className="group relative flex flex-1 flex-col justify-between rounded-xl border border-border bg-white p-6 shadow-sm transition-all hover:border-brand hover:shadow-md">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded bg-surface-soft px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-navy">
              <Layers className="h-3 w-3 text-brand" aria-hidden />
              Institutional Supply
            </div>
            <h2 className="mt-2 text-[18px] font-extrabold text-navy tracking-tight group-hover:text-brand transition-colors">
              Bulk Orders &amp; RFQ
            </h2>
            <p className="mt-1.5 text-[13px] leading-relaxed text-text-secondary">
              Volume discounts, custom GST quotation generation, and formal purchase order fulfillment for university labs and fleets.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-border/60">
            <Link
              href="/bulk-orders/request"
              className="inline-flex items-center gap-1.5 text-[13px] font-bold text-brand hover:text-navy transition-colors"
            >
              Request a Quotation
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
