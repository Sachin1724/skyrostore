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
        <div className="mx-auto max-w-[1760px] px-4 md:px-8">
          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 pt-5 text-[13px] text-text-secondary">
            <Link href="/" className="hover:text-brand">Home</Link>
            <span aria-hidden>/</span>
            <span className="font-semibold text-navy">Brands</span>
          </nav>

          {/* Hero Header */}
          <div className="mt-4 card p-6 md:p-10 text-navy ">
            <div className="max-w-[720px]">

              <h1 className="mt-3 text-[clamp(1.8rem,1.4rem+2.2vw,3rem)] font-extrabold leading-[1.08] tracking-[-0.03em] text-navy">
                Certified Component Manufacturers
              </h1>

              <p className="mt-3 text-[14px] md:text-[16px] leading-relaxed text-text-secondary">
                Direct procurement partnerships with tier-1 multi-rotor manufacturers. All components carry official manufacturer warranty, batch traceability, and Indian GST tax invoices.
              </p>
            </div>


          </div>

          {/* Directory Component with Search & A-Z bar */}
          <div className="mt-8">
            <BrandsDirectory brands={listed} />
          </div>

          {/* Institutional / Manufacturer Callout */}
          <div className="mt-14 card p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h2 className="mt-1 text-[18px] md:text-[20px] font-extrabold text-navy">
                Are you a certified UAV hardware manufacturer?
              </h2>
              <p className="mt-1 text-[14px] text-text-secondary max-w-[55ch]">
                We partner with international and domestic drone component designers to provide rapid distribution and institutional supply across India.
              </p>
            </div>

            <Link
              href="/support"
              className="btn btn-primary shrink-0"
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
