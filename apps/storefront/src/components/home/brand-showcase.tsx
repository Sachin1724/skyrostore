import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { BrandBar } from "./brand-bar";

interface BrandItem {
  handle: string;
  title: string;
  count: number;
}

interface BrandShowcaseProps {
  brands: BrandItem[];
}

export function BrandShowcase({ brands }: BrandShowcaseProps) {
  if (brands.length === 0) return null;

  const topBrands = brands.slice(0, 6);

  return (
    <section aria-labelledby="brand-showcase-heading" className="space-y-6">
      <div className="flex items-end justify-between border-b border-border pb-3.5">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-brand">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
            Authorized Supply Chain
          </div>
          <h2
            id="brand-showcase-heading"
            className="text-[clamp(1.4rem,1.1rem+1vw,1.75rem)] font-extrabold tracking-[-0.02em] text-navy"
          >
            Certified Component Manufacturers
          </h2>
        </div>
        <Link
          href="/brands"
          className="inline-flex items-center gap-1 text-[13px] font-bold text-brand hover:text-navy transition-colors"
        >
          View All {brands.length} Brands
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>

      {/* Brand Cards Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
        {topBrands.map((b) => (
          <Link
            key={b.handle}
            href={`/brands/${b.handle}`}
            className="group flex flex-col items-center justify-center rounded-lg border border-border bg-white p-4 text-center transition-all duration-200 hover:-translate-y-0.5 hover:border-brand hover:shadow-sm"
          >
            <span className="text-[15px] font-extrabold tracking-tight text-navy group-hover:text-brand transition-colors">
              {b.title}
            </span>
            <span className="mt-1 rounded bg-surface-soft px-2 py-0.5 text-[11px] font-semibold tabular-nums text-text-muted">
              {b.count} {b.count === 1 ? "part" : "parts"}
            </span>
          </Link>
        ))}
      </div>

      {/* Marquee Strip */}
      <div className="overflow-hidden rounded-xl border border-brand/20">
        <BrandBar brands={brands} />
      </div>
    </section>
  );
}
