import Link from "next/link";
import { Header } from "../components/layout/header";
import { Footer } from "../components/layout/footer";
import { ArrowRight, Compass, Wrench, Package } from "lucide-react";

export default function NotFound() {
  return (
    <>
      <Header />
      <main id="main" className="min-h-[70vh] bg-surface-soft py-16">
        <div className="mx-auto max-w-[800px] px-4 text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1 text-[12px] font-mono font-bold text-text-muted shadow-2xs">
            HTTP Status: 404
          </div>

          <h1 className="mt-4 text-[clamp(2rem,1.5rem+2.5vw,3.2rem)] font-extrabold tracking-tight text-navy">
            Component or Page Not Found
          </h1>

          <p className="mt-3 text-[15px] leading-relaxed text-text-secondary max-w-[540px] mx-auto">
            The aerial hardware, technical schematic, or catalog route you requested is unavailable or has been migrated to an updated specification.
          </p>

          {/* Quick Action Navigation Grid */}
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
            <Link
              href="/parts"
              className="flex flex-col justify-between rounded-xl border border-border bg-white p-5 shadow-2xs transition-all hover:border-slate-400 hover:shadow-xs group"
            >
              <div>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-soft text-navy">
                  <Package className="h-5 w-5" aria-hidden="true" />
                </div>
                <h2 className="mt-3 text-[15px] font-bold text-navy">Parts Catalog</h2>
                <p className="mt-1 text-[12px] text-text-muted">
                  Browse verified motors, ESCs, carbon props, and batteries.
                </p>
              </div>
              <span className="mt-4 inline-flex items-center gap-1 text-[12px] font-bold text-brand group-hover:underline">
                Explore catalog <ArrowRight className="h-3 w-3" aria-hidden="true" />
              </span>
            </Link>

            <Link
              href="/build"
              className="flex flex-col justify-between rounded-xl border border-border bg-white p-5 shadow-2xs transition-all hover:border-slate-400 hover:shadow-xs group"
            >
              <div>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-soft text-navy">
                  <Wrench className="h-5 w-5" aria-hidden="true" />
                </div>
                <h2 className="mt-3 text-[15px] font-bold text-navy">Build Configurator</h2>
                <p className="mt-1 text-[12px] text-text-muted">
                  Assemble custom multi-rotors with automated clearance validation.
                </p>
              </div>
              <span className="mt-4 inline-flex items-center gap-1 text-[12px] font-bold text-brand group-hover:underline">
                Launch builder <ArrowRight className="h-3 w-3" aria-hidden="true" />
              </span>
            </Link>

            <Link
              href="/brands"
              className="flex flex-col justify-between rounded-xl border border-border bg-white p-5 shadow-2xs transition-all hover:border-slate-400 hover:shadow-xs group"
            >
              <div>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-soft text-navy">
                  <Compass className="h-5 w-5" aria-hidden="true" />
                </div>
                <h2 className="mt-3 text-[15px] font-bold text-navy">Certified Brands</h2>
                <p className="mt-1 text-[12px] text-text-muted">
                  Discover genuine hardware from T-Motor, Holybro, RadioMaster and more.
                </p>
              </div>
              <span className="mt-4 inline-flex items-center gap-1 text-[12px] font-bold text-brand group-hover:underline">
                View directory <ArrowRight className="h-3 w-3" aria-hidden="true" />
              </span>
            </Link>
          </div>

          {/* Return Home Button */}
          <div className="mt-10">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-lg bg-navy px-6 py-2.5 text-[14px] font-extrabold text-white transition hover:bg-brand shadow-2xs"
            >
              Return to Storefront Home
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

