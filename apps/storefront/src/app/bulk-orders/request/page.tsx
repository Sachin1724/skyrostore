import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { BulkOrderRequestForm } from "./bulk-order-request-form";
import { ShieldCheck, Wrench, Users, Headphones, Building2, CheckCircle2 } from "lucide-react";
import { Suspense } from "react";

export const metadata = {
  title: "Request Bulk UAV Quotation & Custom Builds — Skyrostore",
  description: "Request volume pricing, customized multi-rotor configurations, or institutional tender quotes with technical engineering review.",
};

export default function BulkOrderRequestPage() {
  return (
    <>
      <Header />
      <main id="main" className="min-h-screen bg-surface-soft pb-20">
        <div className="mx-auto max-w-[1376px] px-4 md:px-8">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 pt-5 text-[13px] text-text-secondary">
            <Link href="/" className="hover:text-brand">Home</Link>
            <span aria-hidden>/</span>
            <Link href="/bulk-orders" className="hover:text-brand">Institutional &amp; Bulk</Link>
            <span aria-hidden>/</span>
            <span className="font-semibold text-navy">Request for Quotation</span>
          </nav>

          {/* Hero Banner */}
          <section className="mt-4 rounded-xl border border-border-strong bg-navy p-6 md:p-8 text-white shadow-sm">
            <div className="max-w-[760px]">
              <div className="inline-flex items-center gap-1.5 rounded bg-brand/30 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-brand-cyan border border-brand/40">
                <Building2 className="h-3.5 w-3.5" aria-hidden />
                Official RFQ Portal
              </div>

              <h1 className="mt-3 text-[clamp(1.8rem,1.4rem+2.2vw,3rem)] font-extrabold leading-[1.1] tracking-[-0.03em] text-white">
                Request Bulk Quotation &amp; Custom UAV Builds
              </h1>

              <p className="mt-3 text-[14px] md:text-[15px] leading-relaxed text-[#C9D6E6]">
                Configure multiple units, bespoke payloads, or enterprise fleet lots. All submissions receive an itemized proposal with volume pricing, GST tax invoicing, and technical validation within 24 hours.
              </p>
            </div>

            {/* 4 Trust Points Strip */}
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3 border-t border-white/15 pt-5 text-[12px] text-[#A6BFDB]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-brand-cyan shrink-0" aria-hidden />
                <span>Tiered Volume Discounts</span>
              </div>
              <div className="flex items-center gap-2">
                <Wrench className="h-4 w-4 text-brand-cyan shrink-0" aria-hidden />
                <span>Custom Motor/ESC Wiring</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-brand-cyan shrink-0" aria-hidden />
                <span>Dedicated Technical Engineer</span>
              </div>
              <div className="flex items-center gap-2">
                <Headphones className="h-4 w-4 text-brand-cyan shrink-0" aria-hidden />
                <span>1-Day Guaranteed Turnaround</span>
              </div>
            </div>
          </section>

          {/* Main Form Container */}
          <section className="mt-8">
            <Suspense fallback={<div className="py-12 text-center text-sm text-text-muted">Loading request dashboard...</div>}>
              <BulkOrderRequestForm />
            </Suspense>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
