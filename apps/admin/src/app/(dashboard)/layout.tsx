import { redirect } from "next/navigation";
import { getAuthToken, getOperatorEmail } from "@/lib/auth";
import { adminCall } from "@/lib/medusa-admin";
import { getFulfilmentOrders } from "@/lib/data/fulfilment";
import { AdminSidebar, type NavCounts } from "@/components/layout/sidebar";
import { AdminTopBar } from "@/components/layout/topbar";

async function getNavCounts(token: string): Promise<NavCounts> {
  const [orders, bulk, moderation] = await Promise.all([
    getFulfilmentOrders(token, { limit: 1 }).catch(() => null),
    adminCall("GET", "/admin/bulk-orders?status=SUBMITTED&limit=1").catch(() => null),
    adminCall("GET", "/admin/moderation").catch(() => null),
  ]);
  return {
    ordersAwaiting: orders?.counts_by_state?.paid_processing ?? 0,
    bulkSubmitted: bulk?.data?.count ?? 0,
    moderationPending: (moderation?.data?.pending_reviews ?? 0) + (moderation?.data?.pending_questions ?? 0),
  };
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = await getAuthToken();
  if (!token) redirect("/login");

  const [counts, operatorEmail] = await Promise.all([getNavCounts(token), getOperatorEmail()]);

  return (
    <div className="flex h-screen">
      <AdminSidebar counts={counts} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminTopBar storefrontUrl={process.env.STOREFRONT_URL || "http://localhost:3000"} operatorEmail={operatorEmail} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
