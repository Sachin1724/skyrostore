import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ProductGrid } from "@/components/product/product-grid";
import { getProducts } from "@/lib/data/products";

export const metadata = { title: "Search" };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const query = params.q?.trim();

  const { products, count } = query
    ? await getProducts({ q: query, limit: 40 })
    : { products: [], count: 0 };

  return (
    <>
      <Header />
      <main className="mx-auto max-w-[1280px] px-8 py-6 md:px-10">
        <h1 className="text-[28px] font-bold tracking-[-0.025em] text-graphite">Search</h1>
        {query ? (
          <p className="mt-1 text-[14px] text-text-secondary">
            {count} result{count !== 1 ? "s" : ""} for &ldquo;{query}&rdquo;
          </p>
        ) : (
          <p className="mt-1 text-[14px] text-text-secondary">
            Enter a search term to find products.
          </p>
        )}

        {!query && (
          <form action="/search" className="mt-6 max-w-md">
            <input
              type="search"
              name="q"
              placeholder="Search UAVs, components, parts..."
              className="w-full px-3 py-2.5 text-[14px] text-graphite bg-surface placeholder:text-text-disabled focus:outline-none focus:ring-2 focus:ring-graphite/8 focus:border-graphite"
              style={{
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--color-border-strong)",
              }}
              autoFocus
            />
          </form>
        )}

        {query && (
          <div className="mt-8">
            <ProductGrid products={products} />
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
