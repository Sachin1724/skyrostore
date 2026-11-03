import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { getProductByHandle, getProducts } from "@/lib/data/products";
import { getCategoryTree, getBrands, pathTo } from "@/lib/data/catalog";
import { getCompatibleProducts } from "@/lib/data/compatible-products";
import { ProductCard } from "@/components/product/product-card";
import { ProductDetailClient } from "./product-detail-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  try {
    const { handle } = await params;
    const product = await getProductByHandle(handle);
    if (!product) return { title: "Product Not Found" };
    return {
      title: `${product.title?.replace("[DEV] ", "")} | Skyrostore UAV Engineering`,
      description: product.description || product.subtitle || "Professional UAV component with verified engineering specifications.",
    };
  } catch (err) {
    console.error("generateMetadata error:", err);
    return { title: "Product | Skyrostore" };
  }
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const product = await getProductByHandle(handle);
  if (!product) notFound();

  // Real category path and brand, so the page shows where the product belongs.
  const firstCategory = (product as { categories?: { id: string; handle: string }[] }).categories?.[0];

  // Related means the same category; without one there is nothing honest to show.
  const relatedProductsPromise = firstCategory
    ? getProducts({ limit: 9, category_id: [firstCategory.id] }).then((res) =>
        res.products.filter((p) => p.id !== product.id).slice(0, 8)
      )
    : Promise.resolve([]);

  const collectionId = (product as { collection_id?: string | null }).collection_id;
  const [tree, brands, relatedProducts, compatibleItems] = await Promise.all([
    getCategoryTree(),
    getBrands(),
    relatedProductsPromise,
    getCompatibleProducts(product),
  ]);

  const trail = (firstCategory ? pathTo(tree, firstCategory.handle) : null)?.map((n) => ({ name: n.name, handle: n.handle })) ?? [];
  const brand = brands.find((b) => b.id === collectionId) ?? null;

  return (
    <>
      <Header />
      <main id="main" className="bg-page">
        <ProductDetailClient
          product={product}
          trail={trail}
          brand={brand}
          compatibleItems={compatibleItems}
        />

        {relatedProducts.length > 0 ? (
          <section aria-labelledby="related" className="mx-auto max-w-[1376px] px-4 pb-16 md:px-8">
            <div className="flex items-baseline justify-between gap-4">
              <h2 id="related" className="text-[22px] font-extrabold tracking-[-0.02em] text-navy">
                Related Category Hardware
              </h2>
              {trail.length ? (
                <Link
                  href={`/parts?category=${trail[trail.length - 1].handle}`}
                  className="text-[14px] font-semibold text-brand hover:text-navy"
                >
                  View full category &rarr;
                </Link>
              ) : null}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
              {relatedProducts.slice(0, 4).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        ) : null}
      </main>
      <Footer />
    </>
  );
}
