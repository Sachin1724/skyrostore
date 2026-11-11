import { getAuthToken } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PromotionManager } from "./promotion-manager";

export const metadata = { title: "Promotions" };

export default async function PromotionsPage() {
  if (!(await getAuthToken())) redirect("/login");
  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-semibold text-gray-900">Promotions</h1>
      <p className="mt-1 text-sm text-gray-500">
        Discount codes customers enter at checkout. A code is active the moment it's created.
      </p>
      <PromotionManager />
    </div>
  );
}
