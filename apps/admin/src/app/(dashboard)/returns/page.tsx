import { getAuthToken } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ReturnsView } from "./returns-view";

export const metadata = { title: "Returns" };

export default async function ReturnsPage() {
  if (!(await getAuthToken())) redirect("/login");
  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900">Returns</h1>
      <p className="mt-1 text-sm text-gray-500">Customer return/replacement requests, filed after delivery.</p>
      <ReturnsView />
    </div>
  );
}
