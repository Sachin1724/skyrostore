#!/usr/bin/env node
/**
 * Load test for the Skyrostore customer journey.
 *
 * Drives real HTTP against a running stack and reports latency percentiles and
 * error rates per step, so a slow path can be identified rather than guessed
 * at. Read-only by default: carts are created and abandoned, no order is
 * placed and no payment is attempted unless --checkout is passed.
 *
 *   node scripts/load-test.mjs --users 1000 --duration 60
 *   node scripts/load-test.mjs --users 200 --duration 30 --site http://localhost:3100
 *
 * Flags:
 *   --users N       concurrent virtual customers (default 100)
 *   --duration N    seconds to sustain the load (default 30)
 *   --rampup N      seconds to reach full concurrency (default 10)
 *   --site URL      storefront base (default http://localhost:3100)
 *   --api URL       backend base (default http://localhost:9100)
 *   --checkout      also create carts and add items (writes to the database)
 */

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : fallback;
};
const has = (name) => args.includes(`--${name}`);

const USERS = Number(flag("users", 100));
const DURATION_MS = Number(flag("duration", 30)) * 1000;
const RAMPUP_MS = Number(flag("rampup", 10)) * 1000;
const SITE = flag("site", "http://localhost:3100");
const API = flag("api", "http://localhost:9100");
const PK = process.env.MEDUSA_PUBLISHABLE_KEY || "";
const DO_CHECKOUT = has("checkout");

const steps = new Map();

function record(step, ms, ok, status) {
  let s = steps.get(step);
  if (!s) {
    s = { samples: [], ok: 0, failed: 0, statuses: new Map() };
    steps.set(step, s);
  }
  s.samples.push(ms);
  ok ? s.ok++ : s.failed++;
  s.statuses.set(status, (s.statuses.get(status) || 0) + 1);
}

async function timed(step, run) {
  const started = performance.now();
  let status = 0;
  try {
    const res = await run();
    status = res?.status ?? 200;
    const ok = status >= 200 && status < 400;
    record(step, performance.now() - started, ok, status);
    return res;
  } catch (err) {
    record(step, performance.now() - started, false, err?.name === "TimeoutError" ? "timeout" : "error");
    return null;
  }
}

const get = (url) => fetch(url, { signal: AbortSignal.timeout(30000) });
const postJson = (url, body) =>
  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30000),
  });

/** One virtual customer: browse, search, open a product, optionally fill a cart. */
async function journey(handles, variants, sessionId) {
  await timed("homepage", () => get(`${SITE}/`));
  await timed("catalogue", () => get(`${SITE}/parts`));

  const term = ["pix", "motor", "lipo", "frame", "gps"][Math.floor(Math.random() * 5)];
  await timed("search_suggest", () => get(`${SITE}/api/search/suggest?q=${term}`));

  const handle = handles[Math.floor(Math.random() * handles.length)];
  await timed("product_page", () => get(`${SITE}/products/${handle}`));

  await timed("analytics_beacon", () =>
    postJson(`${SITE}/api/analytics`, {
      events: [
        {
          event_type: "product_viewed",
          event_key: `load_${sessionId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          session_id: sessionId,
          page_path: `/products/${handle}`,
        },
      ],
    })
  );

  if (DO_CHECKOUT && variants.length) {
    const variantId = variants[Math.floor(Math.random() * variants.length)];
    const res = await timed("cart_add", () =>
      postJson(`${SITE}/api/cart/add`, { cart_id: null, variant_id: variantId, quantity: 1 })
    );
    const cartId = res && res.ok ? (await res.json().catch(() => ({})))?.cart_id : null;
    if (cartId) {
      await timed("cart_view", () => get(`${SITE}/api/cart?id=${cartId}`));
    }
  }
}

function percentile(sorted, p) {
  if (!sorted.length) return 0;
  const index = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[index];
}

function report(elapsedMs) {
  let totalRequests = 0;
  let totalFailed = 0;

  console.log(
    `\n${"STEP".padEnd(18)}${"REQS".padStart(7)}${"FAIL".padStart(7)}${"p50".padStart(9)}${"p95".padStart(9)}${"p99".padStart(9)}${"max".padStart(9)}`
  );
  console.log("-".repeat(68));

  for (const [step, s] of steps) {
    const sorted = s.samples.slice().sort((a, b) => a - b);
    totalRequests += s.samples.length;
    totalFailed += s.failed;
    const ms = (v) => `${Math.round(v)}ms`.padStart(9);
    console.log(
      step.padEnd(18) +
        String(s.samples.length).padStart(7) +
        String(s.failed).padStart(7) +
        ms(percentile(sorted, 50)) +
        ms(percentile(sorted, 95)) +
        ms(percentile(sorted, 99)) +
        ms(sorted[sorted.length - 1] || 0)
    );
  }

  const seconds = elapsedMs / 1000;
  console.log("-".repeat(68));
  console.log(`concurrency      : ${USERS} virtual customers`);
  console.log(`duration         : ${seconds.toFixed(1)}s`);
  console.log(`requests         : ${totalRequests} (${(totalRequests / seconds).toFixed(1)}/s)`);
  console.log(
    `failed           : ${totalFailed} (${totalRequests ? ((totalFailed / totalRequests) * 100).toFixed(2) : "0.00"}%)`
  );

  for (const [step, s] of steps) {
    const bad = [...s.statuses.entries()].filter(([code]) => code === "error" || code === "timeout" || Number(code) >= 400);
    if (bad.length) {
      console.log(`  ${step}: ${bad.map(([code, n]) => `${code}×${n}`).join(", ")}`);
    }
  }

  // A clear verdict rather than a wall of numbers to interpret.
  const checkout = steps.get("product_page");
  const p95 = checkout ? percentile(checkout.samples.slice().sort((a, b) => a - b), 95) : 0;
  const failRate = totalRequests ? totalFailed / totalRequests : 0;
  console.log(
    `\nVERDICT: ${failRate < 0.01 && p95 < 1000 ? "PASS" : "INVESTIGATE"} ` +
      `(product page p95 ${Math.round(p95)}ms, error rate ${(failRate * 100).toFixed(2)}%)`
  );
}

async function main() {
  console.log(`warming up against ${SITE} …`);

  const productsRes = await fetch(
    `${API}/store/products?limit=50&fields=handle,variants.id`,
    { headers: PK ? { "x-publishable-api-key": PK } : {} }
  );
  if (!productsRes.ok) {
    console.error(`cannot read the catalogue (HTTP ${productsRes.status}). Is the backend running?`);
    console.error("Set MEDUSA_PUBLISHABLE_KEY if the store API requires a key.");
    process.exit(1);
  }
  const { products } = await productsRes.json();
  const handles = products.map((p) => p.handle).filter(Boolean);
  const variants = products.flatMap((p) => (p.variants || []).map((v) => v.id));

  if (!handles.length) {
    console.error("no published products to exercise");
    process.exit(1);
  }

  console.log(
    `${handles.length} products · ${USERS} concurrent customers · ${DURATION_MS / 1000}s` +
      `${DO_CHECKOUT ? " · cart writes ENABLED" : " · read-only"}`
  );

  const started = performance.now();
  const deadline = started + DURATION_MS;
  let active = true;
  setTimeout(() => {
    active = false;
  }, DURATION_MS).unref?.();

  const workers = Array.from({ length: USERS }, async (_, i) => {
    // Stagger starts so the whole fleet does not arrive in the same millisecond.
    await new Promise((r) => setTimeout(r, (RAMPUP_MS / USERS) * i));
    const sessionId = `load_${i}_${Date.now()}`;
    while (active && performance.now() < deadline) {
      await journey(handles, variants, sessionId);
    }
  });

  await Promise.all(workers);
  report(performance.now() - started);
}

main().catch((err) => {
  console.error("load test failed:", err);
  process.exit(1);
});
