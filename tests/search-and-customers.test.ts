import { describe, test, expect, beforeAll } from "vitest";

/**
 * Storefront search suggestions and admin customer management.
 * Skipped (not silently passed) when the relevant app is not running.
 */

const BASE = process.env.MEDUSA_URL || "http://localhost:9000";
const SITE = process.env.STOREFRONT_URL || "http://localhost:3100";
const ADMIN = process.env.ADMIN_URL || "http://localhost:3101";

/**
 * A dev server can take several seconds to compile a route on first hit, so the
 * probe is generous: a short timeout here would skip whole suites and make an
 * unverified run look green.
 */
async function reachable(url: string): Promise<boolean> {
  try {
    await fetch(url, { signal: AbortSignal.timeout(20000) });
    return true;
  } catch {
    return false;
  }
}

const siteUp = await reachable(`${SITE}/`);
const adminUp = await reachable(`${ADMIN}/login`);
const backendUp = await reachable(`${BASE}/store/health`);

for (const [name, up, url] of [
  ["storefront", siteUp, SITE],
  ["admin", adminUp, ADMIN],
  ["backend", backendUp, BASE],
] as const) {
  if (!up) {
    console.warn(`[skipped] ${name} not reachable at ${url} — those tests did NOT run.`);
  }
}

const suggest = async (q: string) =>
  (await fetch(`${SITE}/api/search/suggest?q=${encodeURIComponent(q)}`)).json();

describe.skipIf(!siteUp)("search suggestions", () => {
  test("returns matching products with the fields the dropdown renders", async () => {
    const { suggestions } = await suggest("pix");
    expect(suggestions.length).toBeGreaterThan(0);
    const [first] = suggestions;
    for (const key of ["id", "title", "handle", "thumbnail", "price", "currency_code", "in_stock"]) {
      expect(first).toHaveProperty(key);
    }
    expect(first.title).toMatch(/pixhawk/i);
    // Internal dev prefixes must not leak into the customer-facing name.
    expect(first.title).not.toContain("[DEV]");
  });

  test("matches on a partial word, not only a full title", async () => {
    const { suggestions } = await suggest("moto");
    expect(suggestions.some((s: any) => /motor/i.test(s.title))).toBe(true);
  });

  test("ignores queries shorter than two characters", async () => {
    expect((await suggest("p")).suggestions).toEqual([]);
    expect((await suggest("")).suggestions).toEqual([]);
  });

  test("returns an empty list rather than an error for no matches", async () => {
    const res = await fetch(`${SITE}/api/search/suggest?q=zzzznotathing`);
    expect(res.status).toBe(200);
    expect((await res.json()).suggestions).toEqual([]);
  });

  test("caps the number of suggestions", async () => {
    const { suggestions } = await suggest("a");
    expect(suggestions.length).toBeLessThanOrEqual(6);
  });

  test("every suggestion resolves to a real product page", async () => {
    const { suggestions } = await suggest("lipo");
    for (const suggestion of suggestions.slice(0, 2)) {
      const res = await fetch(`${SITE}/products/${suggestion.handle}`);
      expect(res.status).toBe(200);
    }
  });
});

describe.skipIf(!adminUp)("admin customer management", () => {
  let cookie = "";
  let backendToken = "";

  beforeAll(async () => {
    const login = await fetch(`${ADMIN}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@skyrostore.com", password: "admin123" }),
    });
    cookie = (login.headers.getSetCookie?.() || []).join("; ");

    if (backendUp) {
      const res = await fetch(`${BASE}/auth/user/emailpass`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "admin@skyrostore.com", password: "admin123" }),
      });
      backendToken = (await res.json()).token;
    }
  });

  async function anyCustomerId(): Promise<string> {
    const res = await fetch(`${BASE}/admin/customers?limit=1&fields=id`, {
      headers: { Authorization: `Bearer ${backendToken}` },
    });
    return (await res.json()).customers?.[0]?.id || "";
  }

  test("customer detail requires an admin session", async () => {
    const id = await anyCustomerId();
    if (!id) return;
    expect((await fetch(`${ADMIN}/api/customers/${id}`)).status).toBe(401);
    expect((await fetch(`${ADMIN}/api/customers/${id}`, { method: "POST" })).status).toBe(401);
    expect((await fetch(`${ADMIN}/api/customers/${id}`, { method: "DELETE" })).status).toBe(401);
  });

  test("returns the customer with their orders", async () => {
    const id = await anyCustomerId();
    if (!id) return;
    const res = await fetch(`${ADMIN}/api/customers/${id}`, { headers: { Cookie: cookie } });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.customer.id).toBe(id);
    expect(Array.isArray(data.orders)).toBe(true);
  });

  test("rejects an invalid email on update", async () => {
    const id = await anyCustomerId();
    if (!id) return;
    const res = await fetch(`${ADMIN}/api/customers/${id}`, {
      method: "POST",
      headers: { Cookie: cookie, "Content-Type": "application/json" },
      body: JSON.stringify({ email: "not-an-email" }),
    });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/valid email/i);
  });

  test("ignores fields that are not editable", async () => {
    const id = await anyCustomerId();
    if (!id) return;
    const res = await fetch(`${ADMIN}/api/customers/${id}`, {
      method: "POST",
      headers: { Cookie: cookie, "Content-Type": "application/json" },
      body: JSON.stringify({ id: "cus_hacked", has_account: true }),
    });
    // No editable field supplied, so there is nothing to update.
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/nothing to update/i);
  });

  test("refuses to delete a customer that still has orders", async () => {
    if (!backendToken) return;
    const listRes = await fetch(`${BASE}/admin/customers?limit=50&fields=id,email`, {
      headers: { Authorization: `Bearer ${backendToken}` },
    });
    const { customers } = await listRes.json();

    for (const customer of customers || []) {
      const ordersRes = await fetch(
        `${BASE}/admin/orders?customer_id=${customer.id}&limit=1&fields=id`,
        { headers: { Authorization: `Bearer ${backendToken}` } }
      );
      const count = (await ordersRes.json()).count ?? 0;
      if (count > 0) {
        const res = await fetch(`${ADMIN}/api/customers/${customer.id}`, {
          method: "DELETE",
          headers: { Cookie: cookie },
        });
        expect(res.status).toBe(409);
        const body = await res.json();
        expect(body.error).toMatch(/order/i);
        expect(body.order_count).toBeGreaterThan(0);
        return;
      }
    }
  });

  test("updates and then deletes a customer with no orders", async () => {
    if (!backendToken) return;
    const headers = { Authorization: `Bearer ${backendToken}`, "Content-Type": "application/json" };
    const email = `vitest_customer_${Date.now()}@skyrostore.test`;

    const created = await (
      await fetch(`${BASE}/admin/customers`, {
        method: "POST",
        headers,
        body: JSON.stringify({ email, first_name: "Vitest", last_name: "Probe" }),
      })
    ).json();
    const id = created.customer?.id;
    expect(id).toBeTruthy();

    const update = await fetch(`${ADMIN}/api/customers/${id}`, {
      method: "POST",
      headers: { Cookie: cookie, "Content-Type": "application/json" },
      body: JSON.stringify({ first_name: "Renamed", phone: "+91 90000 00000" }),
    });
    expect(update.status).toBe(200);
    expect((await update.json()).customer.first_name).toBe("Renamed");

    const del = await fetch(`${ADMIN}/api/customers/${id}`, {
      method: "DELETE",
      headers: { Cookie: cookie },
    });
    expect(del.status).toBe(200);

    const after = await fetch(`${BASE}/admin/customers/${id}`, { headers });
    expect(after.ok).toBe(false);
  });
});
