import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { BuildStage } from "@/components/home/build-stage";
import { CompatCheck } from "@/components/home/compat-check";
import { BrandBar } from "@/components/home/brand-bar";
import { ProductMediaFallback } from "@/components/product/product-media-fallback";
import { getProducts } from "@/lib/data/products";
import { getUAVComponents, type UAVComponent } from "@/lib/data/uav-components";
import { getBrands, getCatalogIndex, getCategoryTree, countForNode, cleanName } from "@/lib/data/catalog";
import { formatPrice } from "@/lib/utils";
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

export default async function HomePage() {
  const [tree, brands, index, { products }, components, content] = await Promise.all([
    getCategoryTree(),
    getBrands(),
    getCatalogIndex(),
    getProducts({ limit: 12 }),
    getUAVComponents(),
    getSiteContent(),
  ]);

  const options = Object.fromEntries(
    (["MOTOR", "PROPELLER", "BATTERY"] as const).map((t) => [
      t.toLowerCase(),
      (components[t] || []).map((c) => ({ variant_id: c.variant_id, title: cleanName(c.title), price: c.price, summary: summary(c) })),
    ])
  );
  const categories = tree
    .map((node) => ({ node, count: countForNode(node, index) }))
    .filter((c) => c.count > 0);
  const brandRow = brands
    .map((b) => ({ handle: b.handle, title: b.title, count: index.byBrand.get(b.id) ?? 0 }))
    .filter((b) => b.count > 0);

  return (
    <>
      <Header />
      <main id="main" className="bg-[#F4F8FC]">
        <div className="lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
          {/* The fixed half: the quad assembles as the column scrolls. */}
          <div className="h-[30svh] lg:sticky lg:top-16 lg:h-[calc(100svh-4rem)]">
            <BuildStage />
          </div>

          <div className="px-5 md:px-10">
            <section data-stage="1" className="pb-24 pt-10 lg:pt-24">
              <h1 className="text-[clamp(3rem,1.6rem+5vw,6.5rem)] font-bold leading-[0.95] tracking-[-0.04em] text-balance text-navy">
                {content.heroTitle}
              </h1>
              <p className="mt-6 max-w-[40ch] text-[clamp(1.125rem,1rem+0.5vw,1.375rem)] leading-[1.5] text-navy">
                {content.heroSentence}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/parts" className="inline-flex min-h-12 items-center bg-navy px-7 text-[16px] font-semibold text-white hover:bg-brand">
                  Shop parts
                </Link>
                <Link href="/uavs" className="inline-flex min-h-12 items-center bg-white px-7 text-[16px] font-semibold text-navy hover:text-brand">
                  Complete drones
                </Link>
              </div>
              <div className="mt-12">
                <CompatCheck options={options} />
              </div>
            </section>

            <section data-stage="2" aria-labelledby="shop-parts" className="pb-24">
              <h2 id="shop-parts" className="text-[clamp(2rem,1.4rem+2.4vw,3.25rem)] font-bold leading-[1] tracking-[-0.03em] text-balance text-navy">
                Shop by part
              </h2>
              <ul className="mt-8 bg-white px-6 py-4">
                {categories.map(({ node, count }) => (
                  <li key={node.id}>
                    <Link
                      href={`/parts?category=${node.handle}`}
                      className="group flex items-baseline justify-between gap-6 py-4 text-navy"
                    >
                      <span className="text-[clamp(1.25rem,1.05rem+0.8vw,1.75rem)] font-semibold group-hover:text-brand">
                        {cleanName(node.name)}
                      </span>
                      <span className="text-[16px] tabular-nums text-text-secondary">
                        {count} {count === 1 ? "product" : "products"}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>

        <BrandBar brands={brandRow} />

        <div className="lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
          <div className="hidden lg:block" />
          <div className="px-5 md:px-10">
            <section data-stage="3" aria-labelledby="in-stock" className="py-24">
              <div className="flex items-baseline justify-between gap-4">
                <h2 id="in-stock" className="text-[clamp(2rem,1.4rem+2.4vw,3.25rem)] font-bold leading-[1] tracking-[-0.03em] text-balance text-navy">
                  In stock now
                </h2>
                <Link href="/parts" className="text-[16px] font-semibold text-brand hover:text-navy">
                  All parts
                </Link>
              </div>
              <ul tabIndex={0} aria-label="Products in stock, scroll sideways" className="mt-8 flex snap-x gap-4 overflow-x-auto overscroll-x-contain pb-4 [scrollbar-width:none]">
                {products.map((p) => {
                  const price = p.variants?.[0]?.calculated_price?.calculated_amount;
                  return (
                    <li key={p.id} className="w-[72%] shrink-0 snap-start sm:w-[44%] xl:w-[34%]">
                      <Link href={`/products/${p.handle}`} className="group block">
                        <div className="relative aspect-[4/5] bg-white">
                          {p.thumbnail ? (
                            <Image src={p.thumbnail} alt={cleanName(p.title)} fill sizes="(min-width:1280px) 22vw, (min-width:640px) 44vw, 72vw" className="object-contain p-6 transition-transform duration-300 group-hover:scale-[1.03]" />
                          ) : (
                            <ProductMediaFallback title={p.title} componentType={(p.metadata as Record<string, string> | null)?.component_type} />
                          )}
                        </div>
                        <p className="mt-3 text-[17px] font-semibold text-navy group-hover:text-brand">{cleanName(p.title)}</p>
                        {price != null ? <p className="text-[16px] tabular-nums text-text-secondary">{formatPrice(price, "INR")}</p> : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>

            <section data-stage="4" aria-labelledby="how-orders" className="pb-24">
              <h2 id="how-orders" className="text-[clamp(2rem,1.4rem+2.4vw,3.25rem)] font-bold leading-[1] tracking-[-0.03em] text-balance text-navy">
                From payment to your door
              </h2>
              <ol className="mt-8 bg-white px-6 py-6">
                {[
                  ["Pay with Razorpay", "UPI, card, net banking or wallet; address filled for you"],
                  ["Checked and packed", "in our Odisha workshop"],
                  ["Courier booked", "Delhivery tracking number by email"],
                  ["Delivered", "live status under My orders"],
                ].map(([title, detail]) => (
                  <li key={title} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-3">
                    <span className="text-[20px] font-semibold text-navy">{title}</span>
                    <span className="text-[16px] text-text-secondary">{detail}</span>
                  </li>
                ))}
                <li className="mt-3 bg-navy px-4 py-3 text-[17px] font-semibold text-white">
                  You hold a GST invoice and a tracked parcel.
                </li>
              </ol>
            </section>

            <section data-stage="5" aria-labelledby="faq" className="pb-24">
              <h2 id="faq" className="text-[clamp(2rem,1.4rem+2.4vw,3.25rem)] font-bold leading-[1] tracking-[-0.03em] text-balance text-navy">
                Questions, answered
              </h2>
              <div className="mt-8 gap-12 text-[17px] leading-[1.6] text-navy md:columns-2">
                {content.faq.map(({ q, a }) => (
                  <p key={q} className="mb-5 break-inside-avoid">
                    <strong className="font-semibold">{q}</strong> {a}
                  </p>
                ))}
              </div>
            </section>
          </div>
        </div>

        <section className="bg-brand-soft">
          <div className="flex flex-col gap-6 px-5 py-20 md:flex-row md:items-end md:justify-between md:px-10">
            <div>
              <h2 className="text-[clamp(2rem,1.4rem+2.4vw,3.25rem)] font-bold leading-[1] tracking-[-0.03em] text-balance text-navy">
                {content.closingTitle}
              </h2>
              <p className="mt-4 max-w-[46ch] text-[18px] text-navy">
                {content.closingSentence}
              </p>
            </div>
            <Link href="/bulk-orders/request" className="inline-flex min-h-12 items-center self-start bg-navy px-7 text-[16px] font-semibold text-white hover:bg-brand md:self-auto">
              Request a bulk quote
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
