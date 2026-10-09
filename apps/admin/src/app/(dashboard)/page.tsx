import { getAuthToken } from "@/lib/auth";
import { getDashboardStats } from "@/lib/data/admin";
import { redirect } from "next/navigation";

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-gray-200 bg-white px-5 py-4">
      <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
    </div>
  );
}

export default async function DashboardPage() {
  const token = await getAuthToken();
  if (!token) redirect("/login");

  let stats;
  try {
    stats = await getDashboardStats(token);
  } catch {
    return (
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-error">
          Unable to connect to backend. Check that Medusa is running.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Orders" value={stats.totalOrders} />
        <StatCard label="Products" value={stats.totalProducts} />
        <StatCard label="Customers" value={stats.totalCustomers} />
        <StatCard label="Inventory Items" value={stats.totalInventoryItems} />
      </div>
    </div>
  );
}
