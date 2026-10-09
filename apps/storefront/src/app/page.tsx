import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Hero } from "@/components/home/hero";
import { ProductGrid } from "@/components/product/product-grid";
import { getProducts, getCategories } from "@/lib/data/products";
import Link from "next/link";

export default async function HomePage() {
  const [{ products: featured }, categories] = await Promise.all([
    getProducts({ limit: 8 }),
    getCategories(),
  ]);

  return (
    <>
      <Header />
      <main>
        <Hero />

        {/* Trust strip */}
        <section className="bg-surface" style={{ borderBottom: "1px solid var(--color-border)" }}>
          <div className="mx-auto grid max-w-[1280px] grid-cols-2 gap-0 px-8 md:grid-cols-4 md:px-10">
            {[
              { title: "Genuine Products", desc: "Trusted brands" },
              { title: "Fast Shipping", desc: "Pan India" },
              { title: "GST Invoicing", desc: "For businesses" },
              { title: "Expert Support", desc: "For builders & teams" },
            ].map((item, i) => (
              <div
                key={item.title}
                className="py-5"
                style={{
                  borderRight: i < 3 ? "1px solid var(--color-border)" : undefined,
                }}
              >
                <div className="px-5">
                  <p className="text-[13px] font-semibold text-graphite">{item.title}</p>
                  <p className="mt-0.5 text-[12px] text-text-muted">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Featured Products */}
        <section className="mx-auto max-w-[1280px] px-8 py-12 md:px-10">
          <div className="flex items-center justify-between">
            <h2 className="text-[22px] font-bold tracking-[-0.025em] text-graphite">
              Featured Products
            </h2>
            <Link
              href="/parts"
              className="text-[13px] font-medium text-text-secondary hover:text-graphite"
            >
              View all &rarr;
            </Link>
          </div>
          <div className="mt-6">
            <ProductGrid products={featured} />
          </div>
        </section>

        {/* Shop by Category */}
        {categories.length > 0 && (
          <section className="bg-surface-soft" style={{ borderTop: "1px solid var(--color-border)" }}>
            <div className="mx-auto max-w-[1280px] px-8 py-12 md:px-10">
              <div className="flex items-center justify-between">
                <h2 className="text-[22px] font-bold tracking-[-0.025em] text-graphite">
                  Shop by System
                </h2>
                <Link
                  href="/parts"
                  className="text-[13px] font-medium text-text-secondary hover:text-graphite"
                >
                  View all &rarr;
                </Link>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/parts?category=${cat.handle}`}
                    className="flex items-center justify-between bg-surface px-4 py-3 text-[13px] font-medium text-graphite transition-colors hover:bg-surface-muted"
                    style={{ borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}
                  >
                    {cat.name?.replace("[DEV] ", "")}
                    <span className="text-[12px] text-text-disabled">&rarr;</span>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Build CTA */}
        <section className="mx-auto max-w-[1280px] px-8 py-12 md:px-10">
          <div
            className="bg-graphite px-8 py-12 text-center"
            style={{ borderRadius: "var(--radius-md)" }}
          >
            <h2 className="text-[22px] font-bold text-white">
              Build Your UAV
            </h2>
            <p className="mx-auto mt-2 max-w-md text-[14px] text-text-disabled">
              Select components, validate compatibility, and configure a custom
              aerial platform for your application.
            </p>
            <Link
              href="/build"
              className="mt-6 inline-flex bg-accent px-6 py-3 text-[13px] font-semibold text-graphite transition-colors hover:bg-accent-hover"
              style={{ borderRadius: "var(--radius-sm)" }}
            >
              Start Configuration
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
