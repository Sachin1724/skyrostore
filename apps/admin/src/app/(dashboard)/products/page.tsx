import { getAuthToken } from "@/lib/auth";
import { getProducts } from "@/lib/data/admin";
import { redirect } from "next/navigation";

export const metadata = { title: "Products" };

export default async function ProductsPage() {
  const token = await getAuthToken();
  if (!token) redirect("/login");

  const { products, count } = await getProducts(token, { limit: 50 });

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900">Products</h1>
      <p className="mt-1 text-sm text-gray-500">{count} total</p>

      {products.length === 0 ? (
        <p className="mt-6 text-sm text-gray-500">No products found.</p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                <th className="pb-2 pr-4">Product</th>
                <th className="pb-2 pr-4">Handle</th>
                <th className="pb-2 pr-4">Status</th>
                <th className="pb-2 pr-4">Variants</th>
                <th className="pb-2 pr-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((product: Record<string, unknown>) => (
                <tr key={product.id as string}>
                  <td className="py-2.5 pr-4 font-medium">
                    <a
                      href={`/products/${product.id as string}`}
                      className="hover:underline text-gray-900"
                    >
                      {product.title as string}
                    </a>
                  </td>
                  <td className="py-2.5 pr-4 font-mono text-xs text-gray-500">
                    {product.handle as string}
                  </td>
                  <td className="py-2.5 pr-4">
                    <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                      {product.status as string}
                    </span>
                  </td>
                  <td className="py-2.5 pr-4 text-gray-500">
                    {(product.variants as unknown[])?.length ?? 0}
                  </td>
                  <td className="py-2.5 pr-4 text-right">
                    <a
                      href={`/products/${product.id as string}`}
                      className="rounded bg-gray-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-gray-800"
                    >
                      Edit Specs
                    </a>
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
