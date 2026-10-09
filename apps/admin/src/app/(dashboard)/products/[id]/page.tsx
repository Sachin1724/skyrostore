import { getAuthToken } from "@/lib/auth";
import { getProduct } from "@/lib/data/admin";
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

  return (
    <div className="mx-auto max-w-5xl pb-16">
      <ProductEditorClient initialProduct={product} />
    </div>
  );
}
