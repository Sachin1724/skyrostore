# Storefront completion plan

Status: proposed, 3 November 2026. Follows ECOMMERCE-PLAN.md (phases 1–5 shipped).

The goal: a store that works like a large, professional multi-category shop (Amazon / Robu / RCMumbai level),
selling UAV parts and complete drones. Same blue look, same "no fake data" rule: every section is driven by
data the team enters in the admin, and hides itself when that data is empty.

## What was found

| Area | What the old page had | What happened | Real cause |
|---|---|---|---|
| Product page tabs | Overview, Specifications, Compatibility, What's Included, Documentation, Reviews | Replaced by three cards | The old tabs were mostly hard-coded text: the same "box contents" for every product, a "2.4 MB datasheet" that does not exist, "CE & RoHS certified", "QA certificate". They had to go, but the **structure** should come back, filled from real fields. |
| Key features | Bullet list | Gone | Old list was generic fallback copy. Needs a real `key_features` field. |
| Multiple images | Vertical thumbnail stack | Gallery supports many images, but shows one | Every product in the database has **0 or 1** image. Admin can upload more; nobody has yet. |
| Image alignment | — | Photos look cropped and off-centre | The stored images are **screenshots of old product cards** (with "In Stock" text and a heart icon baked in), not product photos. |
| Brand marquee | Scrolling brand band | Hidden | The catalogue has **one** brand, named "k", attached to one product. The band hides below 3 brands. |
| Product names | — | Show "[DEV]" in some feeds | The 8 products are seed data. |

## Plan

### A. Product page: full large-store anatomy (code)

1. **Sticky section tabs** under the buy box: Overview · Specifications · Compatibility · In the Box ·
   Documents · Reviews · Questions. Tabs are anchor links that scroll to each section and highlight on
   scroll (deep-linkable `#specifications`). A tab appears only when its section has data.
2. **Overview**: description (rich text from admin) + **Key features** bullet list (`key_features` field).
3. **Specifications**: grouped two-column table on desktop (General, Electrical, Mechanical, from the
   existing spec templates), units with non-breaking spaces, copy-as-text button.
4. **Compatibility** (real, from the compatibility engine): "Works with" — catalogue products that pass the
   engine against this one (motor → props, packs, ESCs; frame → motors, props). New backend route
   `GET /store/products/:id/compatible`. Plus "Check in your build" link that pre-selects this part.
5. **In the Box**: list from `in_the_box` field.
6. **Documents**: datasheets, manuals, pinouts uploaded as PDFs through the media library; each shows real
   file name and size.
7. **Reviews and Questions** (needs backend, see D): rating summary, verified-buyer reviews, Q&A answered by
   the team. Hidden until the first one exists — no "0 reviews" stars.
8. **Gallery**: vertical thumbnail rail on desktop (as before), swipeable on phones, video slot if a
   product has a video URL, zoom on click/hover.
9. **Buy box additions**: warranty line (`warranty` field), HSN code and GST rate on the invoice line,
   "Ships in X days" from a per-product dispatch field (only if set), share button (native share sheet).
10. **Below the fold**: Frequently bought together (from the compatibility engine until order data exists),
    Related products, **Recently viewed** (stored in the browser).

### B. Images that line up (code + content)

1. One image frame everywhere: fixed square, white ground, same inner padding, `object-contain`, centred.
2. Admin upload rules: at least 1000×1000, warn when not square, warn on screenshots (very wide or tall).
3. Replace the 8 seed images with real product photos (content task for the team).

### C. Brands (code + content)

1. Admin: brand logo upload, description, "official distributor" flag (shown only when set).
2. Assign every product a brand (T-Motor, Holybro, u-blox, CUAV, Hobbywing…). Rename or delete "k".
3. Home: brand logo marquee (pauses on hover; static row when fewer than 6 brands, hidden at 0).
4. `/brands`: A–Z jump bar, logo grid with product counts; brand page header with logo and description.

### D. Store features that need backend work

| Feature | Backend |
|---|---|
| Reviews with star rating (verified buyers only) | New `review` module, moderation in admin |
| Product questions and answers | Same module, `question` table |
| Wishlist (heart on cards, account tab) | Customer-scoped wishlist table |
| Home hero carousel and promo banners | `site_content` gains a banners list, admin editor |
| Deals / sale rail and "% off" | Medusa price lists (already supported) |
| Best sellers sort and rail | First-party analytics (already collected) |
| Newsletter signup | Resend audience (Resend is in the stack) |
| Stock alerts ("Notify me" when out of stock) | Small table + email on restock |

### E. Header, listing and account polish

1. Mega menu with category images and the top 3 sub-categories per column.
2. Account dropdown: Orders, Quotations, Sign out (shows name when signed in).
3. Listing: quick-view dialog from the card, "Compare" for up to 4 parts of the same type with a
   side-by-side spec table, sort by Best selling once D lands.
4. Search: recent searches, popular categories in the empty dropdown, "did you mean".
5. Account: wishlist, reviews written, saved builds from the builder.

### F. Admin fields this needs (one migration-free step: product metadata)

`key_features` (list), `in_the_box` (list), `documents` (media ids), `warranty` (text), `hsn_code`,
`gst_rate`, `dispatch_days`, `video_url`. Edited on the admin product page as proper inputs, not raw JSON.

## Order of work

| # | Work | Needs from the team |
|---|---|---|
| 1 | Admin fields (F) + product page tabs, overview, specs, in-the-box, documents (A1–A3, A5, A6, A9) | — |
| 2 | Gallery rail + image frame + upload checks (A8, B1, B2) | Real photos |
| 3 | Compatible parts route + Works With + Frequently bought together (A4, A10) | — |
| 4 | Brand logos, marquee, brands index (C) | Brand list and logos |
| 5 | Reviews, questions, wishlist (A7, D) | — |
| 6 | Hero banners, deals rail, best sellers, newsletter, stock alerts (D) | Banner images, newsletter decision |
| 7 | Mega menu, account dropdown, quick view, compare, search extras (E) | — |
| 8 | Guideline audit of every changed page, Lighthouse ≥ 90, axe clean | — |

## Content the team must supply (code cannot fake it)

- Real product photos (several per product), datasheets and manuals as PDF.
- Brand list with logos; correct brand on every product.
- Real catalogue to replace the 8 "[DEV]" seed products.
- Key features, box contents and warranty per product.
- Written confirmation of any trust claim (dispatch time, warranty terms, official distributor status).
