import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { BuilderView } from "@/components/builder/builder-view";
import { getUAVComponents } from "@/lib/data/uav-components";
import Image from "next/image";
import { ShieldCheck, Activity, ShoppingCart } from "lucide-react";

export const metadata = { title: "Build Your UAV — Skyrostore" };

export default async function BuildPage() {
  const components = await getUAVComponents();

  return (
    <>
      <Header />
      <main className="min-h-screen bg-surface-soft">
        {/* Hero Banner */}
        <section className="relative overflow-hidden border-b border-border bg-white">
          <div className="mx-auto flex max-w-[1280px] flex-col justify-between px-8 py-8 md:flex-row md:items-center md:px-10">
            <div className="relative z-10 max-w-xl">
              <h1 className="text-[34px] font-extrabold tracking-[-0.03em] text-graphite md:text-[40px]">
                Build Your UAV
              </h1>
              <p className="mt-2 text-[14px] leading-relaxed text-text-secondary">
                Select components, validate compatibility, and configure a custom aerial platform for your application.
              </p>
            </div>
            {/* Banner Disassembled Frame Asset */}
            <div className="pointer-events-none relative mt-4 h-28 w-full max-w-[500px] md:mt-0 md:h-32">
              <Image
                src="/images/hero/builder-drone-frame.png"
                alt="Disassembled Carbon Frame"
                fill
                className="object-contain object-right"
              />
            </div>
          </div>
        </section>

        {/* 3-Item Trust Strip */}
        <section className="border-b border-border bg-white">
          <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-4 px-8 py-4 sm:grid-cols-3 md:px-10">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/20 text-graphite">
                <ShieldCheck className="h-4 w-4 text-graphite" />
              </div>
              <div>
                <p className="text-[12px] font-bold text-graphite">Real-time Compatibility</p>
                <p className="text-[11px] text-text-muted">Avoid incompatible components</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/20 text-graphite">
                <Activity className="h-4 w-4 text-graphite" />
              </div>
              <div>
                <p className="text-[12px] font-bold text-graphite">Live Performance Estimate</p>
                <p className="text-[11px] text-text-muted">Weight, power and flight time</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/20 text-graphite">
                <ShoppingCart className="h-4 w-4 text-graphite" />
              </div>
              <div>
                <p className="text-[12px] font-bold text-graphite">Add to Cart or Request Quote</p>
                <p className="text-[11px] text-text-muted">Buy single or bulk quantities</p>
              </div>
            </div>
          </div>
        </section>

        {/* 3-Column Main Builder View */}
        <section className="mx-auto max-w-[1280px] px-8 py-8 md:px-10">
          <BuilderView components={components} />
        </section>
      </main>
      <Footer />
    </>
  );
}
