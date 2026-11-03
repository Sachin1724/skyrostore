import Link from "next/link";
import { ArrowRight, Building2, CheckSquare } from "lucide-react";

interface B2BBannerProps {
  title?: string;
  subtitle?: string;
}

export function B2BBanner({
  title = "Equipping a Research Lab, University Team, or Drone Fleet?",
  subtitle = "Direct institutional procurement with volume pricing, formal purchase orders, GST input tax credits, and scheduled batch shipments.",
}: B2BBannerProps) {
  return (
    <section
      aria-labelledby="b2b-procurement-heading"
      className="relative overflow-hidden rounded-xl border border-navy bg-navy px-6 py-8 text-white shadow-sm md:px-10 md:py-10"
    >
      <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-[700px]">
          <div className="inline-flex items-center gap-1.5 rounded bg-brand/30 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-brand-cyan border border-brand/40">
            <Building2 className="h-3.5 w-3.5" aria-hidden />
            Institutional Procurement &amp; B2B
          </div>

          <h2
            id="b2b-procurement-heading"
            className="mt-3 text-[clamp(1.4rem,1.1rem+1.2vw,2rem)] font-extrabold tracking-[-0.02em] text-white leading-tight"
          >
            {title}
          </h2>

          <p className="mt-2 text-[14px] md:text-[15px] leading-relaxed text-[#C9D6E6]">
            {subtitle}
          </p>

          <div className="mt-4 flex flex-wrap gap-y-2 gap-x-6 text-[12px] text-[#A6BFDB]">
            <span className="flex items-center gap-1.5">
              <CheckSquare className="h-3.5 w-3.5 text-brand-cyan" aria-hidden /> Formal Purchase Orders
            </span>
            <span className="flex items-center gap-1.5">
              <CheckSquare className="h-3.5 w-3.5 text-brand-cyan" aria-hidden /> Tiered Volume Discounts
            </span>
            <span className="flex items-center gap-1.5">
              <CheckSquare className="h-3.5 w-3.5 text-brand-cyan" aria-hidden /> Official GST Tax Invoices
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/bulk-orders/request"
            className="inline-flex h-11 items-center gap-2 rounded-md bg-white px-6 text-[14px] font-bold text-navy transition-colors hover:bg-brand-soft shadow-sm"
          >
            Request a Bulk Quote
            <ArrowRight className="h-4 w-4 text-brand" aria-hidden />
          </Link>
          <Link
            href="/bulk-orders"
            className="inline-flex h-11 items-center rounded-md border border-white/40 px-5 text-[14px] font-semibold text-white transition-all hover:border-white hover:bg-white/10"
          >
            Institutional Guide
          </Link>
        </div>
      </div>
    </section>
  );
}
