import { redirect } from "next/navigation";
import { getAuthToken, getOperatorEmail } from "@/lib/auth";
import { adminCall } from "@/lib/medusa-admin";
import { getFulfilmentOrders } from "@/lib/data/fulfilment";
import type { NavCounts } from "@/components/layout/sidebar";
import { AdminShell } from "@/components/layout/admin-shell";

async function getNavCounts(token: string): Promise<NavCounts> {
  const [orders, bulk, moderation, returns] = await Promise.all([
    getFulfilmentOrders(token, { limit: 1 }).catch(() => null),
    adminCall("GET", "/admin/bulk-orders?status=SUBMITTED&limit=1").catch(() => null),
    adminCall("GET", "/admin/moderation").catch(() => null),
    adminCall("GET", "/admin/returns?status=REQUESTED").catch(() => null),
  ]);
  return {
    ordersAwaiting: orders?.counts_by_state?.paid_processing ?? 0,
    bulkSubmitted: bulk?.data?.count ?? 0,
    moderationPending: (moderation?.data?.pending_reviews ?? 0) + (moderation?.data?.pending_questions ?? 0),
    returnsPending: returns?.data?.count ?? 0,
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
    <AdminShell counts={counts} storefrontUrl={process.env.STOREFRONT_URL || "http://localhost:3000"} operatorEmail={operatorEmail}>
      {children}
    </AdminShell>
  );
}
