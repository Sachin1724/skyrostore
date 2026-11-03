import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { getBrands, getCatalogIndex, cleanName } from "@/lib/data/catalog";
import { getProducts } from "@/lib/data/products";
import { BrandsDirectory } from "./components/brands-directory";
import { ShieldCheck, Truck, FileText, Building2, ArrowRight } from "lucide-react";

export const metadata = {
  title: "Authorized UAV Hardware Brands & Manufacturers — Skyrostore",
  description: "Browse certified multi-rotor component manufacturers: T-Motor, Holybro, CUAV, Hobbywing and more with official warranty and GST invoicing.",
};

export default async function BrandsPage() {
  const [brands, index, { products }] = await Promise.all([
    getBrands(),
    getCatalogIndex(),
    getProducts({ limit: 500 }),
  ]);

  // Derive categories per brand
  const brandCategories: Record<string, string[]> = {};
  for (const p of products) {
    if (p.collection?.id && p.categories?.length) {
      const bId = p.collection.id;
      if (!brandCategories[bId]) brandCategories[bId] = [];
      for (const cat of p.categories) {
        const clean = cleanName(cat.name);
        if (!brandCategories[bId].includes(clean)) {
          brandCategories[bId].push(clean);
        }
      }
    }
  }

  const listed = brands
    .map((b) => ({
      ...b,
      count: index.byBrand.get(b.id) ?? 0,
      categories: brandCategories[b.id] ?? [],
    }))
    .filter((b) => b.count > 0)
    .sort((a, b) => a.title.localeCompare(b.title));

  const totalHardwareCount = listed.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <>
      <Header />
      <main id="main" className="min-h-screen bg-surface-soft pb-20">
        <div className="mx-auto max-w-[1376px] px-4 md:px-8">
          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 pt-5 text-[13px] text-text-secondary">
            <Link href="/" className="hover:text-brand">Home</Link>
            <span aria-hidden>/</span>
            <span className="font-semibold text-navy">Brands</span>
          </nav>

          {/* Hero Header */}
          <div className="mt-4 rounded-xl border border-border-strong bg-navy p-6 md:p-10 text-white shadow-sm">
            <div className="max-w-[720px]">
              <div className="inline-flex items-center gap-1.5 rounded bg-brand/30 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-brand-cyan border border-brand/40">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
                Authorized Supply Chain
              </div>

              <h1 className="mt-3 text-[clamp(1.8rem,1.4rem+2.2vw,3rem)] font-extrabold leading-[1.08] tracking-[-0.03em] text-white">
                Certified Component Manufacturers
              </h1>

              <p className="mt-3 text-[14px] md:text-[16px] leading-relaxed text-[#C9D6E6]">
                Direct procurement partnerships with tier-1 multi-rotor manufacturers. All components carry official manufacturer warranty, batch traceability, and Indian GST tax invoices.
              </p>
            </div>

            {/* Quick Stats Strip */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-white/15 pt-5 text-[13px] text-[#A6BFDB]">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="h-4 w-4 text-brand-cyan shrink-0" aria-hidden />
                <span><strong className="text-white tabular-nums">{listed.length}</strong> Authorized Brands</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Truck className="h-4 w-4 text-brand-cyan shrink-0" aria-hidden />
                <span><strong className="text-white tabular-nums">{totalHardwareCount}</strong> Listed Components</span>
              </div>
              <div className="flex items-center gap-2.5">
                <FileText className="h-4 w-4 text-brand-cyan shrink-0" aria-hidden />
                <span>Delhivery Air Express Dispatch</span>
              </div>
            </div>
          </div>

          {/* Directory Component with Search & A-Z bar */}
          <div className="mt-8">
            <BrandsDirectory brands={listed} />
          </div>

          {/* Institutional / Manufacturer Callout */}
          <div className="mt-14 rounded-xl border border-border bg-white p-6 md:p-8 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-brand">
                <Building2 className="h-3.5 w-3.5" aria-hidden />
                Manufacturer Partnerships
              </div>
              <h2 className="mt-1 text-[18px] md:text-[20px] font-extrabold text-navy">
                Are you a certified UAV hardware manufacturer?
              </h2>
              <p className="mt-1 text-[14px] text-text-secondary max-w-[55ch]">
                We partner with international and domestic drone component designers to provide rapid distribution and institutional supply across India.
              </p>
            </div>

            <Link
              href="/support"
              className="inline-flex h-11 shrink-0 items-center gap-2 rounded-md bg-navy px-6 text-[14px] font-bold text-white transition-colors hover:bg-brand shadow-sm"
            >
              Contact Procurement Team
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
