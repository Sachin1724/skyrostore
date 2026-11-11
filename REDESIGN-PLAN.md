# Skyrostore storefront redesign — plan

Status: proposed, 2 November 2026. Nothing below is built yet.

## Inputs

- **Brand:** the logo is blue. The exact logo file and hex are still needed; the palette is built on it.
- **Art direction:** tasteskill v2 dealt **"The split stage"** (seed 1726241845). Type was redrawn once
  from EB Garamond to **Zilla Slab**: a whisper serif cannot carry spec tables, prices and tabular
  figures; a technical slab can.
- **UX rules:** ui-ux-pro-max for e-commerce. Its suggested green/orange palette is rejected (brand is
  blue); its *configurator* pattern and checklist are adopted.
- **Motion:** anime.js v4 for micro-interactions, CSS for entrances. Every move has a
  `prefers-reduced-motion` fallback.

## What only Skyrostore has (inventory)

1. Every motor is a number pair: KV and stator (`2207`, `5010`, `KV400`).
2. Props are named by size × pitch (`15×5.5`); packs by cells and C (`6S 50C`).
3. The store **checks a build for compatibility** before you buy. Competitors list parts; this one
   tells you whether they fly together.
4. A quad, seen from above, is an X: frame, four motors, four props, one pack.
5. Ships from Odisha; every parcel gets a Delhivery AWB and a printed label.
6. Bulk orders with quotations for teams and institutions.
7. Carbon-fibre weave, solder joints, XT60 connectors: the materials of the trade.
8. Prices in rupees, GST invoice.

## The idea

> On this page, **the build of a quad — frame, four motors, props, ESC, 6S pack** becomes **the fixed
> stage that assembles part by part as the visitor scrolls the catalogue.**

Competitor test: a generic drone shop can show a drone; it cannot show *your* parts fitting together,
because it has no compatibility engine. Skyrostore can.

**The live thing:** a compatibility check in the hero's reading column. The visitor picks a motor
(by KV), a prop and a pack, and sees the real verdict from the existing compatibility engine. It
works with a thumb, and without script it is a plain link to the builder.

## Look

- **Palette:** the logo blue as the single accent (actions, live verdict). The ground is a pale
  blue-white, the ink is a deep navy, and a full-field navy section breaks the page once. No gradients,
  no violet.
- **Type:** Zilla Slab only, with tabular figures for prices and specs. Five sizes at most; the big
  one is genuinely big.
- **Removed:** the lime accent, JetBrains Mono labels, small uppercase tracked labels, card grids,
  shadows at rest. These read as generated and fail the house rules.
- **Imagery:** the project's own product renders in `public/images` first. Real photographs come
  next: the store's own packing and workshop shots should be taken, plus credited archival
  aviation/engineering pictures. No fake product shots.

## Pages

| Page | Composition |
|---|---|
| **Landing** | Split stage. Left: sticky stage where the quad assembles as sections pass. Right: reading column with the name, one sentence, the live compatibility check, then categories as a *printed parts sheet*, how ordering works as a *shipping slip* (pay → pack → AWB → delivered), a draggable gallery, FAQ as reading text, and the closing photograph with **Buy Now**. |
| **Brand bar** | A slow horizontal scroll of the real brands in the catalogue as wordmarks (T-Motor, Holybro, u-blox…), each linking to its brand page. Pauses on hover and focus, and stops under reduced motion. Only brands that exist in the database. |
| **Category** | The shop-by facets already built (KV, stator, cells…) as a left rail. Products as a dense list with the spec that matters per type, not a card grid. |
| **Product** | Spec sheet as a real table, compatibility with your saved build, sticky Buy bar on phones. |
| **Checkout** | One **Buy Now** with "Secured by Razorpay" (built). |
| **Order success** | The quad's outline draws itself, the checkmark lands, and the order number and next steps appear as a slip (packing → Delhivery AWB → tracking). About 1.2s in total, skippable, reduced-motion shows the final state. |
| **Skeletons** | Each route gets a `loading.tsx` that mirrors its real layout (same boxes, same sizes, no layout shift), with one slow tone pulse. No spinners. |

## Admin: edit content and upload files

1. **Content editor:** a `site_content` table (key → JSON, with draft and published versions). The
   admin edits the hero sentence, the featured categories, the brand bar order, the FAQ and the closing
   line, and previews before publishing. Publishing revalidates the storefront cache by tag, so changes
   appear in seconds without a deploy.
2. **Media library:** drag-and-drop upload with progress, alt text required before saving, reuse
   across products and content, and delete only when unused. Storage goes through Medusa's file module,
   moving to S3/Cloudinary at launch.

## Order of work

1. Get the logo, then set the tokens: palette, type, spacing and motion as CSS variables. Swap the
   site-wide theme first so every page moves together.
2. Landing page plus the live compatibility check.
3. Skeletons for every route, then the category, product and cart pages to the new look.
4. Order-success animation (anime.js).
5. Admin content editor and media library.
6. Gate each page: the taste inspector at 1440/768/390 with zero FAILs, Lighthouse ≥ 90, axe with no
   critical issues, keyboard pass, and the reduced-motion pass.

## Needed from the client

- The logo as SVG (or a large PNG) and the exact brand blue.
- Real photographs: workshop, packing, a finished build. Phone photos in good light are fine.
- Which brands to show in the brand bar, if not all.
