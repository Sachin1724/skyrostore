import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CatalogView, type CatalogParams } from "@/components/catalog/catalog-view";

export const metadata = { title: "Search" };

export default async function SearchPage({ searchParams }: { searchParams: Promise<CatalogParams> }) {
  const params = await searchParams;
  const q = params.q?.trim();
  return (
    <>
      <Header />
      {q ? (
        <CatalogView params={params} basePath="/search" heading={`Results for “${q}”`} crumbs={[{ href: `/search?q=${encodeURIComponent(q)}`, label: "Search" }]} />
      ) : (
        <main id="main" className="mx-auto min-h-[60vh] max-w-xl px-4 py-16">
          <h1 className="text-[28px] font-extrabold text-navy">Search</h1>
          <form action="/search" className="mt-6 flex h-12 rounded-md border-[1.5px] border-border-strong focus-within:border-brand">
            <label htmlFor="search-page-q" className="sr-only">Search products</label>
            <input id="search-page-q" type="search" name="q" placeholder="Motor, 6S battery, Pixhawk…" className="min-w-0 flex-1 rounded-l-md px-4 text-[16px] focus:outline-none" />
            <button type="submit" className="rounded-r-[4px] bg-brand px-5 font-semibold text-white hover:bg-navy">Search</button>
          </form>
        </main>
      )}
      <Footer />
    </>
  );
}
