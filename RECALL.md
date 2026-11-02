# Skyrostore — Delivery Recall & Checklist

Last verified: **2026-10-20** · Full suite: **232/232 passing** (15 files) · Typecheck: clean in all three apps

Tick a box when you have personally confirmed it in the running app. Items already ticked were
verified against a live stack (Postgres + Redis + Medusa + both Next apps) on the date above.

---

## 0. Roadmap status — 20 October 2026

| Phase | Roadmap state | Actual state |
|---|---|---|
| 1. Core commerce | Completed | Done (predates this work) |
| 2. UAV products & specs | Implemented | Done, not expanded |
| 3. Bulk orders | Implemented | Done — conversion now creates a **real** Medusa order |
| 4. Payment integration | Acceptance pending | Code done · **acceptance blocked, no Razorpay keys** |
| 5. Admin fulfilment & analytics | Browser checks pending | Done · **browser click-through not run** |
| 6. Customer experience | Current priority | A done (success path unverified) · B 3 image gaps · C done |
| 7. Final acceptance testing | Last milestone | **Not started** |
| 8. Production launch | Final | **Not started** |

### Phase 3 — bulk orders
- [x] Conversion creates a real Medusa order, so bulk orders enter the normal packing queue
- [x] Bundle contents preserved and visible to the packing team

### Phase 4 — payment
- [x] Provider, server-side verification, webhook reconciliation, payment-attempt tracking
- [x] `getWebhookActionAndData` implemented; 5 provider type errors fixed
- [ ] **Razorpay demo credentials configured** — `RAZORPAY_KEY_ID` is unset, so the provider is not
      registered and checkout falls back to `pp_system_default` (manual). Nothing is charged.
- [ ] Success, failure, cancellation and duplicate payment flows tested against Razorpay

### Phase 5 — admin fulfilment and analytics
- [x] Order queue, order detail, packing list
- [x] Pack → courier and tracking → ship → delivered, every transition idempotent
- [x] Bulk orders appear in the fulfilment queue
- [x] Customer-visible shipping information
- [x] Product, cart, checkout and payment event tracking
- [x] Abandoned-cart reporting, payment-failure visibility, dashboard on real data
- [x] Fixed: `query.graph` omits `payment_status`/`fulfillment_status`, which made every order read
      as `paid_processing` and held packed/shipped counts at 0 across six routes
- [ ] **Browser click-through of events and status changes** — Chrome extension not connected

### Phase 6A — authentication
- [x] Auth module registered (there was none; only Medusa's built-in default existed)
- [x] Google sign-in: state validation, server-side code exchange, `id_token` verified against
      Google's JWKS, httpOnly cookie, identities keyed on `sub` so accounts never merge on email
- [x] Existing email/password sign-in unchanged; sign-out clears the session
- [x] Honest "not configured" state; no faked sign-in when credentials are absent
- [x] Every failure path tested: cancelled, forged/replayed state, missing params, unconfigured
- [x] **Order privacy hole closed** — Medusa leaves `GET /store/orders/:id` unauthenticated by
      design; one customer could read another's full order. Now ownership-checked, returns 404.
- [ ] **Google success path verified** — needs a real OAuth client (see `GOOGLE-AUTH.md`)

### Phase 6B — catalogue
- [x] All 8 published products audited: name, category, description, specs, SKU, INR price,
      sales channel, status, working PDP and add-to-cart
- [x] New products created in admin appear correctly on the storefront (verified end to end)
- [ ] **Three product images** — SkyroX4 Quadcopter, BLHeli32 4-in-1 ESC 50A, T-Motor U5 KV400
- [ ] **Upload provider** so the team can manage images without committing files to the repo
- [ ] Fix the SkyroX4 brand, currently the single letter "k"

### Phase 6C — shopping experience
- [x] Smart search with a suggestion dropdown: name, thumbnail, brand · category, price, stock
- [x] Debounced with request cancellation, full keyboard support, combobox semantics
- [x] Cart updates guarded against double clicks, with success and failure messages
- [x] Checkout field labelling and autofill (there were zero `autoComplete` attributes anywhere)
- [x] Live regions for cart and error feedback; duplicate-submit guard on checkout
- [x] Order history and customer-visible shipment tracking
- [x] `prefers-reduced-motion`, `:focus-visible`, `color-scheme`
- [x] Admin customer management: view, edit, delete (blocked while orders exist)
- [ ] Remaining placeholder-only inputs outside checkout and sign-in; image `sizes` attributes

### Phase 7 — final acceptance testing
- [ ] Every item. Blocked on: a Google OAuth client, Razorpay demo credentials, and a connected
      browser. The ten-step journey, failed/cancelled/duplicate payments, abandoned checkout,
      mobile layout and error recovery are all unverified in a real browser.

### Phase 8 — production launch
- [ ] Production environment variables and rotated secrets (currently dev values, `admin123`)
- [ ] Domain and HTTPS
- [ ] Email delivery and templates — **no notification provider is registered, so customers
      currently receive no order or shipping emails**
- [ ] Production payment credentials
- [ ] Migrations, backups and deployment procedure verified
- [ ] Image storage configured
- [ ] Security, error logging and monitoring
- [ ] Final order-to-shipment smoke test on the deployed environment
- [ ] Redis cache, event-bus and workflow modules before running multiple backend instances

### Fastest way to unblock
1. Razorpay demo credentials → unblocks Phase 4 acceptance and most of Phase 7.
2. A Google OAuth client → unblocks the Phase 6A success path and step 1 of Phase 7.
3. Connect the Chrome extension → unblocks the Phase 5 and Phase 7 browser checks.

---

## 0b. Scale work — 21 October 2026

Target: 1,000 concurrent customers, 20,000 visitors a day. Database and API keys arrive next,
load testing follows after that.

### Shared infrastructure — done, clean boot verified

All four were running in memory before, which is why a second backend instance would have been
*incorrect*, not merely slow. All are conditional on `REDIS_URL`.

- [x] `cache-redis` — without it each instance caches separately and customers see different
      prices and stock depending on which instance answers
- [x] `event-bus-redis` — subscribers (order placed, analytics) fire once per event across the
      fleet rather than once per instance
- [x] `workflow-engine-redis` — durable workflow state, surviving the instance that started it
- [x] `locking-redis` — distributed locks, so two instances cannot fulfil or capture one order
- [x] Postgres pool sized per instance: `DB_POOL_MIN` 2 / `DB_POOL_MAX` 20 (was unset, so the
      driver default would have starved checkout under load). Postgres allows 100 connections by
      default, so this supports roughly four instances with headroom.

Boot verified: five Redis connections established, **zero in-memory fallbacks**, zero errors,
zero deprecation warnings.

### Buffering — done

- [x] **Catalogue reads cached.** Homepage, `/parts`, product pages, categories and brands serve
      from the Next data cache: 60s for products (`NEXT_PUBLIC_CATALOGUE_TTL`), 300s for taxonomy
      (`NEXT_PUBLIC_TAXONOMY_TTL`), both tagged for explicit purge. Previously every page view cost
      a backend round-trip and a database query. Search stays uncached (per-visitor, long-tail),
      and carts, orders and sessions are never cached.
- [x] **Analytics writes buffered.** Was one INSERT per beacon — the busiest write path on the
      system. Rows now queue in memory and flush as a single multi-row INSERT at 200 rows or 2s,
      whichever comes first. The HTTP response no longer waits on the database.
      Roughly: 20,000 visitors × ~10 events ≈ 200,000 events/day, which drops from 200,000
      individual inserts to about 1,000 batched ones.
      Bounded at 5,000 rows so an unreachable database cannot grow it without limit, with a
      shutdown flush (`src/loaders/analytics-flush.ts`) so deploys do not lose the queued window.
      Analytics is observational, so the trade is deliberate: a crash can lose at most one
      unflushed window. Payment, order and fulfilment state never go through this path.
- [x] 7 unit tests for the buffer: batching, auto-flush, overflow ceiling, write failure,
      idempotency, empty flush.

### Load-test harness — ready, not yet run in anger

`scripts/load-test.mjs` drives real HTTP through the customer journey (homepage → catalogue →
search suggest → product page → analytics beacon, plus cart writes with `--checkout`), ramps
concurrency gradually, and reports p50/p95/p99/max per step with error counts and a
PASS/INVESTIGATE verdict. Read-only by default, so it is safe against a live environment.

```bash
node scripts/load-test.mjs --users 1000 --duration 60
node scripts/load-test.mjs --users 200 --duration 30 --checkout
```

- [ ] Run it at 1,000 concurrent once the real database is in place

### Open

- [ ] **Demo data left in place deliberately.** The 8 `[DEV]` products are still the only
      catalogue; clearing them now would empty the storefront and make testing harder. Delete them
      in the same step as importing the real products, so there is never a gap.
- [ ] Rate limiting on the public analytics collector
- [ ] Load test at target concurrency

### A mistake worth remembering

Chasing a deprecation warning, the workflow engine's option was moved to a top-level `redisUrl`.
The module reads it from **inside** a `redis` object, so the backend died at boot with
`Cannot destructure property 'url' of '(intermediate value)' as it is undefined`. The warning text
says "use `redisUrl`" without mentioning the key stays nested. Correct form:

```ts
options: { redis: { redisUrl: process.env.REDIS_URL } }
```

Two lessons: `medusa-config.ts` fails hard and only at startup, so every change there needs a real
boot check rather than a typecheck — and the load harness earned its place immediately by
exposing the dead backend on its first run.

---

## 1. How to run everything

```bash
# Prerequisites: Postgres on 5432, Redis on 6379

# Backend (Medusa + admin dashboard at /app)
cd apps/backend
PORT=9100 STORE_CORS="http://localhost:3100" ADMIN_CORS="http://localhost:3101" \
  AUTH_CORS="http://localhost:3100,http://localhost:3101" npx medusa develop

# Storefront
cd apps/storefront
NEXT_PUBLIC_MEDUSA_URL="http://localhost:9100" npx next dev --port 3100

# Custom admin
cd apps/admin
NEXT_PUBLIC_MEDUSA_URL="http://localhost:9100" npx next dev --port 3101
```

Default ports (9000 / 3000 / 3001) also work — drop the env overrides.

| Service | URL | Purpose |
|---|---|---|
| Medusa API | http://localhost:9100 | Store + admin API |
| Medusa dashboard | http://localhost:9100/app | Create products, full catalogue editing |
| Storefront | http://localhost:3100 | Customer site |
| Custom admin | http://localhost:3101 | Fulfilment, analytics, bulk orders |

Dev credentials (local only — change before any shared deployment):

- Admin: `admin@skyrostore.com` / `admin123`
- Customer: `customera@skyrostore.test` / `Customer123!`

Database migration (required once after pulling this work):

```bash
cd apps/backend && npx medusa db:migrate
```

---

## 2. Completed

### Fulfilment workflow
- [x] Order queue with filters by derived state and payment status — `GET /admin/fulfilment/orders`
- [x] Order detail: customer, address, items, quantities, bundle contents, payment details
- [x] Packing list, with bundle contents expanded and multiplied by line quantity
- [x] Mark packed — creates a Medusa fulfilment; repeat calls are a no-op
- [x] Courier + tracking capture, with validation (empty or malformed tracking is rejected)
- [x] Mark shipped — triggers the customer notification; repeat calls do not create a second shipment
- [x] Mark delivered — idempotent
- [x] Full status and transaction history per order
- [x] Status model derived from Medusa's own `status` / `payment_status` / `fulfillment_status`;
      no second source of truth, no new status table

### Bulk orders
- [x] Conversion creates a **real Medusa order** (previously a fake `ord_bulk_…` string)
- [x] Converted bulk orders appear in the normal fulfilment queue with their items
- [x] Bundle contents preserved on the order and visible to the packing team
- [x] Invoiced bulk orders can be packed before payment capture, but only on an explicit request

### Analytics & event tracking
- [x] `analytics` module with `analytics_event` + `payment_attempt` tables and 13 indexes
- [x] 13 event types across the journey: session, product view, search, add to cart,
      quantity change, remove, checkout start, step completed/failed, payment attempted,
      payment succeeded/failed, order placed
- [x] Collection is non-blocking — `navigator.sendBeacon`, micro-batched, keepalive-fetch fallback
- [x] Duplicate events are idempotent on a unique `event_key`
- [x] UTM attribution captured once per session and reused
- [x] Payment outcome and order placement are written **server-side only** (verified payment session,
      signed webhook, or the `order.placed` event) — a browser cannot claim them
- [x] No secrets, card data, tokens or signatures are ever persisted (recursive key scrubbing)

### Payment failure visibility
- [x] `payment_attempt` records cart/order, provider, reference, amount, currency, timestamp,
      outcome, safe error category, retry flag, webhook outcome
- [x] Payment state stays authoritative in the payment module; analytics only observes
- [x] Razorpay webhook reconciles attempts and writes the verified outcome

### Abandoned carts
- [x] Threshold-based classification (`ANALYTICS_ABANDONED_AFTER_MINUTES`, default 60)
- [x] Excludes completed orders and carts with a payment still in flight
- [x] Records last action and last completed checkout step; no reason is invented
- [x] Admin view with per-state counts

### Admin dashboard
- [x] Orders awaiting fulfilment / packed / shipped / delivered
- [x] Failed and pending payments needing attention
- [x] Abandoned carts and checkout drop-off by step
- [x] Product views, add-to-cart, purchases
- [x] Bulk enquiries and outstanding quotations
- [x] Every metric derived from real rows; shows "collection starting" instead of fake numbers
- [x] Drill-down from each metric to the underlying records

### Admin housekeeping
- [x] De-scoped nav removed: Flight Tests, Quality Control, Manufacturing, UAV Builds
      (dead stubs; backend modules, tables and APIs left intact)
- [x] **New product form** at `/products/new` — sets price, sales channel and status so the
      product is not silently invisible; supports category, brand, component type, SKU, image
- [x] Stale `[TEST]` draft products removed (catalogue: 8 products, 8 published, 0 drafts)

### Code health
- [x] Medusa admin dashboard (`/app`) loads — missing admin build deps declared
      (`react`, `react-dom`, `@medusajs/dashboard`, `@medusajs/admin-sdk`, `@medusajs/ui`,
      `@medusajs/admin-shared`, `@medusajs/draft-order`)
- [x] All 5 pre-existing Razorpay type errors fixed; backend typecheck is at zero errors
- [x] Storefront and admin typecheck clean
- [x] Product images wired for 5 of 8 published products (seed script + database)

### Tests
- [x] 232 tests across 15 files, all passing
- [x] Packing and shipping transitions, including idempotency
- [x] Tracking validation and duplicate requests
- [x] Bulk-order conversion into normal fulfilment
- [x] Event recording across the journey, and duplicate handling
- [x] Payment failure recording and payment-state authority
- [x] Abandoned-cart classification
- [x] Admin authorisation on every new endpoint
- [x] No analytics secrets or sensitive payment data stored
- [x] Existing commerce and payment regression suites still pass

---

## 3. Incomplete

- [ ] **Product photos for 3 products** — SkyroX4 Quadcopter, BLHeli32 4-in-1 ESC 50A,
      T-Motor U5 KV400. No asset in the repo depicts them (only a *60A Hobbywing* ESC and an
      *MN5212* motor, which are different parts), and the project rule is manufacturer
      photography only, so nothing was substituted. They currently render a typed icon
      placeholder, not a broken image.
      **To finish:** drop files into `apps/storefront/public/images/products/`, then set the
      thumbnail on each product (admin → product, or add to `apps/backend/src/scripts/seed-dev.ts`).

- [ ] **Browser click-through of event tracking** — never performed. The Chrome extension was not
      connected during development. Covered indirectly by 8 module-level tests with stubbed
      browser globals plus a live POST through the collector proxy, but no human has clicked a
      product page and watched the event land.
      **To finish:** open the storefront, browse a product, add to cart, then check
      `http://localhost:3101/analytics`.

- [ ] **Measured performance numbers** — only indexes and a non-blocking design, no benchmark.
      The order queue derives state in memory over the most recent 1000 orders
      (`scan_limit`, marked with a `ponytail:` comment in
      `apps/backend/src/api/admin/fulfilment/orders/route.ts`). Fine at current volume; push the
      filter into SQL if the catalogue of orders grows into the thousands.

- [ ] **Type checking for the backend's admin extensions** — `src/admin` is excluded from `tsc`.
      Attempted and reverted: giving the backend its own `@types/react@18` requires an
      `.npmrc` hoist exclusion, which then breaks `@medusajs/ui`'s own type resolution
      (33 spurious "children does not exist" errors). Medusa's admin assumes a hoisted
      `node_modules`. Harmless in practice — Medusa compiles those files with vite and never
      type-checks them.

- [ ] **Pre-existing modified files not reviewed** — several files were already modified in the
      working tree before this work began (`manufacturing/service.ts`, `uav-configuration.ts`,
      `manufacturing-job.ts`, `admin/uav/configurations/route.ts`, screenshots). Untouched here.

---

## 3b. What is still needed for a fully functional store

These are configuration and integration gaps, not missing code. The workflow is built and tested;
these are what stand between it and taking real orders.

- [ ] **Razorpay is not active.** `apps/backend/.env` has no `RAZORPAY_KEY_ID` /
      `RAZORPAY_KEY_SECRET` / `RAZORPAY_WEBHOOK_SECRET`, and `medusa-config.ts` only registers the
      provider when `RAZORPAY_KEY_ID` is set. Checkout therefore falls back to
      `pp_system_default` (manual payment) — no card, UPI or netbanking actually charges.
      **To finish:** add the three keys, restart, confirm `pp_razorpay` appears in
      `/store/payment-providers`, and point a Razorpay webhook at `/webhooks/razorpay`.

- [ ] **No notification provider — customers receive no emails.** Nothing is registered in
      `medusa-config.ts`, so order confirmation and shipping updates are emitted as events and
      then dropped. The ship endpoint reports `notification_requested`, not delivered.
      **To finish:** register a notification module (Resend/SendGrid) and add templates for order
      placed and order shipped. The shipped event already carries courier and tracking number.

- [ ] **No file/upload provider.** Product images must be committed into
      `apps/storefront/public/images/products/` and referenced by path; uploading an image through
      the admin will not work.
      **To finish:** register a file module (S3 or Cloudinary, per ARCHITECTURE.md).

- [ ] **Production infrastructure modules are unregistered.** Redis is in `projectConfig` but no
      cache, event-bus or workflow-engine module is configured, so all three run in memory. That
      is fine for one dev process and wrong for multiple instances — events and scheduled work
      will not be shared.
      **To finish:** register the Redis cache, event bus and workflow engine modules before
      running more than one backend instance.

- [ ] **Seed script hardcodes environment IDs.** `seed-dev.ts` pins `SALES_CHANNEL_ID`,
      `REGION_ID`, `STOCK_LOCATION_ID` and `SHIPPING_PROFILE_ID` to this database's values, so it
      will not bootstrap a fresh environment.
      **To finish:** look these up by handle/name at runtime instead.

- [ ] **Secrets are development values.** `JWT_SECRET` and `COOKIE_SECRET` in `.env`, and the
      `admin123` login, must be rotated before anything is reachable off this machine.

- [ ] **No HTTPS/domain/deploy run-through.** `DEPLOYMENT.md` and both compose files exist but
      have not been exercised in this work.

Fixed while auditing this (previously missing, now done):

- [x] Customer can see courier and tracking number on their order page — the storefront order API
      now requests fulfilment and label fields, and `order-detail.tsx` renders a Shipment section
      with a clickable tracking link once the order has actually shipped
- [x] The ship endpoint no longer claims `notification_sent: true` when no provider exists

---

## 3c. Phase 6 — authentication, catalogue and shopping UX

### Done

- [x] **Auth module registered.** The backend had none, so only Medusa's default email/password
      existed. Now `emailpass` always, plus `google` only when `GOOGLE_CLIENT_ID` and
      `GOOGLE_CLIENT_SECRET` are set.
- [x] **Google sign-in implemented** — `/api/auth/google/start`, `/auth/google/callback`,
      `/api/auth/providers`, and a backend `/store/auth/pending-profile` route. State generation
      and validation, the code exchange and `id_token` verification (signature, audience, issuer)
      all happen in Medusa; the client secret never reaches the browser.
- [x] **Honest availability state** — with no credentials the button is not shown, the start
      endpoint returns 503, and the account page says Google is not configured. Nothing is faked.
- [x] **Account-safety** — identities key on Google's `sub`, never email. If the Google address
      already belongs to an account, sign-in is refused rather than linked.
- [x] **Order privacy hole closed.** Medusa ships `GET /store/orders/:id` unauthenticated by
      design, treating the order id as a secret. Verified that one signed-in customer could read
      another's full order (name, address, phone, spend). A `requireOrderOwner` middleware now
      enforces ownership and returns 404 so the route does not confirm an id exists.
- [x] **Customer tracking visible** — courier, shipped/delivered date and a clickable tracking
      link on the customer's order page.
- [x] **Form accessibility and autofill** — 10 checkout fields given real `htmlFor`/`id` pairs and
      `autoComplete`/`inputMode` hints; sign-in and registration fields labelled with
      `current-password`/`new-password` hints. Previously zero `autoComplete` attributes existed.
- [x] **Live regions** — checkout and sign-in errors announce via `role="alert"`; cart changes
      announce via a polite status region. Previously zero live regions existed.
- [x] **Cart safety** — quantity and remove controls have per-item accessible names, are disabled
      while a change is in flight, and report success or failure.
- [x] **Duplicate submission guard** on checkout.
- [x] **Reduced motion, focus-visible and color-scheme** added to global styles; none existed.
- [x] **Catalogue audited** — all 8 published products have INR pricing, a sales channel,
      a category, description, specs and a working PDP (HTTP 200).
- [x] **Cart flow verified** end to end: add, update quantity, remove, persistence.
- [x] 15 new auth tests; suite now 247 tests.

### Open

- [ ] **Google sign-in not exercised against real Google.** No OAuth client exists for this
      project, so the success path is unverified. Everything up to the redirect, and every
      failure path, is tested. Follow `GOOGLE-AUTH.md` to configure and then confirm.
- [ ] **Three product images still missing** — see item 1 in section 3.
- [ ] **One catalogue data issue:** the SkyroX4 Quadcopter's brand is the single letter "k",
      which looks like a mistyped entry. Correct it in the admin.
- [ ] **No real browser click-through.** The Chrome extension is still not connected, so the
      UI work above is verified by code review, HTTP checks and tests, not by clicking.
- [ ] **Remaining UI guideline items not yet addressed:** the remaining placeholder-only inputs
      outside checkout and sign-in, image `sizes` attributes, and list virtualisation.

---

## 4. Verification commands

```bash
# Full suite (backend must be running)
MEDUSA_URL=http://localhost:9100 npx vitest run

# Unit-only — no backend needed
npx vitest run tests/fulfilment-rules.test.ts tests/analytics-rules.test.ts tests/analytics-client.test.ts

# Typecheck
cd apps/backend && npx tsc --noEmit      # expect zero errors
cd apps/admin && npx tsc --noEmit        # ignore TS2742 portability notes
cd apps/storefront && npx tsc --noEmit   # ignore TS2742 portability notes
```

All suites honour `MEDUSA_URL`; they default to `http://localhost:9000`.

---

## 5. Gotchas worth remembering

1. **Never run `pnpm install` while the dev servers are up.** Swapping packages under a running
   vite/Next process kills its esbuild child ("The service is no longer running") and makes the
   Next apps return 500. Stop everything, install, then restart.

2. **`query.graph` does not return `payment_status` or `fulfillment_status`.** They are computed
   fields. Every route that needs them uses `getOrdersListWorkflow` / `getOrderDetailWorkflow`
   instead. Using the raw graph silently reports every order as `paid_processing`.

3. **An order item's `quantity` lives on its `detail` relation.** Requesting only `items.quantity`
   can return nothing; request `items.detail.quantity` as well.

4. **A fulfilment's metadata is not set by the shipment workflow.** The courier is written
   separately via `updateFulfillment`; the tracking number lives on the label.

5. **Four reasons a new product does not appear on the storefront**, in order of likelihood:
   status is draft, no price in the region's currency, not in the default sales channel,
   or no `component_type` (needed only for builder/compatibility features).

---

## 6. Where things live

| Area | Path |
|---|---|
| Analytics module | `apps/backend/src/modules/analytics/` |
| Event + fulfilment rules | `apps/backend/src/lib/analytics.ts`, `apps/backend/src/lib/fulfilment.ts` |
| Fulfilment API | `apps/backend/src/api/admin/fulfilment/` |
| Analytics API | `apps/backend/src/api/admin/analytics/`, `apps/backend/src/api/store/analytics/` |
| Order-placed subscriber | `apps/backend/src/subscribers/order-placed-analytics.ts` |
| Storefront tracking | `apps/storefront/src/lib/analytics.ts`, `src/components/analytics/tracker.tsx` |
| Collector proxy | `apps/storefront/src/app/api/analytics/route.ts` |
| Admin fulfilment UI | `apps/admin/src/app/(dashboard)/orders/` |
| Admin analytics UI | `apps/admin/src/app/(dashboard)/analytics/` |
| New product form | `apps/admin/src/app/(dashboard)/products/new/` |
| New tests | `tests/{fulfilment,analytics}-{rules,api}.test.ts`, `tests/analytics-client.test.ts` |
