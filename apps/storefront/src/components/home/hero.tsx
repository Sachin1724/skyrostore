import Link from "next/link";
import Image from "next/image";

export function Hero() {
  return (
    <section className="bg-white" style={{ borderBottom: "1px solid var(--color-border)" }}>
      <div className="mx-auto flex flex-col md:flex-row max-w-[1280px] items-center justify-between px-8 py-10 md:px-10 md:py-16">
        <div className="w-full max-w-xl md:w-[52%]">
          <div className="inline-block">
            <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-success">
              BUILT FOR PROFESSIONAL APPLICATIONS
            </span>
            <div className="mt-1 h-0.5 w-12 bg-accent" />
          </div>
          <h1 className="mt-4 text-[44px] font-extrabold leading-[1.04] tracking-[-0.03em] text-graphite md:text-[54px]">
            Professional UAVs
            <br />
            and Components
          </h1>
          <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-text-secondary">
            Engineering-grade drones, flight hardware, and components for mapping,
            inspection, agriculture, and custom aerial systems.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/uavs"
              className="inline-flex items-center gap-2 rounded-md bg-graphite px-6 py-3 text-[13px] font-bold text-white transition-all hover:bg-black"
            >
              Shop UAVs &rarr;
            </Link>
            <Link
              href="/parts"
              className="inline-flex items-center rounded-md border border-border bg-white px-6 py-3 text-[13px] font-semibold text-graphite transition-all hover:bg-surface-soft hover:border-border-strong"
            >
              Shop Components
            </Link>
          </div>
        </div>

        <div className="mt-8 w-full md:mt-0 md:w-[48%] flex items-center justify-center">
          <div className="relative aspect-[16/10] w-full max-w-[540px]">
            <Image
              src="/images/hero/storefront-hero-drone.png"
              alt="Professional Multi-Rotor UAV Platform"
              fill
              priority
              className="object-contain"
              sizes="(min-width: 1024px) 50vw, 100vw"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

