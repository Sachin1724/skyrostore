import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ArrowRight } from "lucide-react";

export const metadata = {
  title: "Bulk orders",
  description: "Quotations with GST invoices for labs, courses and fleets buying drone parts and complete UAVs in quantity.",
};

// What actually happens to a bulk request, step by step. Volume prices, payment terms and lead times are
// quoted per request; nothing here promises a rate the team has not set.
const STEPS = [
  { title: "Send your list", text: "Parts and quantities, a build from the configurator, or a description of what you need." },
  { title: "We check it", text: "Stock, lead time, and that the parts work together." },
  { title: "You get a quotation", text: "Prices for your quantities, delivery and GST, in your account and by email." },
  { title: "Accept it to order", text: "An accepted quotation becomes a normal order with tracking and a GST invoice." },
];

export default function BulkOrdersLandingPage() {
  return (
    <>
      <Header />
      <main id="main" className="min-h-screen bg-surface-soft pb-20">
        <div className="mx-auto max-w-[1760px] px-4 md:px-8">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 pt-5 text-[13px] text-text-secondary">
            <Link href="/" className="hover:text-brand">Home</Link>
            <span aria-hidden>/</span>
            <span className="font-semibold text-navy">Bulk orders</span>
          </nav>

          <section className="mt-4 grid items-center overflow-hidden rounded-2xl bg-white md:grid-cols-[1.1fr_1fr]">
            <div className="p-5 sm:p-8 md:p-12">
              <h1 className="text-[clamp(1.9rem,1.4rem+2.4vw,3.4rem)] font-extrabold leading-[1.08] tracking-[-0.03em] text-navy">
                Bulk orders
              </h1>
              <p className="mt-3 max-w-[52ch] text-[16px] leading-relaxed text-text-secondary">
                Buying for a lab, a course or a fleet? Send the parts and quantities and we reply with a quotation and a
                GST invoice.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link href="/bulk-orders/request" className="btn btn-primary">
                  Request a quote
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
                <Link href="/build" className="btn btn-secondary">
                  Build your drone first
                </Link>
              </div>
            </div>
            <div className="relative hidden h-full min-h-[360px] bg-surface-soft md:block">
              <Image src="/images/hero/bulk-hero-drone.png" alt="" fill sizes="45vw" className="object-cover object-right" />
            </div>
          </section>

          <section aria-labelledby="how-heading" className="mt-10">
            <h2 id="how-heading" className="text-[22px] font-extrabold tracking-tight text-navy">
              How it works
            </h2>
            <ol className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((s, i) => (
                <li key={s.title} className="flex gap-3 rounded-xl bg-white p-4 sm:flex-col sm:p-5">
                  <span aria-hidden className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy text-[14px] font-bold text-white">
                    {i + 1}
                  </span>
                  <span>
                    <span className="block text-[16px] font-semibold text-navy">{s.title}</span>
                    <span className="mt-1 block text-[14px] leading-relaxed text-text-secondary">{s.text}</span>
                  </span>
                </li>
              ))}
            </ol>
          </section>

          <section aria-labelledby="price-heading" className="mt-10 rounded-xl bg-white p-5 sm:p-8">
            <h2 id="price-heading" className="text-[20px] font-extrabold tracking-tight text-navy">
              Pricing for larger quantities
            </h2>
            <p className="mt-2 max-w-[65ch] text-[16px] leading-relaxed text-text-secondary">
              Prices for quantities are worked out per request, from the parts, the numbers and the delivery you need.
              The quotation lists every line with GST, so you can compare it before you commit. Ask for anything not in
              the catalogue in the same request.
            </p>
          </section>

          <section className="mt-10 rounded-xl bg-navy p-6 text-center text-white sm:p-8">
            <h2 className="text-[22px] font-extrabold">Ready to send your list?</h2>
            <p className="mx-auto mt-2 max-w-xl text-[16px] text-on-dark">
              It takes a few minutes, and you can follow the quotation in your account.
            </p>
            <Link href="/bulk-orders/request" className="btn btn-light mt-6">
              Request a quote
            </Link>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
