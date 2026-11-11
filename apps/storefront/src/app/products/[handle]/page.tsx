import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { getProductByHandle, getProducts } from "@/lib/data/products";
import { getCategoryTree, getBrands, pathTo } from "@/lib/data/catalog";
import { getCompatibleProducts } from "@/lib/data/compatible-products";
import { ProductRail } from "@/components/home/product-rail";
import { ProductDetailClient } from "./product-detail-client";
import { getSiteSettings } from "@/lib/data/site-settings";

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
      title: `${product.title?.replace("[DEV] ", "")}`,
      description: product.description || product.subtitle || "Professional UAV component with verified engineering specifications.",
    };
  } catch (err) {
    console.error("generateMetadata error:", err);
    return { title: "Product" };
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
  const [tree, brands, relatedProducts, compatibleItems, { offers }] = await Promise.all([
    getCategoryTree(),
    getBrands(),
    relatedProductsPromise,
    getCompatibleProducts(product),
    getSiteSettings(),
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
          offers={offers}
        />

        <div className="mx-auto max-w-[1760px] px-4 pb-16 md:px-8">
          <ProductRail
            title="Customers also viewed"
            href={trail.length ? `/parts?category=${trail[trail.length - 1].handle}` : "/parts"}
            products={relatedProducts}
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
