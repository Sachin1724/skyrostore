import { describe, it, expect, beforeEach, vi } from "vitest";

/**
 * Exercises the storefront tracking module with stubbed browser globals, so the
 * payload contract is checked against what the collector accepts without
 * needing a real browser.
 */

type Beacon = { url: string; body: any };

const beacons: Beacon[] = [];
const fetches: Beacon[] = [];

function makeStorage(): Storage {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => (map.has(k) ? (map.get(k) as string) : null),
    setItem: (k: string, v: string) => void map.set(k, String(v)),
    removeItem: (k: string) => void map.delete(k),
    clear: () => map.clear(),
    key: (i: number) => Array.from(map.keys())[i] ?? null,
    get length() {
      return map.size;
    },
  } as Storage;
}

function installBrowser(search = "") {
  const listeners: Record<string, Array<() => void>> = {};
  (globalThis as any).window = {
    location: { pathname: "/products/skyrox4", search },
    localStorage: makeStorage(),
    sessionStorage: makeStorage(),
    addEventListener: (type: string, fn: () => void) => {
      (listeners[type] ||= []).push(fn);
    },
  };
  (globalThis as any).localStorage = (globalThis as any).window.localStorage;
  (globalThis as any).sessionStorage = (globalThis as any).window.sessionStorage;
  (globalThis as any).document = {
    referrer: "https://example.com/campaign",
    visibilityState: "visible",
    addEventListener: () => undefined,
  };
  // `navigator` is a getter on globalThis in modern Node, so it must be redefined.
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    writable: true,
    value: {
      sendBeacon: (url: string, blob: any) => {
        beacons.push({ url, body: JSON.parse(blob.__body) });
        return true;
      },
    },
  });
  (globalThis as any).Blob = class {
    __body: string;
    type: string;
    constructor(parts: string[], options?: { type?: string }) {
      this.__body = parts.join("");
      this.type = options?.type || "";
    }
  };
  (globalThis as any).fetch = vi.fn(async (url: string, init?: any) => {
    fetches.push({ url, body: JSON.parse(init?.body || "{}") });
    return { ok: true } as any;
  });
}

async function loadModule() {
  vi.resetModules();
  return import("../apps/storefront/src/lib/analytics");
}

describe("storefront tracking module", () => {
  beforeEach(() => {
    beacons.length = 0;
    fetches.length = 0;
  });

  it("sends a batch to the same-origin collector via sendBeacon", async () => {
    installBrowser();
    const { track, flush } = await loadModule();

    track("product_viewed", { product_id: "prod_1", variant_id: "var_1", value: 8999900, currency_code: "inr" });
    flush();

    expect(beacons).toHaveLength(1);
    expect(beacons[0].url).toBe("/api/analytics");
    const [event] = beacons[0].body.events;
    expect(event.event_type).toBe("product_viewed");
    expect(event.product_id).toBe("prod_1");
    expect(event.page_path).toBe("/products/skyrox4");
    expect(event.session_id).toMatch(/^ses_/);
    expect(event.visitor_id).toMatch(/^vis_/);
    expect(event.event_key).toMatch(/^evk_/);
    expect(new Date(event.occurred_at).getTime()).toBeGreaterThan(0);
  });

  it("gives every event a distinct idempotency key", async () => {
    installBrowser();
    const { track, flush } = await loadModule();

    track("product_viewed", { product_id: "a" });
    track("product_viewed", { product_id: "b" });
    flush();

    const keys = beacons[0].body.events.map((e: any) => e.event_key);
    expect(new Set(keys).size).toBe(2);
  });

  it("captures UTM parameters and reuses them for later events in the session", async () => {
    installBrowser("?utm_source=newsletter&utm_medium=email&utm_campaign=diwali");
    const { track, flush } = await loadModule();

    track("session_started");
    (globalThis as any).window.location.search = "";
    track("product_viewed", { product_id: "prod_1" });
    flush();

    for (const event of beacons[0].body.events) {
      expect(event.utm_source).toBe("newsletter");
      expect(event.utm_medium).toBe("email");
      expect(event.utm_campaign).toBe("diwali");
    }
  });

  it("emits session_started only once per session", async () => {
    installBrowser();
    const { trackSessionStart, flush } = await loadModule();

    trackSessionStart();
    trackSessionStart();
    flush();

    const started = (beacons[0]?.body.events || []).filter((e: any) => e.event_type === "session_started");
    expect(started).toHaveLength(1);
  });

  it("reuses one session id across events and keeps the visitor id stable", async () => {
    installBrowser();
    const { track, flush } = await loadModule();

    track("product_viewed", { product_id: "a" });
    track("product_added_to_cart", { product_id: "a", quantity: 2 });
    flush();

    const events = beacons[0].body.events;
    expect(new Set(events.map((e: any) => e.session_id)).size).toBe(1);
    expect(new Set(events.map((e: any) => e.visitor_id)).size).toBe(1);
  });

  it("flushes automatically once the batch cap is reached", async () => {
    installBrowser();
    const { track } = await loadModule();

    for (let i = 0; i < 20; i++) {
      track("product_viewed", { product_id: `prod_${i}` });
    }

    expect(beacons).toHaveLength(1);
    expect(beacons[0].body.events).toHaveLength(20);
  });

  it("falls back to keepalive fetch when sendBeacon is unavailable", async () => {
    installBrowser();
    (globalThis as any).navigator.sendBeacon = undefined;
    const { track, flush } = await loadModule();

    track("product_viewed", { product_id: "prod_1" });
    flush();

    expect(beacons).toHaveLength(0);
    expect(fetches).toHaveLength(1);
    expect(fetches[0].url).toBe("/api/analytics");
  });

  it("never throws when storage is blocked", async () => {
    installBrowser();
    const blocked = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    };
    (globalThis as any).window.localStorage = blocked;
    (globalThis as any).window.sessionStorage = blocked;
    const { track, flush } = await loadModule();

    expect(() => {
      track("product_viewed", { product_id: "prod_1" });
      flush();
    }).not.toThrow();
  });
});
