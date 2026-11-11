import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthToken } from "@/lib/auth";
import { CustomerDetail } from "./customer-detail";

export const metadata = { title: "Customer" };

const BASE_URL = process.env.NEXT_PUBLIC_MEDUSA_URL || "http://localhost:9000";

export default async function CustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const token = await getAuthToken();
  if (!token) redirect("/login");

  const { id } = await params;
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  let customer: any = null;
  let orders: any[] = [];

  try {
    const [customerRes, ordersRes] = await Promise.all([
      fetch(
        `${BASE_URL}/admin/customers/${id}?fields=id,email,first_name,last_name,phone,company_name,has_account,created_at,addresses.*`,
        { headers, cache: "no-store" }
      ),
      fetch(
        `${BASE_URL}/admin/orders?customer_id=${id}&limit=50&fields=id,display_id,status,total,currency_code,created_at,payment_status,fulfillment_status`,
        { headers, cache: "no-store" }
      ),
    ]);
    if (customerRes.ok) customer = (await customerRes.json()).customer;
    if (ordersRes.ok) orders = (await ordersRes.json()).orders || [];
  } catch {
    customer = null;
  }

  if (!customer) {
    return (
      <div>
        <Link href="/customers" className="text-xs text-gray-500 hover:underline">
          &larr; Customers
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-gray-900">Customer not available</h1>
        <p className="mt-1 text-sm text-rose-700">
          This customer could not be loaded. They may have been deleted, or the backend is
          unreachable.
        </p>
      </div>
    );
  }

  return (
    <div>
      <Link href="/customers" className="text-xs text-gray-500 hover:underline">
        &larr; Customers
      </Link>
      <CustomerDetail customer={customer} orders={orders} />
    </div>
  );
}
