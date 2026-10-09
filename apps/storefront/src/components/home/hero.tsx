import Link from "next/link";
import Image from "next/image";

export function Hero() {
  return (
    <section className="bg-surface-soft">
      <div className="mx-auto flex flex-col md:flex-row max-w-[1280px] items-center justify-between px-8 py-12 md:px-10 md:py-20">
        <div className="w-full max-w-lg md:w-[50%] lg:w-[48%]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-success">
            BUILT FOR PROFESSIONAL APPLICATIONS
          </p>
          <h1 className="mt-4 text-[42px] font-bold leading-[0.98] tracking-[-0.025em] text-graphite md:text-[52px]">
            Professional UAVs
            <br />
            and Components
          </h1>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-text-secondary">
            Engineering-grade drones, flight hardware, and components for mapping,
            inspection, agriculture, and custom aerial systems.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/uavs"
              className="inline-flex items-center bg-graphite px-6 py-3 text-[13px] font-semibold text-white transition-colors hover:bg-graphite-soft"
              style={{ borderRadius: "var(--radius-sm)" }}
            >
              Shop UAVs
            </Link>
            <Link
              href="/parts"
              className="inline-flex items-center bg-surface px-6 py-3 text-[13px] font-semibold text-graphite transition-colors hover:bg-surface-muted"
              style={{ borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border-strong)" }}
            >
              Shop Components
            </Link>
          </div>
        </div>
        <div className="mt-8 w-full md:mt-0 md:w-[46%] lg:w-[45%]">
          <div
            className="relative aspect-[4/3] w-full overflow-hidden bg-surface-muted sm:aspect-[16/11] md:aspect-square"
            style={{ borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}
          >
            <Image
              src="/images/hero/uav-hero.png"
              alt="Professional Autonomous UAV Platform"
              fill
              priority
              className="object-cover transition-transform duration-500 hover:scale-[1.02]"
              sizes="(min-width: 1024px) 45vw, (min-width: 768px) 48vw, 100vw"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

