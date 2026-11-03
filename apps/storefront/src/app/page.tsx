import Link from "next/link";
import Image from "next/image";
import { CreditCard, FileText, ShieldCheck, Truck } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CompatCheck } from "@/components/home/compat-check";
import { BrandBar } from "@/components/home/brand-bar";
import { ProductCard } from "@/components/product/product-card";
import { getProducts } from "@/lib/data/products";
import { getUAVComponents, type UAVComponent } from "@/lib/data/uav-components";
import { getBrands, getCatalogIndex, getCategoryTree, countForNode, cleanName } from "@/lib/data/catalog";
import { getSiteContent } from "@/lib/data/site-content";

/** A one-line spec a builder recognises, from the product's own metadata. */
function summary(c: UAVComponent): string {
  const m = c.metadata;
  const name = cleanName(c.title);
  if (c.component_type === "MOTOR" && m.kv) return `${name} · KV${m.kv}`;
  if (c.component_type === "PROPELLER" && m.diameter_in) return `${name} · ${m.diameter_in}×${m.pitch_in ?? "?"}`;
  if (c.component_type === "BATTERY" && m.cell_count) return `${name} · ${m.cell_count}S ${m.capacity_mah ?? ""}mAh`;
  return name;
}

// Line drawings in public/images/products, matched to a category by its name.
const TILE_ART: [RegExp, string][] = [
  [/uav|drone/i, "cat-complete-uavs"],
  [/flight/i, "cat-flight-controllers"],
  [/esc|speed/i, "cat-escs"],
  [/motor/i, "cat-motors"],
  [/prop/i, "cat-propellers"],
  [/batter|lipo/i, "cat-batteries"],
  [/gps|gnss/i, "cat-gps"],
  [/frame/i, "cat-frames"],
];
const tileArt = (name: string) => TILE_ART.find(([re]) => re.test(name))?.[1];

const TRUST = [
  { icon: Truck, title: "Tracked delivery", text: "Courier tracking number on every parcel" },
  { icon: CreditCard, title: "Secure payment", text: "UPI, cards and netbanking via Razorpay" },
  { icon: FileText, title: "GST invoice", text: "With every order, prices include GST" },
  { icon: ShieldCheck, title: "Fit checked", text: "Compatibility check before you buy" },
];

const sectionTitle = "text-[clamp(1.4rem,1.1rem+1vw,1.75rem)] font-extrabold tracking-[-0.02em] text-navy";

export default async function HomePage() {
  const [tree, brands, index, { products }, components, content] = await Promise.all([
    getCategoryTree(),
    getBrands(),
    getCatalogIndex(),
    getProducts({ limit: 40 }),
    getUAVComponents(),
    getSiteContent(),
  ]);

  const options = Object.fromEntries(
    (["MOTOR", "PROPELLER", "BATTERY"] as const).map((t) => [
      t.toLowerCase(),
      (components[t] || []).map((c) => ({ variant_id: c.variant_id, title: cleanName(c.title), price: c.price, summary: summary(c) })),
    ])
  );
  const categories = tree.map((node) => ({ node, count: countForNode(node, index) })).filter((c) => c.count > 0);
  const brandRow = brands
    .map((b) => ({ handle: b.handle, title: b.title, count: index.byBrand.get(b.id) ?? 0 }))
    .filter((b) => b.count > 0);
  const newest = products
    .filter((p) => {
      const v = p.variants?.[0];
      return v?.manage_inventory === false || v?.inventory_quantity == null || v.inventory_quantity > 0;
    })
    .sort((a, b) => String(b.created_at ?? "").localeCompare(String(a.created_at ?? "")))
    .slice(0, 8);

  return (
    <>
      <Header />
      <main id="main" className="bg-page pb-16">
        <div className="mx-auto max-w-[1376px] space-y-12 px-4 pt-5 md:px-8 md:pt-6">
          {/* Hero */}
          <section className="grid overflow-hidden rounded-xl bg-navy lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div className="flex flex-col justify-center gap-5 px-6 py-10 text-white md:px-12 md:py-14">
              <h1 className="text-[clamp(2rem,1.3rem+2.6vw,3.25rem)] font-extrabold leading-[1.05] tracking-[-0.03em] text-balance">
                {content.heroTitle}
              </h1>
              <p className="max-w-[46ch] text-[17px] leading-relaxed text-[#C9D6E6]">{content.heroSentence}</p>
              <div className="flex flex-wrap gap-3 pt-1">
                <Link href="/parts" className="inline-flex h-12 items-center rounded-md bg-white px-6 text-[16px] font-semibold text-navy hover:bg-brand-soft">
                  Shop Parts
                </Link>
                <Link href="/uavs" className="inline-flex h-12 items-center rounded-md border border-white/50 px-6 text-[16px] font-semibold text-white hover:border-white">
                  Complete Drones
                </Link>
              </div>
            </div>
            <div className="relative hidden min-h-[360px] bg-graphite-soft lg:block">
              <Image src="/images/hero/storefront-hero-drone.png" alt="" fill priority sizes="50vw" className="object-contain p-6" />
            </div>
          </section>

          {/* Trust row: only facts the store's own checkout and policies back. */}
          <ul className="!mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border lg:grid-cols-4">
            {TRUST.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex items-center gap-3 bg-white p-4 md:px-5">
                <Icon className="h-7 w-7 shrink-0 text-brand" strokeWidth={1.6} aria-hidden />
                <span>
                  <span className="block text-[14px] font-bold text-navy">{title}</span>
                  <span className="block text-[13px] text-text-secondary">{text}</span>
                </span>
              </li>
            ))}
          </ul>

          {categories.length > 0 ? (
            <section aria-labelledby="shop-category">
              <div className="flex items-baseline justify-between gap-4">
                <h2 id="shop-category" className={sectionTitle}>Shop by Category</h2>
                <Link href="/parts" className="text-[14px] font-semibold text-brand hover:text-navy">All parts</Link>
              </div>
              <ul className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-8">
                {categories.map(({ node, count }) => {
                  const art = tileArt(node.name);
                  return (
                    <li key={node.id}>
                      <Link
                        href={`/parts?category=${node.handle}`}
                        className="flex h-full flex-col items-center gap-2.5 rounded-lg border border-border bg-white px-2 py-4 text-center transition-colors hover:border-brand"
                      >
                        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-soft">
                          {art ? <Image src={`/images/products/${art}.png`} alt="" width={36} height={36} /> : null}
                        </span>
                        <span className="text-[14px] font-semibold leading-tight text-navy">{node.name}</span>
                        <span className="text-[12px] tabular-nums text-text-muted">{count} {count === 1 ? "item" : "items"}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}

          {newest.length > 0 ? (
            <section aria-labelledby="new-in-stock">
              <div className="flex items-baseline justify-between gap-4">
                <h2 id="new-in-stock" className={sectionTitle}>New in Stock</h2>
                <Link href="/parts?stock=1" className="text-[14px] font-semibold text-brand hover:text-navy">View all</Link>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
                {newest.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
            </section>
          ) : null}

          {/* Live compatibility check, using the same engine as the builder. */}
          <section aria-labelledby="build-check" className="grid gap-6 rounded-xl border border-border-strong bg-brand-soft p-5 md:p-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:items-center">
            <div>
              <p className="text-[13px] font-bold text-brand">Build checker</p>
              <h2 id="build-check" className={`${sectionTitle} mt-1`}>Check your parts fit before you pay</h2>
              <p className="mt-2 max-w-[44ch] text-[15px] leading-relaxed text-text-secondary">
                Pick a motor, prop and battery. The check compares their published specs: voltage range, prop size and current.
              </p>
            </div>
            <CompatCheck options={options} />
          </section>
        </div>

        <div className="mt-12">
          <BrandBar brands={brandRow} />
        </div>

        <div className="mx-auto mt-12 max-w-[1376px] space-y-12 px-4 md:px-8">
          <section className="flex flex-col gap-5 rounded-xl bg-navy px-6 py-8 text-white md:flex-row md:items-center md:justify-between md:px-10">
            <div>
              <p className="text-[13px] font-bold text-accent">Bulk orders</p>
              <h2 className="mt-1 text-[clamp(1.4rem,1.1rem+1vw,1.75rem)] font-extrabold tracking-[-0.02em]">{content.closingTitle}</h2>
              <p className="mt-2 max-w-[52ch] text-[15px] text-[#C9D6E6]">{content.closingSentence}</p>
            </div>
            <Link href="/bulk-orders/request" className="inline-flex h-12 shrink-0 items-center self-start rounded-md bg-white px-6 text-[16px] font-semibold text-navy hover:bg-brand-soft md:self-auto">
              Request a Quote
            </Link>
          </section>

          <section aria-labelledby="faq" className="max-w-[880px]">
            <h2 id="faq" className={sectionTitle}>Questions</h2>
            <div className="mt-3 divide-y divide-border border-y border-border">
              {content.faq.map(({ q, a }, i) => (
                <details key={q} open={i === 0} className="group">
                  <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-3 text-[16px] font-semibold text-navy hover:text-brand">
                    {q}
                    <span aria-hidden className="text-[22px] font-medium text-brand group-open:rotate-45 motion-safe:transition-transform">+</span>
                  </summary>
                  <p className="pb-4 text-[15px] leading-relaxed text-text-secondary">{a}</p>
                </details>
              ))}
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
