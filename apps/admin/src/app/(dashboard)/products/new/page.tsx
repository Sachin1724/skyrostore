import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthToken } from "@/lib/auth";
import { getCatalogOptions } from "@/lib/data/admin";
import { NewProductForm } from "./new-product-form";

export const metadata = { title: "New product" };

export default async function NewProductPage() {
  const token = await getAuthToken();
  if (!token) redirect("/login");

  const { categories, brands } = await getCatalogOptions(token);

  return (
    <div>
      <Link href="/products" className="text-xs text-gray-500 hover:underline">
        &larr; Products
      </Link>
      <h1 className="mt-2 text-xl font-semibold text-gray-900">New product</h1>
      <p className="mt-1 text-sm text-gray-500">
        Creates the product with one &ldquo;Standard&rdquo; variant, a price, and the default sales
        channel, so it can appear on the storefront immediately.
      </p>
      <NewProductForm categories={categories} brands={brands} />
    </div>
  );
}
