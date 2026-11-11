import Link from "next/link";
import { getAuthToken } from "@/lib/auth";
import { redirect } from "next/navigation";
import { adminCall } from "@/lib/medusa-admin";

export const metadata = { title: "Support" };

// There is no separate support-ticket system — every customer query that needs
// a reply already lives in one of two real queues, so this links to them
// instead of a parallel inbox that would just go stale.
export default async function SupportPage() {
  if (!(await getAuthToken())) redirect("/login");

  const [moderation, bulkOrders] = await Promise.all([
    adminCall("GET", "/admin/moderation"),
    adminCall("GET", "/admin/bulk-orders?status=SUBMITTED&limit=1"),
  ]);

  const pendingQuestions = moderation.data?.pending_questions ?? 0;
  const pendingReviews = moderation.data?.pending_reviews ?? 0;
  const awaitingQuote = bulkOrders.data?.count ?? 0;

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900">Support</h1>
      <p className="mt-1 text-sm text-gray-500">
        Customer queries route through two queues below — there is no separate ticket inbox.
      </p>

      <div className="mt-6 grid max-w-2xl gap-4 sm:grid-cols-2">
        <Link href="/moderation" className="rounded border border-gray-200 p-4 hover:border-gray-400">
          <p className="text-2xl font-semibold text-gray-900">{pendingQuestions}</p>
          <p className="text-sm text-gray-600">product questions awaiting an answer</p>
          {pendingReviews > 0 && <p className="mt-1 text-xs text-gray-400">+ {pendingReviews} reviews pending approval</p>}
        </Link>
        <Link href="/bulk-orders" className="rounded border border-gray-200 p-4 hover:border-gray-400">
          <p className="text-2xl font-semibold text-gray-900">{awaitingQuote}</p>
          <p className="text-sm text-gray-600">bulk order requests awaiting a quote</p>
        </Link>
      </div>
    </div>
  );
}
