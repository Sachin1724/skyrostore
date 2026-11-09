import { getAuthToken } from "@/lib/auth";
import { getProduct, getCatalogOptions } from "@/lib/data/admin";
import { redirect, notFound } from "next/navigation";
import { ProductEditorClient } from "./product-editor-client";

export const metadata = { title: "Edit Product Specifications" };

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const token = await getAuthToken();
  if (!token) redirect("/login");

  const { id } = await params;

  let productData;
  try {
    productData = await getProduct(token, id);
  } catch (err) {
    console.error("Failed to load product for editing:", err);
    notFound();
  }

  const product = productData?.product;
  if (!product) notFound();

  const { categories, brands } = await getCatalogOptions(token);

  return (
    <div className="mx-auto max-w-5xl pb-16">
      <ProductEditorClient
        initialProduct={product}
        categories={categories}
        brands={brands}
        storefrontUrl={process.env.STOREFRONT_URL || "http://localhost:3000"}
      />
    </div>
  );
}
