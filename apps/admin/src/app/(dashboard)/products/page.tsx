import { getAuthToken } from "@/lib/auth";
import { getProducts, getCatalogOptions } from "@/lib/data/admin";
import { redirect } from "next/navigation";
import { VisibilityToggle } from "./visibility-toggle";

export const metadata = { title: "Products" };

type Search = { category?: string; brand?: string; status?: string; q?: string; low_stock?: string };

const LOW_STOCK_THRESHOLD = 5;

function totalStock(product: Record<string, unknown>): number {
  const variants = (product.variants as { inventory_quantity?: number }[]) || [];
  return variants.reduce((sum, v) => sum + (v.inventory_quantity ?? 0), 0);
}

const SELECT = "rounded border border-gray-300 bg-white px-2 py-1 text-xs";

export default async function ProductsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const token = await getAuthToken();
  if (!token) redirect("/login");

  const filters = await searchParams;
  const [{ products, count }, { categories, brands }] = await Promise.all([
    getProducts(token, {
      limit: 50,
      category_id: filters.category,
      collection_id: filters.brand,
      status: filters.status,
      q: filters.q,
    }),
    getCatalogOptions(token),
  ]);
  const categoryName = new Map(categories.map((c) => [c.id, c.name]));
  const filtered = Boolean(filters.category || filters.brand || filters.status || filters.q || filters.low_stock);
  const visible = filters.low_stock ? products.filter((p: Record<string, unknown>) => totalStock(p) <= LOW_STOCK_THRESHOLD) : products;

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Products</h1>
          <p className="mt-1 text-sm text-gray-500">{count} {filtered ? "matching" : "total"}</p>
        </div>
        <a
          href="/products/new"
          className="rounded bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-800"
        >
          New product
        </a>
      </div>

      <form method="get" className="mt-4 flex flex-wrap items-center gap-2">
        <input name="q" defaultValue={filters.q} placeholder="Search products" className={`${SELECT} w-48`} />
        <select name="category" defaultValue={filters.category || ""} className={SELECT}>
          <option value="">All categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select name="brand" defaultValue={filters.brand || ""} className={SELECT}>
          <option value="">All brands</option>
          {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <select name="status" defaultValue={filters.status || ""} className={SELECT}>
          <option value="">Any visibility</option>
          <option value="published">Visible</option>
          <option value="draft">Hidden</option>
        </select>
        <button type="submit" className="rounded bg-gray-900 px-3 py-1 text-xs font-semibold text-white">Filter</button>
        {filtered ? <a href="/products" className="text-xs text-gray-500 hover:underline">Clear</a> : null}
      </form>

      <div className="mt-2 flex gap-2">
        <a
          href={filters.low_stock ? "/products" : "/products?low_stock=1"}
          className={`rounded border px-2.5 py-1 text-xs font-medium ${
            filters.low_stock ? "border-amber-400 bg-amber-100 text-amber-900" : "border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          Low stock (≤{LOW_STOCK_THRESHOLD})
        </a>
      </div>

      {visible.length === 0 ? (
        <p className="mt-6 text-sm text-gray-500">No products found.</p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                <th className="pb-2 pr-4 w-12"></th>
                <th className="pb-2 pr-4">Product</th>
                <th className="pb-2 pr-4">Category</th>
                <th className="pb-2 pr-4">Brand</th>
                <th className="pb-2 pr-4 text-right">Stock</th>
                <th className="pb-2 pr-4">Customer visibility</th>
                <th className="pb-2 pr-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {visible.map((product: Record<string, unknown>) => {
                const cats = (product.categories as { id: string }[]) || [];
                const brand = (product.collection as { id: string; title: string } | null) || null;
                const stock = totalStock(product);
                return (
                  <tr key={product.id as string}>
                    <td className="py-2.5 pr-4">
                      {product.thumbnail ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={product.thumbnail as string} alt="" className="h-9 w-9 rounded border border-gray-200 object-contain" />
                      ) : (
                        <div className="h-9 w-9 rounded border border-dashed border-gray-300" title="No image" />
                      )}
                    </td>
                    <td className="py-2.5 pr-4 font-medium">
                      <a href={`/products/${product.id as string}`} className="hover:underline text-gray-900">
                        {product.title as string}
                      </a>
                      <div className="font-mono text-[11px] font-normal text-gray-400">{product.handle as string}</div>
                    </td>
                    <td className="py-2.5 pr-4 text-xs text-gray-600">
                      {cats.length ? cats.map((c) => categoryName.get(c.id) || "—").join(", ") : <span className="text-gray-400">None</span>}
                    </td>
                    <td className="py-2.5 pr-4 text-xs text-gray-600">
                      {brand ? brand.title : <span className="text-gray-400">None</span>}
                    </td>
                    <td className={`py-2.5 pr-4 text-right font-medium ${stock <= LOW_STOCK_THRESHOLD ? "text-amber-700" : "text-gray-700"}`}>
                      {stock}
                    </td>
                    <td className="py-2.5 pr-4">
                      <VisibilityToggle id={product.id as string} status={product.status as string} />
                    </td>
                    <td className="py-2.5 pr-4 text-right">
                      <a
                        href={`/products/${product.id as string}`}
                        className="rounded bg-gray-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-gray-800"
                      >
                        Edit
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
