import { getAuthToken } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CategoryManager } from "./category-manager";

export const metadata = { title: "Categories" };

export default async function CategoriesPage() {
  if (!(await getAuthToken())) redirect("/login");
  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-semibold text-gray-900">Categories</h1>
      <p className="mt-1 text-sm text-gray-500">
        Build the shop's structure, for example Motors › Brushless › Outrunner. Customers browse
        it level by level. Hidden categories disappear from the storefront.
      </p>
      <CategoryManager />
    </div>
  );
}
