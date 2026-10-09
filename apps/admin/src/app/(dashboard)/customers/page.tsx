import { getAuthToken } from "@/lib/auth";
import { getCustomers } from "@/lib/data/admin";
import { redirect } from "next/navigation";

export const metadata = { title: "Customers" };

export default async function CustomersPage() {
  const token = await getAuthToken();
  if (!token) redirect("/login");

  const { customers, count } = await getCustomers(token);

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900">Customers</h1>
      <p className="mt-1 text-sm text-gray-500">{count} total</p>

      {customers.length === 0 ? (
        <p className="mt-6 text-sm text-gray-500">No customers yet.</p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                <th className="pb-2 pr-4">Name</th>
                <th className="pb-2 pr-4">Email</th>
                <th className="pb-2 pr-4">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {customers.map((c: Record<string, unknown>) => (
                <tr key={c.id as string}>
                  <td className="py-2.5 pr-4 font-medium">
                    {[c.first_name, c.last_name].filter(Boolean).join(" ") ||
                      "—"}
                  </td>
                  <td className="py-2.5 pr-4 text-gray-500">
                    {(c.email as string) || "—"}
                  </td>
                  <td className="py-2.5 pr-4 text-gray-500">
                    {new Date(c.created_at as string).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
