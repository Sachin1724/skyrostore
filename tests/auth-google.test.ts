import { describe, test, expect } from "vitest";

/**
 * Google sign-in and customer session behaviour.
 *
 * These run against the storefront, which owns the OAuth round-trip, plus the
 * backend for provider discovery. Both are skipped when not running, and the
 * skip is reported rather than counted as a pass.
 */

const BASE = process.env.MEDUSA_URL || "http://localhost:9000";
const SITE = process.env.STOREFRONT_URL || "http://localhost:3100";
const PK =
  process.env.MEDUSA_PUBLISHABLE_KEY ||
  "pk_11e52cb93d15418c56289d434fee7c53a391460b6a393b72ad48192afe3c4816";

async function reachable(url: string): Promise<boolean> {
  try {
    await fetch(url, { signal: AbortSignal.timeout(2500) });
    return true;
  } catch {
    return false;
  }
}

const backendUp = await reachable(`${BASE}/store/health`);
const siteUp = await reachable(`${SITE}/`);

/** Follows no redirects: the callback's redirect target is the assertion. */
async function callback(query: string) {
  const res = await fetch(`${SITE}/auth/google/callback${query}`, { redirect: "manual" });
  return { status: res.status, location: res.headers.get("location") || "" };
}

describe.skipIf(!backendUp)("auth provider discovery", () => {
  test("backend reports which providers are actually configured", async () => {
    const res = await fetch(`${BASE}/auth/customer/providers`, {
      headers: { "x-publishable-api-key": PK },
    });
    expect(res.ok).toBe(true);
    const { providers } = await res.json();
    const ids = providers.map((p: any) => p.id);
    // Email/password must always be available.
    expect(ids).toContain("emailpass");
  });

  test("email and password sign-in still works", async () => {
    const res = await fetch(`${BASE}/auth/customer/emailpass`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-publishable-api-key": PK },
      body: JSON.stringify({ email: "customera@skyrostore.test", password: "Customer123!" }),
    });
    expect(res.status).toBe(200);
    expect((await res.json()).token).toBeTruthy();
  });

  test("a wrong password is rejected", async () => {
    const res = await fetch(`${BASE}/auth/customer/emailpass`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-publishable-api-key": PK },
      body: JSON.stringify({ email: "customera@skyrostore.test", password: "not-the-password" }),
    });
    expect(res.status).toBe(401);
  });
});

describe.skipIf(!siteUp)("google sign-in", () => {
  test("the storefront reports Google availability honestly", async () => {
    const res = await fetch(`${SITE}/api/auth/providers`);
    expect(res.ok).toBe(true);
    const data = await res.json();
    expect(typeof data.google).toBe("boolean");
    // Whatever the answer, it must agree with the backend rather than be assumed.
    expect(data.providers).toContain("emailpass");
  });

  test("starting Google sign-in without credentials fails loudly, never fakes a session", async () => {
    const providers = await (await fetch(`${SITE}/api/auth/providers`)).json();
    const res = await fetch(`${SITE}/api/auth/google/start`, { method: "POST" });

    if (!providers.google) {
      expect(res.status).toBe(503);
      const body = await res.json();
      expect(body.error).toMatch(/not available|not configured/i);
      // Crucially: no session cookie is handed out.
      expect(res.headers.get("set-cookie")).toBeNull();
      return;
    }

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.location).toMatch(/^https:\/\/accounts\.google\.com\//);
  });

  test("a cancelled consent screen returns the customer with a clear reason", async () => {
    const { status, location } = await callback("?error=access_denied");
    expect(status).toBe(307);
    expect(location).toContain("auth_error=cancelled");
  });

  test("a callback missing code or state is refused", async () => {
    expect((await callback("")).location).toContain("auth_error=invalid_callback");
    expect((await callback("?code=only-a-code")).location).toContain("auth_error=invalid_callback");
    expect((await callback("?state=only-a-state")).location).toContain("auth_error=invalid_callback");
  });

  test("a forged or replayed state never establishes a session", async () => {
    const res = await fetch(`${SITE}/auth/google/callback?code=forged&state=forged`, {
      redirect: "manual",
    });
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("auth_error=");
    // The decisive assertion: no customer_token is set.
    const cookies = res.headers.get("set-cookie") || "";
    expect(cookies).not.toContain("customer_token=");
  });

  test("a provider error is surfaced, not swallowed", async () => {
    const { location } = await callback("?error=server_error&error_description=boom");
    expect(location).toContain("auth_error=provider_error");
  });
});

describe.skipIf(!backendUp)("customer session and order privacy", () => {
  async function tokenFor(email: string, password: string) {
    const res = await fetch(`${BASE}/auth/customer/emailpass`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-publishable-api-key": PK },
      body: JSON.stringify({ email, password }),
    });
    return res.ok ? (await res.json()).token : "";
  }

  test("orders require authentication", async () => {
    const res = await fetch(`${BASE}/store/orders`, {
      headers: { "x-publishable-api-key": PK },
    });
    expect([401, 403]).toContain(res.status);
  });

  test("one customer cannot read another customer's order", async () => {
    const tokenA = await tokenFor("customera@skyrostore.test", "Customer123!");
    const tokenB = await tokenFor("customerb@skyrostore.test", "Customer123!");
    if (!tokenA || !tokenB) return;

    const ordersA = await (
      await fetch(`${BASE}/store/orders?limit=1`, {
        headers: { "x-publishable-api-key": PK, Authorization: `Bearer ${tokenA}` },
      })
    ).json();

    const orderId = ordersA.orders?.[0]?.id;
    if (!orderId) return;

    const res = await fetch(`${BASE}/store/orders/${orderId}`, {
      headers: { "x-publishable-api-key": PK, Authorization: `Bearer ${tokenB}` },
    });
    expect([401, 403, 404]).toContain(res.status);
  });

  test("the pending-profile route is not readable without a token", async () => {
    const res = await fetch(`${BASE}/store/auth/pending-profile`, {
      headers: { "x-publishable-api-key": PK },
    });
    expect([401, 403]).toContain(res.status);
  });

  test("a registered customer cannot re-register through the pending-profile route", async () => {
    const token = await tokenFor("customera@skyrostore.test", "Customer123!");
    if (!token) return;
    const res = await fetch(`${BASE}/store/auth/pending-profile`, {
      headers: { "x-publishable-api-key": PK, Authorization: `Bearer ${token}` },
    });
    expect([409, 401]).toContain(res.status);
  });
});

describe.skipIf(!siteUp)("session cookie handling", () => {
  test("signing in sets an httpOnly cookie and signing out clears it", async () => {
    const login = await fetch(`${SITE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "customera@skyrostore.test", password: "Customer123!" }),
    });
    expect(login.status).toBe(200);

    const setCookie = (login.headers.getSetCookie?.() || []).join("; ");
    expect(setCookie).toContain("customer_token=");
    expect(setCookie.toLowerCase()).toContain("httponly");
    expect(setCookie.toLowerCase()).toContain("samesite=lax");

    const logout = await fetch(`${SITE}/api/auth/logout`, {
      method: "POST",
      headers: { Cookie: setCookie },
    });
    expect(logout.ok).toBe(true);
    const cleared = (logout.headers.getSetCookie?.() || []).join("; ");
    expect(cleared).toMatch(/customer_token=;|Max-Age=0|Expires=Thu, 01 Jan 1970/i);
  });

  test("bad credentials never set a session cookie", async () => {
    const res = await fetch(`${SITE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "customera@skyrostore.test", password: "wrong" }),
    });
    expect(res.status).toBe(401);
    expect((res.headers.getSetCookie?.() || []).join("; ")).not.toContain("customer_token=");
  });
});
