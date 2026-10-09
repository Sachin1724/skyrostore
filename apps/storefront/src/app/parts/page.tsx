import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ProductGrid } from "@/components/product/product-grid";
import { getProducts, getCategories } from "@/lib/data/products";
import Link from "next/link";

export const metadata = { title: "Parts & Components" };

export default async function PartsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const params = await searchParams;
  const categories = await getCategories();
  const selectedCategory = params.category
    ? categories.find((c) => c.handle === params.category)
    : undefined;

  const { products } = await getProducts({
    category_id: selectedCategory ? [selectedCategory.id] : undefined,
    limit: 40,
  });

  return (
    <>
      <Header />
      <main className="mx-auto max-w-[1280px] px-8 py-6 md:px-10">
        {/* Breadcrumb */}
        <nav className="text-[11px] text-text-muted">
          <Link href="/" className="hover:text-text-secondary">Home</Link>
          <span className="mx-1.5">/</span>
          <span className="text-text-secondary">Parts</span>
        </nav>

        <h1 className="mt-4 text-[28px] font-bold tracking-[-0.025em] text-graphite">
          Parts & Components
        </h1>
        <p className="mt-1 text-[14px] text-text-secondary">
          Flight controllers, ESCs, motors, propellers, batteries, GPS, and more.
        </p>

        {categories.length > 0 && (
          <nav className="mt-6 flex flex-wrap gap-2">
            <a
              href="/parts"
              className={`text-[12px] font-medium transition-colors ${
                !params.category ? "bg-graphite text-white" : "bg-surface text-text-secondary hover:text-graphite"
              }`}
              style={{
                borderRadius: "var(--radius-sm)",
                padding: "6px 12px",
                border: !params.category ? "none" : "1px solid var(--color-border)",
              }}
            >
              All
            </a>
            {categories.map((cat) => (
              <a
                key={cat.id}
                href={`/parts?category=${cat.handle}`}
                className={`text-[12px] font-medium transition-colors ${
                  params.category === cat.handle ? "bg-graphite text-white" : "bg-surface text-text-secondary hover:text-graphite"
                }`}
                style={{
                  borderRadius: "var(--radius-sm)",
                  padding: "6px 12px",
                  border: params.category === cat.handle ? "none" : "1px solid var(--color-border)",
                }}
              >
                {cat.name?.replace("[DEV] ", "")}
              </a>
            ))}
          </nav>
        )}

        <div className="mt-8">
          <ProductGrid products={products} />
        </div>
      </main>
      <Footer />
    </>
  );
}
