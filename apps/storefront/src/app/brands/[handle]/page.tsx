import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ProductCard } from "@/components/product/product-card";
import { getProducts } from "@/lib/data/products";
import { getBrands, getCategoryTree, pathTo, cleanName } from "@/lib/data/catalog";

export default async function BrandPage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const brand = (await getBrands()).find((b) => b.handle === handle);
  if (!brand) notFound();

  const [tree, { products }] = await Promise.all([
    getCategoryTree(),
    getProducts({ collection_id: [brand.id], limit: 200 }),
  ]);

  // Group the brand's products under the category path of their first category.
  const groups = new Map<string, { label: string; handle?: string; items: typeof products }>();
  for (const product of products) {
    const cat = (product as { categories?: { handle: string; name: string }[] }).categories?.[0];
    const trail = cat ? pathTo(tree, cat.handle) : null;
    const key = cat?.handle ?? "__none";
    const label = trail ? trail.map((n) => n.name).join(" › ") : cat ? cleanName(cat.name) : "Other";
    if (!groups.has(key)) groups.set(key, { label, handle: cat?.handle, items: [] });
    groups.get(key)!.items.push(product);
  }
  const ordered = [...groups.values()].sort((a, b) => a.label.localeCompare(b.label));

  return (
    <>
      <Header />
      <main className="min-h-screen bg-surface-soft">
        <div className="mx-auto max-w-[1280px] px-8 py-10 md:px-10">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[14px] font-medium text-text-muted">
            <Link href="/" className="hover:text-graphite">Home</Link>
            <span>&gt;</span>
            <Link href="/brands" className="hover:text-graphite">Brands</Link>
            <span>&gt;</span>
            <span className="text-graphite">{brand.title}</span>
          </nav>
          <h1 className="mt-3 text-[32px] font-extrabold tracking-[-0.03em] text-graphite">{brand.title}</h1>
          <p className="mt-1.5 text-[14px] text-text-secondary">{products.length} products</p>

          {ordered.length === 0 ? (
            <p className="mt-8 text-[13px] text-text-secondary">No products from this brand yet.</p>
          ) : (
            ordered.map((group) => (
              <section key={group.label} className="mt-10">
                <h2 className="flex items-baseline gap-3 text-[16px] font-bold text-graphite">
                  {group.label}
                  {group.handle ? (
                    <Link href={`/parts?category=${group.handle}&brand=${brand.handle}`} className="text-[14px] font-semibold text-text-secondary hover:text-graphite hover:underline">
                      View in catalogue
                    </Link>
                  ) : null}
                </h2>
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {group.items.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
