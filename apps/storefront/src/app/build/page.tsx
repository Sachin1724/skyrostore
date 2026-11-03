import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { BuilderView } from "@/components/builder/builder-view";
import { getUAVComponents } from "@/lib/data/uav-components";
import { ShieldCheck, Activity, ShoppingCart, Cpu, CheckCircle2 } from "lucide-react";

export const metadata = {
  title: "Multi-Rotor UAV Build Configurator — Skyrostore",
  description: "Select components, validate propulsion compatibility, and configure a custom aerial platform with automated spec validation.",
};

export default async function BuildPage() {
  const components = await getUAVComponents();

  return (
    <>
      <Header />
      <main id="main" className="min-h-screen bg-surface-soft pb-20">
        <div className="mx-auto max-w-[1376px] px-4 md:px-8">
          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 pt-5 text-[13px] text-text-secondary">
            <Link href="/" className="hover:text-brand">Home</Link>
            <span aria-hidden>/</span>
            <span className="font-semibold text-navy">Build Configurator</span>
          </nav>

          {/* Hero Banner */}
          <section className="mt-4 rounded-xl border border-border-strong bg-navy p-6 md:p-10 text-white shadow-sm">
            <div className="max-w-[720px]">
              <div className="inline-flex items-center gap-1.5 rounded bg-brand/30 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-brand-cyan border border-brand/40">
                <Cpu className="h-3.5 w-3.5" aria-hidden />
                Propulsion &amp; Avionics Matching Engine
              </div>

              <h1 className="mt-3 text-[clamp(1.8rem,1.4rem+2.2vw,3rem)] font-extrabold leading-[1.08] tracking-[-0.03em] text-white">
                Multi-Rotor UAV Configurator
              </h1>

              <p className="mt-3 text-[14px] md:text-[16px] leading-relaxed text-[#C9D6E6]">
                Assemble custom drone platforms with real-time parameter validation. Prevents motor thermal runaway, voltage mismatches, and propeller clearance interference before checkout.
              </p>
            </div>

            {/* 3-Item Trust Strip */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-white/15 pt-5 text-[13px] text-[#A6BFDB]">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="h-4 w-4 text-brand-cyan shrink-0" aria-hidden />
                <span>Automated parameter cross-validation</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Activity className="h-4 w-4 text-brand-cyan shrink-0" aria-hidden />
                <span>Live AUW &amp; thrust-to-weight estimation</span>
              </div>
              <div className="flex items-center gap-2.5">
                <ShoppingCart className="h-4 w-4 text-brand-cyan shrink-0" aria-hidden />
                <span>One-click batch add to cart</span>
              </div>
            </div>
          </section>

          {/* Main Builder View */}
          <section className="mt-8">
            <BuilderView components={components} />
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
