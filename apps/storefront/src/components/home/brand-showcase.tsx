import Link from "next/link";
import { ArrowRight } from "lucide-react";
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
  // One brand is not a choice; the section appears once a second brand has products.
  if (brands.length < 2) return null;

  const topBrands = brands.slice(0, 6);

  return (
    <section aria-labelledby="brand-showcase-heading" className="space-y-5">
      <div className="flex items-baseline justify-between">
        <h2 id="brand-showcase-heading" className="text-[clamp(1.4rem,1.1rem+1vw,1.75rem)] font-extrabold tracking-[-0.02em] text-navy">
          Shop by brand
        </h2>
        <Link href="/brands" className="inline-flex items-center gap-1 text-[14px] font-semibold text-brand transition-colors hover:text-navy">
          All {brands.length} brands
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
        {topBrands.map((b) => (
          <Link
            key={b.handle}
            href={`/brands/${b.handle}`}
            className="group flex flex-col items-center justify-center rounded-lg bg-white p-4 text-center transition-colors"
          >
            <span className="text-[15px] font-extrabold tracking-tight text-navy transition-colors group-hover:text-brand">{b.title}</span>
            <span className="mt-1 text-[13px] tabular-nums text-text-secondary">
              {b.count} {b.count === 1 ? "part" : "parts"}
            </span>
          </Link>
        ))}
      </div>

      {brands.length > 6 ? (
        <div className="overflow-hidden rounded-xl">
          <BrandBar brands={brands} />
        </div>
      ) : null}
    </section>
  );
}
