import { redirect } from "next/navigation";
import { getAuthToken } from "@/lib/auth";
import { adminCall } from "@/lib/medusa-admin";

export const metadata = { title: "Subscribers" };

type Subscriber = { email: string; created_at: string };

export default async function SubscribersPage() {
  if (!(await getAuthToken())) redirect("/login");
  const res = await adminCall("GET", "/admin/newsletter");
  const subscribers: Subscriber[] = res.data?.subscribers ?? [];
  // A CSV the operator can open in Excel or import into an email tool; built here, no extra route.
  const csv = "email,signed_up\n" + subscribers.map((s) => `${s.email},${new Date(s.created_at).toISOString()}`).join("\n");

  return (
    <div className="max-w-3xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Subscribers</h1>
          <p className="mt-1 text-sm text-gray-500">
            People who signed up for restock alerts on the storefront home page. {subscribers.length} in total.
          </p>
        </div>
        {subscribers.length ? (
          <a
            href={`data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`}
            download="skyrostore-subscribers.csv"
            className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white"
          >
            Download CSV
          </a>
        ) : null}
      </div>

      {!res.ok ? (
        <p className="mt-6 text-sm text-red-600">Could not load subscribers ({res.status}).</p>
      ) : subscribers.length === 0 ? (
        <p className="mt-6 rounded border border-gray-200 p-4 text-sm text-gray-500">No one has signed up yet.</p>
      ) : (
        <table className="mt-6 w-full text-left text-sm">
          <thead className="border-b border-gray-200 text-gray-500">
            <tr>
              <th className="py-2 font-medium">Email</th>
              <th className="py-2 font-medium">Signed up</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {subscribers.map((s) => (
              <tr key={s.email}>
                <td className="py-2 text-gray-900">{s.email}</td>
                <td className="py-2 text-gray-600">{new Date(s.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
