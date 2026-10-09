import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ProductCard } from "@/components/product/product-card";
import { getProducts } from "@/lib/data/products";
import Link from "next/link";
import Image from "next/image";
import {
  Grid,
  Cpu,
  RotateCw,
  Zap,
  Wind,
  Battery,
  Navigation,
  Box,
  MoreHorizontal,
  ChevronDown,
  Filter,
} from "lucide-react";

export const metadata = { title: "UAV Parts & Components — Skyrostore" };

const CATEGORY_TABS = [
  { id: "all", label: "All Parts", icon: Grid, handle: "" },
  { id: "fc", label: "Flight Controllers", icon: Cpu, handle: "flight-controllers" },
  { id: "motors", label: "Motors", icon: RotateCw, handle: "motors" },
  { id: "escs", label: "ESCs", icon: Zap, handle: "escs" },
  { id: "props", label: "Propellers", icon: Wind, handle: "propellers" },
  { id: "batteries", label: "Batteries", icon: Battery, handle: "batteries" },
  { id: "gps", label: "GPS & Navigation", icon: Navigation, handle: "gps" },
  { id: "frames", label: "Frames", icon: Box, handle: "frames" },
];

export default async function PartsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; sort?: string; search?: string }>;
}) {
  const params = await searchParams;
  const activeCategory = params.category || "";

  const { products } = await getProducts({
    limit: 48,
  });

  return (
    <>
      <Header />
      <main className="min-h-screen bg-surface-soft">
        {/* Top Header Banner */}
        <section className="relative overflow-hidden border-b border-border bg-white">
          <div className="mx-auto flex max-w-[1280px] flex-col justify-between px-8 py-8 md:flex-row md:items-center md:px-10">
            <div className="relative z-10 max-w-lg">
              <nav className="flex items-center gap-1.5 text-[12px] font-medium text-text-muted">
                <Link href="/" className="hover:text-graphite">Home</Link>
                <span>&gt;</span>
                <span className="text-graphite">UAV Parts</span>
              </nav>
              <h1 className="mt-3 text-[32px] font-extrabold tracking-[-0.03em] text-graphite md:text-[38px]">
                UAV Parts
              </h1>
              <p className="mt-1.5 text-[14px] text-text-secondary">
                High quality components for your next build.
              </p>
            </div>
            {/* Collage Banner Asset */}
            <div className="pointer-events-none relative mt-4 h-24 w-full max-w-[480px] md:mt-0 md:h-28">
              <Image
                src="/images/hero/catalog-banner.png"
                alt="UAV Components Collage"
                fill
                className="object-contain object-right"
              />
            </div>
          </div>
        </section>

        {/* Horizontal Category Tab Strip */}
        <section className="sticky top-16 z-40 border-b border-border bg-white shadow-xs">
          <div className="mx-auto flex max-w-[1280px] items-center gap-2 overflow-x-auto px-8 py-2.5 md:px-10 scrollbar-none">
            {CATEGORY_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = (!activeCategory && tab.id === "all") || activeCategory === tab.handle;
              return (
                <Link
                  key={tab.id}
                  href={tab.handle ? `/parts?category=${tab.handle}` : "/parts"}
                  className={`flex shrink-0 items-center gap-2 border-b-2 px-3 py-2 text-[12px] font-semibold transition-colors ${
                    isActive
                      ? "border-accent text-graphite"
                      : "border-transparent text-text-secondary hover:text-graphite"
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 ${isActive ? "text-graphite" : "text-text-muted"}`} />
                  {tab.label}
                </Link>
              );
            })}
            <button
              type="button"
              className="flex shrink-0 items-center gap-1.5 border-b-2 border-transparent px-3 py-2 text-[12px] font-medium text-text-muted hover:text-graphite"
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
              More
            </button>
          </div>
        </section>

        {/* Catalog Main 2-Column Section */}
        <section className="mx-auto max-w-[1280px] px-8 py-8 md:px-10">
          <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
            {/* Filter Sidebar */}
            <aside className="space-y-6">
              {/* Category Filter */}
              <div className="rounded-lg border border-border bg-white p-4">
                <div className="flex items-center justify-between font-bold text-[13px] text-graphite">
                  <span>Category</span>
                  <ChevronDown className="h-4 w-4 text-text-muted" />
                </div>
                <div className="mt-3 space-y-2 text-[12px] text-text-secondary">
                  {[
                    { label: "Flight Controllers", count: 6 },
                    { label: "Motors", count: 8 },
                    { label: "ESCs", count: 6 },
                    { label: "Propellers", count: 8 },
                    { label: "Batteries", count: 6 },
                    { label: "GPS & Navigation", count: 4 },
                    { label: "Telemetry", count: 3 },
                    { label: "Frames", count: 5 },
                    { label: "Cameras", count: 2 },
                    { label: "Power Modules", count: 2 },
                  ].map((cat) => (
                    <label key={cat.label} className="flex items-center justify-between cursor-pointer hover:text-graphite">
                      <div className="flex items-center gap-2">
                        <input type="checkbox" className="h-3.5 w-3.5 rounded border-border text-graphite focus:ring-0" />
                        <span>{cat.label}</span>
                      </div>
                      <span className="text-[11px] text-text-muted">({cat.count})</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="rounded-lg border border-border bg-white p-4">
                <div className="flex items-center justify-between font-bold text-[13px] text-graphite">
                  <span>Price Range</span>
                  <ChevronDown className="h-4 w-4 text-text-muted" />
                </div>
                <div className="mt-4">
                  <div className="relative h-1.5 w-full rounded-full bg-surface-muted">
                    <div className="absolute left-0 right-1/4 h-1.5 rounded-full bg-graphite" />
                    <div className="absolute left-0 top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full border-2 border-graphite bg-white shadow-xs" />
                    <div className="absolute right-1/4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full border-2 border-graphite bg-white shadow-xs" />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[11px] font-semibold text-graphite">
                    <span>₹0</span>
                    <span>₹50,000</span>
                  </div>
                </div>
              </div>

              {/* Availability */}
              <div className="rounded-lg border border-border bg-white p-4">
                <div className="flex items-center justify-between font-bold text-[13px] text-graphite">
                  <span>Availability</span>
                  <ChevronDown className="h-4 w-4 text-text-muted" />
                </div>
                <div className="mt-3 space-y-2 text-[12px] text-text-secondary">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" defaultChecked className="h-3.5 w-3.5 rounded border-border text-graphite focus:ring-0" />
                      <span>In Stock</span>
                    </div>
                    <span className="text-[11px] text-text-muted">(38)</span>
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" className="h-3.5 w-3.5 rounded border-border text-graphite focus:ring-0" />
                      <span>Out of Stock</span>
                    </div>
                    <span className="text-[11px] text-text-muted">(4)</span>
                  </label>
                </div>
              </div>

              {/* Brand */}
              <div className="rounded-lg border border-border bg-white p-4">
                <div className="flex items-center justify-between font-bold text-[13px] text-graphite">
                  <span>Brand</span>
                  <ChevronDown className="h-4 w-4 text-text-muted" />
                </div>
                <div className="mt-3 space-y-2 text-[12px] text-text-secondary">
                  {[
                    { label: "Holybro", count: 8 },
                    { label: "T-Motor", count: 10 },
                    { label: "Hobbywing", count: 6 },
                    { label: "CUAV", count: 6 },
                    { label: "uBlox", count: 4 },
                    { label: "Here3+", count: 2 },
                  ].map((brand) => (
                    <label key={brand.label} className="flex items-center justify-between cursor-pointer hover:text-graphite">
                      <div className="flex items-center gap-2">
                        <input type="checkbox" className="h-3.5 w-3.5 rounded border-border text-graphite focus:ring-0" />
                        <span>{brand.label}</span>
                      </div>
                      <span className="text-[11px] text-text-muted">({brand.count})</span>
                    </label>
                  ))}
                  <button type="button" className="text-[11px] font-semibold text-graphite hover:underline pt-1">
                    + Show more
                  </button>
                </div>
              </div>

              {/* Clear Filters Button */}
              <Link
                href="/parts"
                className="block w-full rounded-md border border-border bg-white py-2 text-center text-[12px] font-bold text-graphite hover:bg-surface-soft transition-colors"
              >
                Clear Filters
              </Link>
            </aside>

            {/* Product Grid Area */}
            <div>
              {/* Top Controls Bar */}
              <div className="flex items-center justify-between rounded-lg border border-border bg-white px-4 py-3">
                <p className="text-[13px] font-semibold text-graphite">
                  <span className="font-bold">{products.length}</span> products
                </p>
                <div className="flex items-center gap-2 text-[12px] text-text-secondary">
                  <span>Sort by</span>
                  <select
                    className="rounded border border-border bg-surface-soft px-2.5 py-1 text-[12px] font-medium text-graphite focus:outline-none"
                    defaultValue="featured"
                  >
                    <option value="featured">Featured</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                    <option value="newest">Newest Arrivals</option>
                  </select>
                </div>
              </div>

              {/* Product Cards Grid */}
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Pagination */}
              <div className="mt-10 flex items-center justify-center gap-2">
                <button
                  type="button"
                  aria-label="Previous page"
                  className="flex h-8 w-8 items-center justify-center rounded border border-border bg-white text-[12px] font-medium text-text-secondary hover:bg-surface-soft disabled:opacity-40"
                  disabled
                >
                  &lt;
                </button>
                <span className="flex h-8 w-8 items-center justify-center rounded bg-accent text-[12px] font-bold text-graphite">
                  1
                </span>
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded border border-border bg-white text-[12px] font-medium text-graphite hover:bg-surface-soft"
                >
                  2
                </button>
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded border border-border bg-white text-[12px] font-medium text-graphite hover:bg-surface-soft"
                >
                  3
                </button>
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded border border-border bg-white text-[12px] font-medium text-graphite hover:bg-surface-soft"
                >
                  4
                </button>
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded border border-border bg-white text-[12px] font-medium text-graphite hover:bg-surface-soft"
                >
                  5
                </button>
                <span className="px-1 text-[12px] text-text-muted">...</span>
                <button
                  type="button"
                  aria-label="Next page"
                  className="flex h-8 w-8 items-center justify-center rounded border border-border bg-white text-[12px] font-medium text-graphite hover:bg-surface-soft"
                >
                  &gt;
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
