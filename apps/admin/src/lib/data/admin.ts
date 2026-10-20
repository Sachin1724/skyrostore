import { pathLabels, type Brand, type Category } from "@/lib/catalog";

const BASE_URL =process.env.NEXT_PUBLIC_MEDUSA_URL || "http://localhost:9000";

async function adminFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

export async function getAdminToken(email: string, password: string) {
  const data = await adminFetch("/auth/user/emailpass", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  return data.token as string;
}

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export async function getOrders(token: string, params?: { limit?: number; offset?: number }) {
  return adminFetch(
    `/admin/orders?limit=${params?.limit ?? 20}&offset=${params?.offset ?? 0}`,
    { headers: authHeaders(token) }
  );
}

export async function getProducts(
  token: string,
  params?: { limit?: number; offset?: number; category_id?: string; collection_id?: string; status?: string; q?: string }
) {
  const qs = new URLSearchParams({
    limit: String(params?.limit ?? 20),
    offset: String(params?.offset ?? 0),
    fields: "id,title,handle,status,thumbnail,*variants,*categories,*collection",
  });
  if (params?.category_id) qs.set("category_id", params.category_id);
  if (params?.collection_id) qs.set("collection_id", params.collection_id);
  if (params?.status) qs.set("status", params.status);
  if (params?.q) qs.set("q", params.q);
  return adminFetch(`/admin/products?${qs}`, { headers: authHeaders(token) });
}

/** Categories (with "A › B › C" path labels, sorted) and brands, for pickers and filters. */
export async function getCatalogOptions(token: string) {
  const [cats, brands] = await Promise.all([
    adminFetch("/admin/product-categories?limit=1000&fields=id,name,handle,is_active,parent_category_id,rank", {
      headers: authHeaders(token),
    }).catch(() => ({ product_categories: [] })),
    adminFetch("/admin/collections?limit=500&fields=id,title,handle,metadata", {
      headers: authHeaders(token),
    }).catch(() => ({ collections: [] })),
  ]);
  const categories = cats.product_categories as Category[];
  const labels = pathLabels(categories);
  return {
    categories: categories
      .map((c) => ({ id: c.id, name: labels.get(c.id) || c.name }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    brands: (brands.collections as Brand[])
      .map((b) => ({ id: b.id, name: b.title }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  };
}

export async function getProduct(token: string, id: string) {
  return adminFetch(`/admin/products/${id}?fields=%2Bcategories.id,%2Bcollection_id,%2Bimages.url`, {
    headers: authHeaders(token),
  });
}

export async function updateProduct(
  token: string,
  id: string,
  data: Record<string, unknown>
) {
  return adminFetch(`/admin/products/${id}`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(data),
  });
}

export async function getCustomers(token: string, params?: { limit?: number }) {
  return adminFetch(
    `/admin/customers?limit=${params?.limit ?? 20}`,
    { headers: authHeaders(token) }
  );
}

export async function getInventoryItems(token: string, params?: { limit?: number }) {
  return adminFetch(
    `/admin/inventory-items?limit=${params?.limit ?? 50}`,
    { headers: authHeaders(token) }
  );
}

export async function getDashboardStats(token: string) {
  const [orders, products, customers, inventory] = await Promise.all([
    getOrders(token, { limit: 1 }),
    getProducts(token, { limit: 1 }),
    getCustomers(token, { limit: 1 }),
    getInventoryItems(token, { limit: 1 }),
  ]);

  return {
    totalOrders: orders.count ?? 0,
    totalProducts: products.count ?? 0,
    totalCustomers: customers.count ?? 0,
    totalInventoryItems: inventory.count ?? 0,
  };
}
