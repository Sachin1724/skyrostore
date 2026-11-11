import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { HeroCarousel } from "@/components/home/hero-carousel";
import { BrandShowcase } from "@/components/home/brand-showcase";
import { CategoryGrid } from "@/components/home/category-grid";
import { TrustGrid } from "@/components/home/trust-grid";
import { B2BBanner } from "@/components/home/b2b-banner";
import { RecommendedForYou } from "@/components/home/recommended-for-you";
import { ProductRail } from "@/components/home/product-rail";
import { HomeFaq } from "@/components/home/home-faq";
import { NewsletterCard } from "@/components/home/newsletter-card";
import { RecentlyViewed } from "@/components/product/recently-viewed";
import { getProducts } from "@/lib/data/products";
import { getBrands, getCatalogIndex, getCategoryTree, countForNode } from "@/lib/data/catalog";
import { getSiteContent } from "@/lib/data/site-content";
import { categoryHref } from "@/lib/category-art";

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
        {/* Products reach the first screen: a short banner, then categories, then shelves. */}
        <div className="mx-auto max-w-[1760px] space-y-10 px-4 pt-4 md:space-y-14 md:px-8 md:pt-5">
          <HeroCarousel slides={content.heroSlides} />
          <CategoryGrid categories={categories} />
          <TrustGrid />

          {/* Admin order; a best-sellers shelf joins once order analytics can back it. */}
          <ProductRail title="Popular parts" href="/parts" products={products.slice(0, 12)} />

          {/* This browser's own history; both render nothing on a first visit. */}
          <RecentlyViewed />
          <RecommendedForYou />

          {categoryShelves.map(({ node, items }) => (
            <ProductRail key={node.id} title={node.name} href={categoryHref(node)} products={items.slice(0, 12)} />
          ))}

          <BrandShowcase brands={brandRow} />
          <B2BBanner title={content.closingTitle} subtitle={content.closingSentence} />
          <HomeFaq faq={content.faq} />
          <NewsletterCard />
        </div>
      </main>
      <Footer />
    </>
  );
}
