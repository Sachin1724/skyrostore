import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { BulkOrderRequestForm } from "./bulk-order-request-form";
import Link from "next/link";
import { Suspense } from "react";

export const metadata = {
  title: "Request Bulk Quote & Custom UAV Build | Skyrostore",
  description: "Submit institutional specifications for bulk components or custom UAV engineering.",
};

export default function BulkOrderRequestPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-[900px] px-8 py-10 md:px-10">
        {/* Breadcrumb */}
        <nav className="text-[11px] font-mono uppercase tracking-[0.08em] text-text-muted">
          <Link href="/" className="hover:text-text-secondary">Home</Link>
          <span className="mx-2 text-text-disabled">/</span>
          <Link href="/bulk-orders" className="hover:text-text-secondary">Bulk Orders</Link>
          <span className="mx-2 text-text-disabled">/</span>
          <span className="text-graphite">Request Specification</span>
        </nav>

        <div className="mt-6 border-b border-color-border pb-6">
          <h1 className="text-[28px] font-bold tracking-tight text-graphite sm:text-[32px]">
            Bulk Supply & Custom UAV Build Request
          </h1>
          <p className="mt-2 text-[14px] leading-relaxed text-text-secondary">
            Provide your component quantities or custom airframe requirements. Our engineering team validates propulsion curves, thermal envelopes, and prepares an official itemized quotation.
          </p>
        </div>

        <div className="mt-8">
          <Suspense fallback={<div className="py-12 text-center text-sm text-text-muted">Loading request form...</div>}>
            <BulkOrderRequestForm />
          </Suspense>
        </div>
      </main>
      <Footer />
    </>
  );
}
