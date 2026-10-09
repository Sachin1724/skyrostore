import { getAuthToken } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { BulkOrderWorkbench } from "./bulk-order-workbench";

export const metadata = { title: "Manage Bulk Order Quotation | Admin" };

const BASE_URL = process.env.NEXT_PUBLIC_MEDUSA_URL || "http://localhost:9000";

export default async function AdminBulkOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const token = await getAuthToken();
  if (!token) redirect("/login");

  const { id } = await params;

  let requestData = null;
  try {
    const res = await fetch(`${BASE_URL}/admin/bulk-orders/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (res.status === 404) notFound();

    if (res.ok) {
      const data = await res.json();
      requestData = data.request;
    }
  } catch (err) {
    console.error("Failed to fetch admin bulk order:", err);
  }

  if (!requestData) notFound();

  return (
    <div className="mx-auto max-w-5xl pb-16">
      <BulkOrderWorkbench initialRequest={requestData} />
    </div>
  );
}
