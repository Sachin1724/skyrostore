# Skyrostore storefront: large-store e-commerce plan

Status: proposed, 3 November 2026. Supersedes the page compositions in REDESIGN-PLAN.md (the split-stage
landing); keeps its palette, type, skeletons, motion rules and admin CMS, which are already built.

## Why change direction

The split stage reads as an editorial site. Buyers of motors and flight controllers shop like they do on
any large store: search first, filter by spec, compare price and stock, add to cart. The reference
anatomy (header search with category scope, category nav, PLP grid + filter rail, PDP with gallery /
price / CTA / trust row / details / related, payment footer) and the mobile wireframes (search-first
home, department tiles, sort + filter bar, bottom-sheet filters, sticky add-to-cart) are the target.

## House rules that override the reference images

The reference shows things this store does not have. Nothing below may be rendered unless backed by data.

| Reference element | Decision |
|---|---|
| Star ratings, review counts, "Verified purchase" | **Not shown.** No review system exists. Phase 7 builds one; until it has real reviews the block is absent, not empty-stars. |
| Wishlist heart + counter | **Deferred.** No wishlist exists. Add only with a customer-scoped wishlist in the backend (Phase 7). |
| "-10%", struck MRP, "You save" | Only when the variant has a real compare-at / price-list price lower than MRP. Otherwise price alone. |
| "Order now, get it by May 28" | Only from a real Shipmozo serviceability/ETA response for the entered PIN. No hard-coded dates. |
| "Free shipping", "30-day returns", "24/7 support" trust row | Only claims the client confirms in writing; text comes from admin-editable `site_content`, copied from the policy pages. |
| "Ships in 24h from Odisha", "100% genuine", "official distributor" | Same: client-confirmed copy only, via `site_content`. |
| Payment logos row | Razorpay methods actually enabled on the account (UPI, cards, netbanking). |
| Brand logos | Only brands in the database (existing brand bar rule). |
| Item counts on categories | Real counts from the catalogue query. |
| Purple/gradient, pill buttons, emoji icons | Still banned. Blue accent, navy ink, Montserrat, square-ish 6px radius. |

## Global shell

**Utility strip** (thin, above header): up to 3 admin-editable messages from `site_content`. Hidden when empty.

**Header (desktop ≥ 1024px)**, one row, 72px:
logo · search field with category scope select + submit (existing `search-autocomplete`, now full width,
`/search?q=&category=` in the URL) · Support · Account (sign in / orders) · Cart button with item count
and subtotal (opens cart drawer).

**Category bar** (second row, 44px): `All categories` button opening a mega panel (top-level categories
from the category tree, each with its children and real counts) · direct links to the top 6 categories by
product count · right side: `Build checker` and `Bulk orders`. Built from the category tree, not hard-coded.

**Mobile (< 768px)**: menu button · logo · cart; search field on its own row under it, always visible
(wireframe pattern). Menu opens a full-height drawer: categories as large tap rows, then account, support,
bulk orders. Drawer: `overscroll-behavior: contain`, focus trapped, Escape closes, returns focus.

**Cart drawer**: right slide-over listing lines, quantity steppers, subtotal, `View cart` and `Buy Now`.
Opens after add-to-cart on desktop; on mobile a toast with `View cart` instead (drawer covers the page).

**Footer**: 4 columns: Store (logo, registered address and GSTIN once supplied by client) · Help (track
order, shipping, returns, warranty, contact; links to `/policies/*` and `/support`) · Shop (top categories)
· Business (bulk orders, request quote). Bottom strip: copyright, terms, privacy, enabled payment methods.
No newsletter until there is a mailing list behind it.

## Pages

### Home `/`
Remove the sticky split stage. Order:
1. Hero: one full-width banner (admin image + headline + 2 CTAs: `Shop parts`, `Check a build`). Image is
   `priority`, sized, no carousel.
2. Trust row: up to 4 items from `site_content` (client-confirmed claims only).
3. Shop by category: 6–8 image tiles with real counts (desktop 4 cols, mobile 3 cols, wireframe style).
4. Product rails: `New in stock` (created_at desc, in stock) and one admin-picked collection. 4 cols
   desktop, horizontal scroll-snap on mobile with real links. Tabs only if 2+ collections exist; tab in URL.
5. Build checker banner: the existing `compat-check`, now a horizontal module, not the hero.
6. Brand bar (existing).
7. Bulk orders banner.
8. FAQ as `<details>` accordion (native, no JS), content from `site_content`.

### Catalogue `/parts`, `/uavs`, `/brands/[handle]`, `/search`
One shared listing layout (one component, four routes).
- Header: breadcrumb, title, result count, active filter chips with remove + `Clear all`.
- Toolbar: sort (`Newest`, `Price: low to high`, `Price: high to low`; "Popularity" only once analytics
  can rank it), grid/list toggle, mobile `Filters (n)` button.
- Desktop: 264px sticky filter rail (category tree with counts, price min/max in INR, `In stock only`,
  brand checkboxes, the existing spec facets: KV, stator, cells, prop size) + grid 4 / 3 / 2 cols.
- Mobile: filters in a bottom sheet with `Apply` showing the result count, `Clear` on top (wireframe).
- Pagination: numbered links (`?page=`), 24 per page. Real `<a>` links, crawlable.
- Every filter, sort, view and page lives in the URL. Back button restores state.
- `/search` empty state: the query, spelling suggestions only if search returns them, top categories, link to support.
- `/uavs` adds a mission filter only if UAV products carry that attribute in the UAV module; otherwise skipped.

### Product card (one component, grid + list variants)
1:1 image on light ground (fixed dimensions) · brand · 2-line clamped title · one key spec line from
`technical-specs` (e.g. `2207 · 1950KV · 6S`) · price (tabular figures), compare-at struck only if real ·
stock text (`In stock`, `Only 3 left` when ≤ 5, `Out of stock`) · `Add to cart` button (existing
`quick-add`; variant picker if more than one variant). Whole card is one link except the button.

### Product page `/products/[handle]`
Desktop 2 columns (gallery 7/12, buy box 5/12), matching the anatomy reference:
- Breadcrumb from category tree.
- Gallery: main image + thumbnails (buttons, arrow-key navigation), click opens a zoom dialog.
- Buy box: brand link · title · SKU · spec chips · price (+ "incl. GST") · compare-at only if real ·
  stock status · variant selector · quantity stepper · `Add to cart` (primary) + `Buy Now` (secondary
  leading to Razorpay, existing) · `Check in build` link · PIN code delivery check (Shipmozo ETA, real only).
- Trust row: from `site_content`.
- Below: 3 sections side by side on desktop, accordions on mobile (anatomy reference: description /
  reviews / FAQ, adapted): **Description**, **Specifications** (real table, units, tabular figures),
  **In the box** (only if the product has the field). Product FAQ only if the product has FAQ metadata.
- Compatible parts: from the compatibility engine (this replaces "Frequently bought together"; it is the
  real version of it). Then related products from the same category.
- Mobile sticky bar after the buy box scrolls away: price + `Add to cart`, safe-area padded.

### Cart `/cart`
Lines (image, title link, variant, unit price, stepper, line total, `Remove` with undo toast) · summary
card sticky on desktop: subtotal, shipping "calculated at checkout" (or real Shipmozo rate), GST note,
total, `Buy Now`, "Secured by Razorpay", enabled payment methods. Free-shipping meter only if the client
sets a threshold in admin. Coupon field only if Medusa promotions are enabled. Empty state with categories.

### Checkout and confirmation
Unchanged flow (Razorpay Magic Checkout collects address). Add a focused header (logo + "Secure
checkout" only) and an order summary column. Confirmation keeps the built animation; adds order lines,
total, and the AWB tracking link once shipped. GST invoice download only once invoices are generated.

### Account `/account`
Left nav (Orders, Bulk requests, Profile) · order list with status from Medusa's own `status` /
`payment_status` / `fulfillment_status` (no second status table) · order detail with Delhivery AWB link.
Saved addresses skipped: Razorpay owns the address.

### Build, bulk orders, support, policies
Keep current pages; they move into the new shell. Build page gains `Add whole build to cart`.

## Engineering rules (web-design-guidelines + project)

- Server components fetch; client islands only for search, filters sheet, gallery, cart drawer, steppers.
- Every route keeps its `loading.tsx` skeleton mirroring the new layout (zero layout shift).
- Images: explicit width/height, `priority` above the fold only, lazy below.
- Prices via `Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })`; dates via `Intl`.
- Tabular numerals for prices, counts, specs. `…` character for loading text.
- Icon-only buttons get `aria-label`; skip link; one `h1` per page; headings in order.
- Visible `:focus-visible` ring everywhere; sticky header/bar uses `scroll-margin-top` so focus is not hidden.
- Drawers/sheets: focus trap, Escape, `overscroll-behavior: contain`, `inert` background.
- Inputs: labels, `type`/`inputmode`/`autocomplete` (PIN code `inputmode="numeric"`), paste allowed.
- Transitions name properties (no `transition: all`); animate transform/opacity; `prefers-reduced-motion` respected.
- Copy: Title Case buttons, specific labels (`Add to cart`, not `Submit`), errors state the fix.
- Remove remaining `any` in product card / product detail as those files are rewritten (typed from Medusa's `StoreProduct`), not as a separate pass.

## Phases

| # | Phase | Delivers | Gate |
|---|---|---|---|
| 1 | Shell | Utility strip, header with scoped search, category bar + mega panel, mobile drawer, cart drawer, footer | Keyboard pass, 390/768/1440 no overflow |
| 2 | Listing | Shared listing layout, filter rail + mobile sheet, URL state, sort, pagination, new product card | Filters survive reload/back; axe clean |
| 3 | Product page | Gallery + zoom, buy box, spec table, accordions, compatible parts, sticky mobile bar | LCP image prioritized; no CLS |
| 4 | Home | New home sections, `site_content` keys for hero, trust row, FAQ, rails | Admin edit shows in seconds |
| 5 | Cart, checkout, account | Cart page + summary, focused checkout header, account nav and order views | Real order end to end on staging DB |
| 6 | Audit | web-design-guidelines review of every changed file, Lighthouse ≥ 90, axe, reduced-motion | Zero criticals |
| 7 | Later, needs backend | Reviews (verified buyers only), wishlist, PIN-code ETA, GST invoice PDF | Each ships only with its data |

## Needed from the client

- Written confirmation of each trust claim (dispatch time, returns window, warranty, genuine-parts statement).
- GSTIN and registered address for the footer.
- Hero image and category tile images (real product or workshop photos).
- Free-shipping threshold, if any.
