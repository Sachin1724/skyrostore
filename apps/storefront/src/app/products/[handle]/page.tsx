import { notFound } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { getProductByHandle, getProducts } from "@/lib/data/products";
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

  // Fetch 4 related products for the bottom slider
  const { products: allProducts } = await getProducts({ limit: 6 });
  const relatedProducts = allProducts.filter((p) => p.id !== product.id).slice(0, 4);

  return (
    <>
      <Header />
      <main>
        <ProductDetailClient product={product} relatedProducts={relatedProducts} />
      </main>
      <Footer />
    </>
  );
}
