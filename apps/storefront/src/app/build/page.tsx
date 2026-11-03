import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { BuilderView } from "@/components/builder/builder-view";
import { getUAVComponents } from "@/lib/data/uav-components";
import { ShieldCheck, Activity, ShoppingCart } from "lucide-react";

export const metadata = { title: "Build Your UAV — Skyrostore" };

export default async function BuildPage() {
  const components = await getUAVComponents();

  return (
    <>
      <Header />
      <main id="main" className="min-h-screen bg-surface-soft">
        {/* Hero Banner */}
        <section className="relative overflow-hidden border-b border-border bg-white">
          <div className="flex flex-col justify-between px-5 py-8 md:flex-row md:items-center md:px-10">
            <div className="relative z-10 max-w-xl">
              <h1 className="text-[clamp(2.5rem,1.6rem+3.6vw,4.5rem)] font-bold leading-[0.95] tracking-[-0.04em] text-balance text-graphite">
                Build Your UAV
              </h1>
              <p className="mt-4 max-w-[48ch] text-[18px] leading-[1.5] text-navy">
                Select components, validate compatibility, and configure a custom aerial platform for your application.
              </p>
            </div>
          </div>
        </section>

        {/* 3-Item Trust Strip */}
        <section className="border-b border-border bg-white">
          <div className="grid grid-cols-1 gap-4 px-5 py-4 sm:grid-cols-3 md:px-10">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-soft text-brand">
                <ShieldCheck className="h-4 w-4 text-graphite" />
              </div>
              <div>
                <p className="text-[14px] font-bold text-graphite">Real-time Compatibility</p>
                <p className="text-[13px] text-text-muted">Avoid incompatible components</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-soft text-brand">
                <Activity className="h-4 w-4 text-graphite" />
              </div>
              <div>
                <p className="text-[14px] font-bold text-graphite">Live Performance Estimate</p>
                <p className="text-[13px] text-text-muted">Weight, power and flight time</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-soft text-brand">
                <ShoppingCart className="h-4 w-4 text-graphite" />
              </div>
              <div>
                <p className="text-[14px] font-bold text-graphite">Add to Cart or Request Quote</p>
                <p className="text-[13px] text-text-muted">Buy single or bulk quantities</p>
              </div>
            </div>
          </div>
        </section>

        {/* 3-Column Main Builder View */}
        <section className="px-8 py-8 md:px-10">
          <BuilderView components={components} />
        </section>
      </main>
      <Footer />
    </>
  );
}
