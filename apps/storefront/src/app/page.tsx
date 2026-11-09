import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { HeroCarousel } from "@/components/home/hero-carousel";
import { BrandShowcase } from "@/components/home/brand-showcase";
import { CategoryGrid } from "@/components/home/category-grid";
import { TrustGrid } from "@/components/home/trust-grid";
import { FeaturedTabs } from "@/components/home/featured-tabs";
import { B2BBanner } from "@/components/home/b2b-banner";
import { RecommendedForYou } from "@/components/home/recommended-for-you";
import { ProductRail } from "@/components/home/product-rail";
import { HomeFaq } from "@/components/home/home-faq";
import { NewsletterCard } from "@/components/home/newsletter-card";
import { RecentlyViewed } from "@/components/product/recently-viewed";
import { getProducts } from "@/lib/data/products";
import { getBrands, getCatalogIndex, getCategoryTree, countForNode, cleanName } from "@/lib/data/catalog";
import { getSiteContent } from "@/lib/data/site-content";

export default async function HomePage() {
  const [tree, brands, index, { products }, content] = await Promise.all([
    getCategoryTree().catch(() => []),
    getBrands().catch(() => []),
    getCatalogIndex().catch(() => ({ total: 0, byCategory: new Map(), byBrand: new Map() })),
    getProducts({ limit: 40 }).catch(() => ({ products: [] })),
    getSiteContent(),
  ]);

  // A shelf per category, only where there is enough to fill one.
  const categoryShelves = tree
    .map((node) => ({ node, items: products.filter((p) => p.categories?.some((c) => c.handle === node.handle || node.children?.some((ch) => ch.handle === c.handle))) }))
    .filter((s) => s.items.length >= 3);

  const categories = tree
    .map((node) => ({ node, count: countForNode(node, index) }))
    .filter((c) => c.count > 0);

  const brandRow = brands
    .filter((b) => (index.byBrand.get(b.id) ?? 0) > 0)
    .map((b) => ({ handle: b.handle, title: b.title, logo: b.logo, count: index.byBrand.get(b.id) ?? 0 }));

  return (
    <>
      <Header />
      <main id="main" className="min-h-screen bg-surface-soft pb-20">
        <div className="mx-auto max-w-[1760px] space-y-14 px-4 pt-5 md:space-y-20 md:px-8 md:pt-6">
          {/* 1. Hero Overview */}
          <HeroCarousel slides={content.heroSlides} />

          {/* 2. Certified brands */}
          <BrandShowcase brands={brandRow} />

          {/* 3. Shop by Category Grid */}
          <CategoryGrid categories={categories} />

          {/* 4. Trust & guarantees */}
          <TrustGrid />

          {/* 5. Featured hardware, tabbed */}
          <FeaturedTabs products={products} />
          {categoryShelves.map(({ node, items }) => (
            <ProductRail key={node.id} title={`Top in ${node.name}`} href={`/parts?category=${node.handle}`} products={items.slice(0, 12)} />
          ))}

          {/* 7. Institutional Procurement & Fleet Quotations */}
          <B2BBanner title={content.closingTitle} subtitle={content.closingSentence} />

          {/* 8. Recently Viewed Hardware (LocalStorage powered, zero CLS) */}
          <RecentlyViewed />
          <RecommendedForYou />

          {/* 10. Frequently Asked Questions */}
          <HomeFaq faq={content.faq} />

          <NewsletterCard />
        </div>
      </main>
      <Footer />
    </>
  );
}
