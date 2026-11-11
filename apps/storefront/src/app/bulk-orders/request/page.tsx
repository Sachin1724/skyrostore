import Link from "next/link";
import { BackLink } from "@/components/layout/back-link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { BulkOrderRequestForm } from "./bulk-order-request-form";
import { ShieldCheck, Wrench, Users, Headphones, Building2, CheckCircle2 } from "lucide-react";
import { Suspense } from "react";

export const metadata = {
  title: "Request a bulk quote",
  description: "Request volume pricing, customized multi-rotor configurations, or institutional tender quotes with technical engineering review.",
};

export default function BulkOrderRequestPage() {
  return (
    <>
      <Header />
      <main id="main" className="min-h-screen bg-surface-soft pb-20">
        <div className="mx-auto max-w-[1760px] px-4 md:px-8">
          {/* Breadcrumb */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-4">
          <BackLink fallback="/bulk-orders" />
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5  text-[13px] text-text-secondary">
            <Link href="/" className="hover:text-brand">Home</Link>
            <span aria-hidden>/</span>
            <Link href="/bulk-orders" className="hover:text-brand">Institutional &amp; Bulk</Link>
            <span aria-hidden>/</span>
            <span className="font-semibold text-navy">Request for Quotation</span>
          </nav>
        </div>

          {/* Hero Banner */}
          <section className="mt-4 card p-6 md:p-8 text-navy ">
            <div className="max-w-[760px]">

              <h1 className="mt-3 text-[clamp(1.8rem,1.4rem+2.2vw,3rem)] font-extrabold leading-[1.1] tracking-[-0.03em] text-navy">
                Request a bulk quote
              </h1>

              <p className="mt-3 text-[14px] md:text-[16px] leading-relaxed text-text-secondary">
                Add the parts and quantities, or describe a custom build. We reply with an itemised quotation including GST.
              </p>
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
