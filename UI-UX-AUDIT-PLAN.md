# Storefront UI/UX audit and plan

Status: proposed, 10 November 2026. Follows STOREFRONT-COMPLETION-PLAN.md.

Method: walked the storefront as a buyer on localhost:3000 (desktop 1440px) — home, All categories menu,
/parts, a product page, add to cart, cart drawer, /cart, search — and compared each step with what Amazon.in
and Flipkart show at the same step. Phone width (390px) was read from code only; a live phone pass is
item 7.1.

The short version: the store has most of the features, but it does not yet *read* like a shop. Prices are
broken in the cart, product pictures are screenshots, the header looks unfinished on the right, and a lot of
copy sounds generated ("Verified Drone Hardware", "Hardware Restock Bulletins & Specs", "zero marketing
clutter"). Amazon and Flipkart feel trustworthy because every screen answers four buyer questions fast:
**what is it, what does it cost (and how much am I saving), when will it reach me, and can I trust the seller.**
This plan is ordered around those questions.

---

## 0. Broken or trust-killing — fix first

Done 10 Nov: 0.1 (cart routes pass `CART_QUERY` from `lib/medusa.ts`) and 0.6 (search fills the row, icons on
the right edge).

### Status, 11 Nov

Done in code: 0.1, 0.2 (drawer opens on press, add route returns the cart), 0.4 "[DEV]" hidden in cart and
checkout, 0.5 (unconfirmed claims removed from ticker, trust strip, brand header, product page, cart; the
placeholder phone number removed from support and the company policy), 0.6, 0.7, 0.8; header 1.1–1.7 (PIN
chip, account menu, orders, wishlist, search scope, typo correction with "showing results for", Frames in
the bar, mega menu with pictures, static announcement bar); card 2.1, 2.2, 2.5, 2.6; listing 3.2–3.5; product
page 4.1 (rating line once reviews exist), 4.2, 4.4–4.7, 4.9; home 5.1–5.7; copy table in 6; cart 8.1–8.3,
8.5 (also fixed "Undo" and "Move to cart", which sent the wrong field and never worked).

Not done, and why:
- 2.3 / 2.4 ratings and delivery dates on cards: no review exists yet, and the courier API returns
  serviceable yes/no only, no delivery date. Add when Shipmozo's rate API (with ETA) is wired.
- 4.3 offers: done 11 Nov. Admin → Promotions → "Show on product pages" per code; active ones appear
  under "Available offers" with one-tap copy.
- 8.6 cart skeleton: the wait is the backend round trip to Supabase, not the page.
- 0.3, 0.4 data, brand "k", category pictures: content (see below). The batteries category picture shows a
  phone, and the propellers one an aircraft propeller.
- Free delivery: done 11 Nov. `/store/settings` now reports the cheapest delivery price; while it is ₹0 the
  cart shows "Delivery: Free" and no threshold bar. The bar returns by itself if delivery is ever priced.

| # | What a buyer sees | Cause | Fix |
|---|---|---|---|
| 0.1 | Cart drawer line price, /cart subtotal, GST, order total and the free-shipping bar all show **₹NaN** | Medusa 2.21 store cart response has no per-line `total` (checked: `items[0].total` is `undefined`, `unit_price` and `cart.item_total` are present). `cart-drawer.tsx:151` and `cart-view.tsx:324,521` read `item.total` directly. Header total works only because `cartTotal()` falls back to `unit_price × quantity`. | Request the line totals in `/api/cart` (and add/update/remove routes) with `fields=*items,+items.total,+items.subtotal`, or compute the line total once in one helper and use it everywhere. Use `cart.total` / `cart.item_total` for summaries. |
| 0.2 | "Adding…" sits for ~4–5 s after Add to Cart | Add round trip plus full cart refetch before the drawer opens | Open the drawer immediately with the item shown as pending, then reconcile. |
| 0.3 | Product images are screenshots of old cards: baked-in "In Stock" text, a second heart icon, cut-off text ("UAV Telemetry Radio … ₹7,499"). Two products show an icon placeholder. **SkyroX4 Quadcopter shows a photo of a person.** | Seed content | Replace with real product photos (team). Until then, hide products without a proper image from home rails. |
| 0.4 | "[DEV]" prefix in cart line names; brand filter shows "k" | Seed data | Real catalogue (team); delete brand "k". |
| 0.5 | Claims that may not be true: "Same-Day Dispatch … 19,000+ PIN codes", "100% Genuine Certified / Authorized distributor", "Free Air Express Shipping", "Dispatched within 24 hours" (contradicts "same-day") | Hard-coded copy | Keep only what the owner confirms in writing (house rule: no fake data). Move confirmed claims into admin-editable site content. |
| 0.6 | Desktop header: search + icons stop at ~1130px while the category row runs to 1488px — a blank hole top-right | `header-bar.tsx:79,83` — search capped at `md:max-w-[720px]` and the icon nav has `md:ml-0` | Let the icon group sit on the right edge (`ml-auto`) so both header rows share the same right edge. |
| 0.7 | Page titles repeat the brand: "Pixhawk 6C Mini \| Skyrostore UAV Engineering \| Skyrostore", "Shopping Cart — Skyrostore \| Skyrostore" | Title template plus brand inside page titles | Pages return only their own title; the template adds "\| Skyrostore" once. |
| 0.8 | Product page has two "Write a review" buttons and two "Ask a question" buttons stacked | Section header button plus empty-state button | Keep one per section. |

---

## 1. Header — the biggest gap against Amazon / Flipkart

What both big stores have that we do not:

1. **"Deliver to 751024" chip** next to the logo. Pincode entered once, saved in the browser (and on the
   customer when signed in), then used everywhere: delivery date on cards, product page and cart. Today the
   pincode box exists only on the product page, below the fold.
2. **Account menu on hover/click**, not a bare link: "Hello, sign in" / "Hello, Sachin"; Orders, Wishlist,
   Saved builds, Quotations, Addresses, Sign out. Signed-out state shows a Sign in button and "New customer?
   Start here".
3. **Orders and Wishlist reachable from the header** ("Returns & Orders" on Amazon, heart on Flipkart).
   We already have wishlist hearts on every card but nowhere to see the list without opening Account.
4. **Search scope selector** ("All ▾" on Amazon) using our categories, and **typo tolerance**: "moter"
   returns 0 results today with no "Did you mean motor?". Add trigram matching (pg_trgm is already
   installed) and a did-you-mean line.
5. **Category bar**: add Frames (missing; it is in the menu but not the bar), and Deals / New arrivals once
   their data exists. Keep "Build your drone" and "Bulk orders" on the right.
6. **Mega menu**: today it is a plain list of 8 names. Show each category with a picture, its top
   sub-categories (e.g. Motors → by size / KV range) and one "shop by build" link. Hover-open with a short
   delay on desktop, tap on touch.
7. **Announcement bar**: the scrolling ticker is hard to read and looks busy. Replace with one static line
   (or 2–3 messages that rotate slowly and pause on hover), each a link.

---

## 2. Product card — used on home, listing, search, related rails

Amazon / Flipkart cards show, in this order: image, title (2 lines), rating, price with MRP struck and
"% off", offer line, delivery date. Ours show category, title, a spec line, price, "In stock", a small cart
icon.

1. **One image frame**: square, white, `object-contain`, image fills the frame. Today the image is
   letterboxed inside a grey area and the card is visibly split into two boxes with a gap.
2. **Price**: drop ".00" (₹14,999, as every Indian store does). Show MRP struck through and "x% off" when a
   compare-at price exists (Medusa `compare_at_unit_price` / price lists — real data only).
3. **Rating** (stars + count) once reviews exist; nothing when there are none.
4. **Delivery line**: "Delivery by Thu, 13 Nov" from the saved pincode.
5. **Stock**: hide "In stock" when it is (it is noise on every card); show "Only 3 left" or "Out of stock —
   notify me".
6. **Add to cart**: a labelled button, not a 40px icon; quantity stepper after the first add.
7. One heart, top-right, consistent.

---

## 3. Listing and search (/parts, /uavs, /search)

1. **Spec filters per category** — this is what parts buyers actually filter by: motors by KV and stator
   size, batteries by cell count (S) and mAh, props by diameter/pitch, ESCs by amps and cells, FCs by
   firmware. Driven by the existing spec templates.
2. Counts next to every filter value; applied filters as removable chips above the grid with "Clear all".
3. Brand filter hidden until real brands exist.
4. "Best Selling" sort is the default but there is no sales data yet — default to "Featured" (admin order)
   until analytics can back it.
5. Results header: "1–24 of 312 results for 'motor'" like Amazon.
6. Phone: filters in a bottom sheet with a sticky "Show 24 results" button; sort as a separate button.

---

## 4. Product page

The bones are good (gallery, specs table, frequently bought together, works-with). Missing pieces versus a
big store's buy box:

1. **Under the title**: rating summary link (when reviews exist), brand link.
2. **Price block**: MRP struck, "x% off", "Inclusive of all taxes", EMI line if Razorpay offers it.
3. **Available offers** list from the new admin promotions (the `promotions` work in progress) — coupon
   codes, bank offers, bulk price breaks.
4. **Delivery block above the buttons**: "Delivery by Thu, 13 Nov to 751024 · Change". Today the pincode
   box is below the buttons and partly off-screen at 1440×900.
5. **Policy line next to the buttons**: return/replacement window, warranty, "GST invoice". Today these
   are in a strip below the gallery, away from the decision.
6. **Buttons**: Buy Now is a pale outline and reads as secondary-disabled. Two clear filled buttons
   (Flipkart uses two strong colours side by side); keep Add to Cart primary.
7. **Sticky buy bar** when the main buttons scroll out of view (price + Add to Cart), desktop and phone.
8. **Gallery**: thumbnail rail and zoom are useless with one image per product — content task, see 0.3.
9. Section tabs (Overview / Specifications / Reviews / Q&A) sit below two product rails; move them up so
   specs come right after the buy box, then frequently bought together, then works-with.

---

## 5. Home page

Amazon/Flipkart homes put products and offers on the first screen. Ours spends the whole first screen on a
grey photo and a slogan; the first product appears after ~2.5 screens.

1. **Hero**: cut to about 320–380px high and make the slides real offers or launches set in the admin
   (each with a destination). The current black-and-white drone photo with "Parts that fly together." looks
   like a template.
2. **Category tiles**: the product cut-outs are ~30px inside large white cards. Make the picture fill the
   tile; 8 tiles in one row on desktop, horizontal scroll on phone.
3. Remove the empty band (~100px) between categories and the trust strip.
4. **Rails in this order**: Deals (only when a price list is active) · Continue your build / Recently
   viewed (from the browser) · Best sellers (only when analytics backs it) · per-category rails · Brands.
   The "Featured / Best Sellers / New in Stock …" tabs over the same 8 products should go.
5. Bulk banner and FAQ are fine; keep FAQ short (4 items) with a link to Support.
6. Restock signup: rewrite the copy (see 6) and use a normal email placeholder ("you@example.com").
7. **Footer**: add contact phone/email/WhatsApp, registered address and GSTIN, social links, a short
   policies row (Shipping, Returns, Warranty, Privacy, Terms), and "Secured by Razorpay" with real payment
   logos instead of grey text chips.

---

## 6. Copy — remove the "generated" voice

The words are the main reason the store looks AI-made. Rules: say what it is, plainly, in the words a
buyer uses; sentence case; no claims without proof; no eyebrow labels.

| Today | Replace with |
|---|---|
| "CURATED INVENTORY" + "Verified Drone Hardware" | "Popular parts" |
| "INVENTORY ALERTS" + "Hardware Restock Bulletins & Specs" | "Get restock alerts" |
| "Strictly technical changelogs and restock alerts; zero marketing clutter." | "We email you when parts you follow are back in stock. Nothing else." |
| "engineer@institution.edu or work email" | "you@example.com" |
| "Explore All Components in Store" | "See all parts" |
| "Verified Builder Reviews" / "Authentic feedback from pilots and engineers testing on bench and field." | "Customer reviews" (and no subtitle) |
| "Questions & Technical Answers" / "Verified wiring pinouts, voltage compatibility…" | "Questions and answers" |
| "Works With: Verified Compatible Parts" / "Validated by Skyrostore compatibility rule engine…" | "Works with this part" |
| "Fit & Compatibility Engine — Parameter validation checks voltage, current & prop sizing" | "We check your parts fit together" |
| "Add ₹x more to unlock FREE Air Express Shipping" | "Add ₹x more for free delivery" (only if the offer is real) |
| Mixed Title Case headings | Sentence case everywhere |

Also remove the small uppercase badge labels and the icon-in-a-box trust tiles, which are the most common
template tells.

---

## 7. Phone (most Indian buyers)

1. Live pass at 390px over every page above (not done in this audit — code only).
2. Product page: sticky bottom bar with price + Add to Cart + Buy Now.
3. Listing: filter bottom sheet (3.6), 2-column grid.
4. Cart: sticky checkout bar with total.
5. Header: Deliver-to chip on its own thin row under search (as Amazon app/web does).

---

## 8. Cart

1. Fix 0.1.
2. GST: prices are "incl. GST", but the summary adds an "Estimated 18% GST" line — reads as GST charged
   twice. Show "Includes ₹x GST" under the total instead.
3. Shipping row says "Flat Rate" with no amount; show the amount or "Free".
4. Delivery date per line from the saved pincode.
5. "Save for later" list under the cart (already in code — check it shows).
6. Remove the 3-second skeleton flash: render from the header's already-loaded cart.

---

## 9. Sideways rows (added 11 Nov, done)

1. A small fixed set never scrolls: the 8 categories are a 4 × 2 grid on phones (picture over name) and one
   row of 8 from 1280px.
2. A row that must scroll (product shelves, gallery thumbnails, tab strips) never shows a native scrollbar.
   It says "more this way" with a peeking next card (phones show 2 cards and a slice), a fade on whichever
   edge has more, and on desktop arrow buttons that appear only when the row overflows and dim at the ends.
3. Nothing on a page may be wider than the screen (the restock card was 19px too wide on phones; fixed).

## 10. Small phones (audit 11 Nov, done 11 Nov except the real-phone check in 10.3)

Method: every page loaded at 320, 360 and 390px wide (touch, mobile viewport) with Playwright. Measured:
pages wider than the screen, inputs under 16px (iOS zooms the page on focus), tap targets under 40px,
and full-page screenshots at 360px read by eye. Emulation, not a real phone: items marked (device) must be
confirmed on hardware.

### 10.1 What is broken

| Where | Problem | Cause |
|---|---|---|
| Every page at 320px | Page drags sideways by 4px | Announcement bar line is `whitespace-nowrap` and 328px long |
| Product pages at 320 and 360px | Page is 388px wide; buy box and title run off the right edge | Main grid has no column rule, so the single phone column grows to its widest content; also a second `sticky` wrapper added around a gallery that already has one |
| Product page tabs | "Q&A" cut off at the edge | Tab row does not fit and has no scroll affordance |
| Product page reviews / questions (empty) | Sentence squeezed into a narrow column beside its button | Text and button side by side at every width |
| Product page "Buy it with" | Three tiles and "+" signs wrap into a ragged 2 + 1 grid | Desktop row layout reused on phones |
| Product page "Works with" cards | "In stock" breaks over two lines beside the Add button | Price, stock and button forced into one row in a 150px card |
| Build your drone | Price and "Select" button overlap ("₹6,499Select") | Same one-row price + action in a two-column grid |
| Bulk quote request | Item table cut off ("Unit Price", "Total" hidden) | Desktop table inside a clipped card |
| Sign in, forgot password, orders search, bulk request, support, brands | Page zooms in when the field is tapped (device) | Inputs at 13–14px |
| Bulk orders (5,600px) and Support (5,000px) | Very long scroll; cards inside cards lose a third of the width to padding | Desktop card nesting kept on phones |
| Footer on every page | About 700px of stacked link lists | Four columns stack one under another |
| Small targets | Hero dots 16×6px, wishlist / quick view 32px, A–Z brand letters 32px, bulk step circles 28px, inline links 16–20px tall | Desktop sizes |
| Quick view buttons | Screen readers hear "[DEV]" in the label | Title not passed through `cleanName` |
| Copy still making claims on phone pages | Support "Orders over ₹5,000 qualify for free standard shipping", "Instant serviceability & transit SLA"; sign-in "GST Compliance Verified"; bulk orders tier rebates (8 / 15 / 22 %), "Certificate of Conformance", "within one business day" | Old copy, unconfirmed |

### 10.2 Fixes, in order

1. **Global baseline** (one file each, fixes every page at once):
   - `globals.css`: inputs, selects and textareas at 16px minimum; `-webkit-tap-highlight-color: transparent`;
     `touch-action: manipulation` on links and buttons; hover styles only under `(hover: hover)` (Tailwind 4
     already does this for `hover:`; check the hand-written `:hover` rules in globals.css); `overflow-wrap:
     anywhere` on long tokens (SKUs, emails) inside cards.
   - `layout.tsx`: `viewport` export with `viewport-fit=cover` and `theme-color` matching the header, so the
     sticky bottom bars can pad for the home indicator with `env(safe-area-inset-bottom)` (device).
   - Announcement bar: allow wrapping or shorten the phone line ("Secure payment by Razorpay").
2. **Page shells**: every two-column page grid gets `grid-cols-[minmax(0,1fr)]` below its desktop breakpoint
   (product, cart, checkout, bulk request, support, account). Remove the extra sticky wrapper on the product
   page.
3. **Cards on phones**: one level of card only. Inner panels lose their border and padding below `sm`, so
   content gets the full 328px instead of about 260px. Applies to bulk orders, support, bulk request, account
   sign-in, product sections.
4. **Price + action rows** (product tile action slot, builder tiles, "Works with" cards): stack price above a
   full-width button below `sm`, as the main product card already does.
5. **Product page**: tabs become a full-width segmented row (four equal tabs, short labels: Overview, Specs,
   Reviews, Q&A); empty reviews / questions stack text over button; "Buy it with" becomes a vertical list
   with checkboxes on phones (thumbnail, name, price per row) instead of tiles and "+" signs.
6. **Bulk quote table**: below `md`, each line becomes a stacked row (name, then price × quantity = total).
7. **Long pages**: bulk orders and support get shorter phone versions — tier cards become a compact list,
   process steps a numbered `<ol>`, FAQs stay collapsed, the knowledge grid two columns of short tiles.
8. **Footer on phones**: the three link columns become collapsible groups (`<details>`), contact emails stay
   open; cuts it to about 300px.
9. **Tap targets**: 44px minimum hit area on icon buttons (wishlist, quick view, rail arrows, A–Z letters,
   step circles) using padding, not bigger icons; hero dots get a 44px invisible hit area; inline text links
   in lists get `py-2`.
10. **Copy**: remove or rewrite the claims in the last table row, same rule as section 6; owner confirms any
    to restore.
11. **Labels**: pass titles through `cleanName` in quick view and compare buttons.

### 10.3 Done when

- No page is wider than the screen at 320, 360, 390 and 768px (scripted check, all routes above).
- No input under 16px; no visible control with a hit area under 44 × 44px except inline links in running
  text.
- Screenshots at 360px read cleanly by eye for every route, menu, cart drawer, search dropdown and filter
  sheet open.
- Checked once on a real Android and iPhone over the LAN (device items: zoom on focus, home-indicator
  padding, sticky bars, keyboard covering inputs).

## Order of work

| # | Work | Needs from the team |
|---|---|---|
| 1 | Section 0 (bugs, header gap, titles, duplicate buttons) | Confirmation of each trust claim in 0.5 |
| 2 | Section 6 copy pass across home, product, cart, footer | — |
| 3 | Header: deliver-to pincode, account menu, orders/wishlist, static announcement bar, search typo tolerance (1.1–1.4, 1.7) | — |
| 4 | Product card + listing filters (2, 3) | Compare-at prices if any |
| 5 | Product page buy box, offers, sticky bar (4) | Return/warranty terms |
| 6 | Home restructure + footer (5) | Hero offers, contact details, GSTIN |
| 7 | Phone pass and fixes (7), cart polish (8) | — |
| 8 | Mega menu with pictures and sub-categories (1.5, 1.6) | Category pictures, sub-category list |

## Content the team must supply

- Real product photos (square, white background, several per product) — the single biggest visual fix.
- Real catalogue and brands (no "[DEV]", no "k").
- Written confirmation of dispatch time, delivery coverage, warranty, return window, distributor status.
- Contact phone/email/WhatsApp, registered address, GSTIN for the footer.
- Hero offers and category pictures.
