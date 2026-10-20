import { getAuthToken } from "@/lib/auth";
import { redirect } from "next/navigation";
import { BrandManager } from "./brand-manager";

export const metadata = { title: "Brands" };

export default async function BrandsPage() {
  if (!(await getAuthToken())) redirect("/login");
  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-semibold text-gray-900">Brands</h1>
      <p className="mt-1 text-sm text-gray-500">
        Companies you stock, such as T-Motor or Holybro. Assign a brand to each product; customers
        can then browse a company's products grouped by category.
      </p>
      <BrandManager />
    </div>
  );
}
