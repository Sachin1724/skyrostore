const BASE_URL = process.env.NEXT_PUBLIC_MEDUSA_URL || "http://localhost:9000";

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

export async function getProducts(token: string, params?: { limit?: number; offset?: number }) {
  return adminFetch(
    `/admin/products?limit=${params?.limit ?? 20}&offset=${params?.offset ?? 0}`,
    { headers: authHeaders(token) }
  );
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
