import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { BulkOrderRequestForm } from "./bulk-order-request-form";
import Image from "next/image";
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
          <div className="mx-auto flex max-w-[1280px] flex-col justify-between px-8 py-8 md:flex-row md:items-center md:px-10">
            <div className="relative z-10 max-w-xl">
              <span className="text-[11px] font-bold uppercase tracking-widest text-success">
                BUSINESS SOLUTIONS
              </span>
              <h1 className="mt-2 text-[32px] font-extrabold tracking-tight text-graphite md:text-[40px]">
                Bulk Orders &amp; Custom UAV Builds
              </h1>
              <p className="mt-2 text-[14px] leading-relaxed text-text-secondary">
                Get tailored solutions for your projects. Request multiple units, custom configurations, or specialized UAVs for agriculture, mapping, inspection and industrial applications.
              </p>
            </div>
            {/* Banner Industrial Drone Asset */}
            <div className="pointer-events-none relative mt-4 h-28 w-full max-w-[500px] md:mt-0 md:h-32">
              <Image
                src="/images/hero/bulk-hero-drone.png"
                alt="Industrial Inspection Hexacopter"
                fill
                className="object-contain object-right"
              />
            </div>
          </div>
        </section>

        {/* 4 Trust Badges Strip */}
        <section className="border-b border-border bg-white">
          <div className="mx-auto grid max-w-[1280px] grid-cols-2 gap-4 px-8 py-4 lg:grid-cols-4 md:px-10">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/20 text-graphite">
                <ShieldCheck className="h-4 w-4 text-graphite" />
              </div>
              <div>
                <p className="text-[12px] font-bold text-graphite">Volume Pricing</p>
                <p className="text-[11px] text-text-muted">Competitive rates for bulk quantities</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/20 text-graphite">
                <Wrench className="h-4 w-4 text-graphite" />
              </div>
              <div>
                <p className="text-[12px] font-bold text-graphite">Custom Builds</p>
                <p className="text-[11px] text-text-muted">Tailored to your requirements</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/20 text-graphite">
                <Users className="h-4 w-4 text-graphite" />
              </div>
              <div>
                <p className="text-[12px] font-bold text-graphite">Expert Consultation</p>
                <p className="text-[11px] text-text-muted">Technical guidance from our team</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/20 text-graphite">
                <Headphones className="h-4 w-4 text-graphite" />
              </div>
              <div>
                <p className="text-[12px] font-bold text-graphite">Reliable Support</p>
                <p className="text-[11px] text-text-muted">From quotation to delivery and beyond</p>
              </div>
            </div>
          </div>
        </section>

        {/* Main Bulk Order Request Container */}
        <section className="mx-auto max-w-[1280px] px-8 py-8 md:px-10">
          <Suspense fallback={<div className="py-12 text-center text-sm text-text-muted">Loading request dashboard...</div>}>
            <BulkOrderRequestForm />
          </Suspense>
        </section>
      </main>
      <Footer />
    </>
  );
}
