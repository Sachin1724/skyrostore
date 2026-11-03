import { notFound } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { getProductByHandle, getProducts } from "@/lib/data/products";
import { getCategoryTree, getBrands, pathTo } from "@/lib/data/catalog";
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
  const relatedProducts = firstCategory
    ? (await getProducts({ limit: 5, category_id: [firstCategory.id] })).products.filter((p) => p.id !== product.id).slice(0, 4)
    : [];
  const collectionId = (product as { collection_id?: string | null }).collection_id;
  const [tree, brands] = await Promise.all([getCategoryTree(), getBrands()]);
  const trail = (firstCategory ? pathTo(tree, firstCategory.handle) : null)?.map((n) => ({ name: n.name, handle: n.handle })) ?? [];
  const brand = brands.find((b) => b.id === collectionId) ?? null;

  return (
    <>
      <Header />
      <main id="main">
        <ProductDetailClient product={product} relatedProducts={relatedProducts} trail={trail} brand={brand} />
      </main>
      <Footer />
    </>
  );
}
