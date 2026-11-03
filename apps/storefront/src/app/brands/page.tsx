import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { getBrands, getCatalogIndex } from "@/lib/data/catalog";

export const metadata = { title: "Brands — Skyrostore" };

export default async function BrandsPage() {
  const [brands, index] = await Promise.all([getBrands(), getCatalogIndex()]);
  const listed = brands.filter((b) => (index.byBrand.get(b.id) ?? 0) > 0);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-surface-soft">
        <div className="px-8 py-10 md:px-10">
          <h1 className="text-[clamp(2.5rem,1.6rem+3.6vw,4.5rem)] font-bold leading-[0.95] tracking-[-0.04em] text-balance text-graphite">Brands</h1>
          <p className="mt-1.5 text-[14px] text-text-secondary">Shop by manufacturer.</p>
          {listed.length === 0 ? (
            <p className="mt-8 text-[13px] text-text-secondary">No brands listed yet.</p>
          ) : (
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
              {listed.map((b) => (
                <Link key={b.id} href={`/brands/${b.handle}`} className="bg-white p-5 text-center transition-colors hover:border-graphite">
                  {b.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={b.logo} alt="" className="mx-auto h-14 w-14 object-contain" />
                  ) : (
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded bg-surface-soft text-[20px] font-bold text-graphite">
                      {b.title.charAt(0)}
                    </div>
                  )}
                  <div className="mt-3 text-[14px] font-bold text-graphite">{b.title}</div>
                  <div className="mt-0.5 text-[13px] text-text-muted">{index.byBrand.get(b.id)} products</div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
