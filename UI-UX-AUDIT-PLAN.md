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
