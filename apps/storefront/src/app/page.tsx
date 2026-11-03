import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { HeroBanner } from "@/components/home/hero-banner";
import { TrustGrid } from "@/components/home/trust-grid";
import { CategoryGrid } from "@/components/home/category-grid";
import { FeaturedTabs } from "@/components/home/featured-tabs";
import { CompatBanner } from "@/components/home/compat-banner";
import { BrandShowcase } from "@/components/home/brand-showcase";
import { B2BBanner } from "@/components/home/b2b-banner";
import { NewsletterCard } from "@/components/home/newsletter-card";
import { HomeFaq } from "@/components/home/home-faq";
import { RecentlyViewed } from "@/components/product/recently-viewed";
import { getProducts } from "@/lib/data/products";
import { getUAVComponents, type UAVComponent } from "@/lib/data/uav-components";
import { getBrands, getCatalogIndex, getCategoryTree, countForNode, cleanName } from "@/lib/data/catalog";
import { getSiteContent } from "@/lib/data/site-content";

/** One-line specification string for compatibility selector options. */
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
    getProducts({ limit: 40 }),
    getUAVComponents(),
    getSiteContent(),
  ]);

  const options = Object.fromEntries(
    (["MOTOR", "PROPELLER", "BATTERY"] as const).map((t) => [
      t.toLowerCase(),
      (components[t] || []).map((c) => ({
        variant_id: c.variant_id,
        title: cleanName(c.title),
        price: c.price,
        summary: summary(c),
      })),
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
      <main id="main" className="min-h-screen bg-surface-soft pb-20">
        <div className="mx-auto max-w-[1376px] space-y-12 px-4 pt-5 md:px-8 md:pt-6">
          {/* 1. Hero Overview */}
          <HeroBanner title={content.heroTitle} subtitle={content.heroSentence} />

          {/* 2. Value Proposition / Trust Bar */}
          <TrustGrid />

          {/* 3. Shop by Category Grid */}
          <CategoryGrid categories={categories} />

          {/* 4. Tabbed Curated Product Rails */}
          <FeaturedTabs products={products} />

          {/* 5. Live Propulsion Compatibility Checker */}
          <CompatBanner options={options} />

          {/* 6. Authorized Component Manufacturers */}
          <BrandShowcase brands={brandRow} />

          {/* 7. Institutional Procurement & Fleet Quotations */}
          <B2BBanner title={content.closingTitle} subtitle={content.closingSentence} />

          {/* 8. Recently Viewed Hardware (LocalStorage powered, zero CLS) */}
          <RecentlyViewed />

          {/* 9. Technical Restock & Spec Bulletins */}
          <NewsletterCard />

          {/* 10. Frequently Asked Questions */}
          <HomeFaq faq={content.faq} />
        </div>
      </main>
      <Footer />
    </>
  );
}
