import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { BulkOrderRequestForm } from "./bulk-order-request-form";
import { ShieldCheck, Wrench, Users, Headphones } from "lucide-react";
import { Suspense } from "react";

export const metadata = {
  title: "Bulk Orders & Custom UAV Builds — Skyrostore",
  description: "Get tailored solutions for your projects. Request multiple units, custom configurations, or specialized UAVs.",
};

export default function BulkOrderRequestPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-surface-soft">
        {/* Hero Top Banner */}
        <section className="relative overflow-hidden border-b border-border bg-white">
          <div className="flex flex-col justify-between px-5 py-8 md:flex-row md:items-center md:px-10">
            <div className="relative z-10 max-w-xl">
              <span className="text-[15px] font-semibold text-brand">
                Bulk orders
              </span>
              <h1 className="text-[clamp(2.5rem,1.6rem+3.6vw,4.5rem)] font-bold leading-[0.95] tracking-[-0.04em] text-balance mt-2 text-graphite">
                Fleets, labs and custom builds
              </h1>
              <p className="mt-4 max-w-[52ch] text-[18px] leading-[1.5] text-navy">
                Get tailored solutions for your projects. Request multiple units, custom configurations, or specialized UAVs for agriculture, mapping, inspection and industrial applications.
              </p>
            </div>
          </div>
        </section>

        {/* 4 Trust Badges Strip */}
        <section className="border-b border-border bg-white">
          <div className="grid grid-cols-2 gap-4 px-5 py-4 lg:grid-cols-4 md:px-10">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-soft text-brand">
                <ShieldCheck className="h-4 w-4 text-graphite" />
              </div>
              <div>
                <p className="text-[14px] font-bold text-graphite">Volume Pricing</p>
                <p className="text-[13px] text-text-muted">Competitive rates for bulk quantities</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-soft text-brand">
                <Wrench className="h-4 w-4 text-graphite" />
              </div>
              <div>
                <p className="text-[14px] font-bold text-graphite">Custom Builds</p>
                <p className="text-[13px] text-text-muted">Tailored to your requirements</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-soft text-brand">
                <Users className="h-4 w-4 text-graphite" />
              </div>
              <div>
                <p className="text-[14px] font-bold text-graphite">Expert Consultation</p>
                <p className="text-[13px] text-text-muted">Technical guidance from our team</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-soft text-brand">
                <Headphones className="h-4 w-4 text-graphite" />
              </div>
              <div>
                <p className="text-[14px] font-bold text-graphite">Reliable Support</p>
                <p className="text-[13px] text-text-muted">From quotation to delivery and beyond</p>
              </div>
            </div>
          </div>
        </section>

        {/* Main Bulk Order Request Container */}
        <section className="px-8 py-8 md:px-10">
          <Suspense fallback={<div className="py-12 text-center text-sm text-text-muted">Loading request dashboard...</div>}>
            <BulkOrderRequestForm />
          </Suspense>
        </section>
      </main>
      <Footer />
    </>
  );
}
