"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Heart,
  ShoppingCart,
  Maximize2,
  Check,
  ShieldCheck,
  FileText,
  Headphones,
  Truck,
  Star,
  ChevronLeft,
  ChevronRight,
  Zap,
  Award,
  Layers,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { ProductCard } from "@/components/product/product-card";
import { extractTechnicalSpecs, TechnicalSpecificationField } from "@/lib/technical-specs";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ProductDetailClient({ product, relatedProducts = [] }: { product: any; relatedProducts: any[] }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "specs" | "compat" | "included" | "docs" | "reviews">("overview");
  const [quantity, setQuantity] = useState(1);
  const [saved, setSaved] = useState(false);
  const [cartState, setCartState] = useState<"idle" | "adding" | "added">("idle");
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);

  const variant = product.variants?.[0];
  const price = variant?.calculated_price;
  const inStock = variant?.inventory_quantity != null ? variant.inventory_quantity > 0 : true;
  const category = product.categories?.[0]?.name?.replace("[DEV] ", "") || "Motors";
  const title = product.title?.replace("[DEV] ", "");

  // Build gallery images: use thumbnails from product or fallback to motor thumbs
  const defaultThumbs = [
    "/images/products/t-motor-thumb-1.png",
    "/images/products/t-motor-thumb-2.png",
    "/images/products/t-motor-thumb-3.png",
    "/images/products/t-motor-thumb-4.png",
  ];

  const galleryImages = product.thumbnail
    ? [product.thumbnail, ...defaultThumbs.slice(1)]
    : defaultThumbs;

  const activeMainImage = galleryImages[selectedImageIdx] || product.thumbnail || "/images/products/t-motor-mn5212-large.png";

  const rawMetadata = (product.metadata as Record<string, unknown>) || {};
  const techSpecs = extractTechnicalSpecs(rawMetadata);
  const sku = (rawMetadata.sku as string) || variant?.sku || "TM-MN5212-850";

  async function handleAddToCart() {
    if (!variant?.id || !inStock || cartState === "adding") return;
    setCartState("adding");
    try {
      const cartId = localStorage.getItem("cart_id");
      const res = await fetch("/api/cart/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cart_id: cartId, variant_id: variant.id, quantity }),
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("cart_id", data.cart_id);
        window.dispatchEvent(new Event("storage"));
        setCartState("added");
        setTimeout(() => setCartState("idle"), 2000);
      } else {
        setCartState("idle");
      }
    } catch {
      setCartState("idle");
    }
  }

  async function handleBuyNow() {
    await handleAddToCart();
    router.push("/cart");
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <nav className="mx-auto flex max-w-[1280px] items-center gap-1.5 px-8 pt-6 pb-4 text-[12px] font-medium text-text-muted md:px-10">
        <Link href="/" className="hover:text-graphite">Home</Link>
        <span>&gt;</span>
        <Link href="/parts" className="hover:text-graphite">UAV Parts</Link>
        <span>&gt;</span>
        <Link href={`/parts?category=${category.toLowerCase()}`} className="hover:text-graphite">{category}</Link>
        <span>&gt;</span>
        <span className="text-graphite font-semibold truncate max-w-xs">{title}</span>
      </nav>

      {/* Main 3-Column Top Section */}
      <section className="mx-auto max-w-[1280px] px-8 py-4 md:px-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          {/* Gallery & Core Info */}
          <div className="grid gap-8 md:grid-cols-[1fr_1.1fr]">
            {/* Gallery Column */}
            <div className="flex gap-4">
              {/* Thumbnail Vertical Stack */}
              <div className="flex flex-col gap-3">
                {galleryImages.slice(0, 4).map((thumb, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImageIdx(idx)}
                    className={`relative h-18 w-18 overflow-hidden rounded-md border p-1 transition-all ${
                      selectedImageIdx === idx
                        ? "border-graphite shadow-xs"
                        : "border-border hover:border-text-secondary bg-surface-soft"
                    }`}
                  >
                    <Image
                      src={thumb}
                      alt={`Thumbnail ${idx + 1}`}
                      fill
                      className="object-contain p-1"
                    />
                  </button>
                ))}
              </div>

              {/* Large Main Preview */}
              <div className="relative aspect-square flex-1 overflow-hidden rounded-lg border border-border bg-surface-soft p-6 flex items-center justify-center">
                <Image
                  src={activeMainImage}
                  alt={title}
                  fill
                  priority
                  className="object-contain p-4"
                />
                <button
                  type="button"
                  aria-label="Zoom image"
                  className="absolute right-3.5 top-3.5 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-text-muted shadow-xs transition hover:text-graphite"
                >
                  <Maximize2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Core Info Details */}
            <div className="flex flex-col justify-between">
              <div>
                <p className="text-[12px] font-semibold text-text-muted uppercase tracking-wider">{category}</p>
                <h1 className="mt-1 text-[26px] font-extrabold tracking-[-0.03em] text-graphite md:text-[30px]">
                  {title}
                </h1>
                <p className="mt-1.5 text-[14px] text-text-secondary">
                  High efficiency brushless motor for multirotor applications.
                </p>

                {/* Reviews & SKU */}
                <div className="mt-3 flex items-center gap-2 text-[12px] text-text-secondary">
                  <div className="flex items-center text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-current" />
                    ))}
                  </div>
                  <span className="font-semibold text-graphite">4.8</span>
                  <span className="text-text-muted">(12 reviews)</span>
                  <span className="text-text-disabled">|</span>
                  <span className="font-mono text-[11px] text-text-muted">SKU: {sku}</span>
                </div>

                {/* Price Display */}
                <div className="mt-5 border-t border-border pt-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[32px] font-extrabold tracking-tight text-graphite">
                      {price?.calculated_amount != null
                        ? formatPrice(price.calculated_amount, price.currency_code)
                        : "₹6,499.00"}
                    </span>
                    <span className="text-[12px] text-text-muted">(Incl. GST)</span>
                  </div>
                </div>

                {/* Narrative Overview */}
                <p className="mt-4 text-[13px] leading-relaxed text-text-secondary">
                  The {title} is a high-performance brushless motor designed for professional multirotor UAVs. It offers excellent thrust-to-weight ratio, high efficiency, and reliable performance for aerial photography, mapping, and industrial applications.
                </p>

                {/* Value Propositions Strip */}
                <div className="mt-6 flex flex-wrap gap-4 border-t border-border pt-5">
                  <div className="flex items-center gap-2 text-[12px] font-medium text-graphite">
                    <Zap className="h-4 w-4 text-graphite" />
                    <span>High Efficiency</span>
                  </div>
                  <div className="flex items-center gap-2 text-[12px] font-medium text-graphite">
                    <ShieldCheck className="h-4 w-4 text-graphite" />
                    <span>Reliable Performance</span>
                  </div>
                  <div className="flex items-center gap-2 text-[12px] font-medium text-graphite">
                    <Award className="h-4 w-4 text-graphite" />
                    <span>Professional Grade</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Buy Box Card */}
          <div className="rounded-lg border border-border bg-white p-6 shadow-xs">
            {/* Stock status */}
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-success" />
              <span className="text-[13px] font-bold text-success">In Stock</span>
              <span className="text-[12px] text-text-muted">Ships in 1–2 business days</span>
            </div>

            {/* Quantity Selector */}
            <div className="mt-6">
              <label className="text-[12px] font-semibold text-graphite">Quantity</label>
              <div className="mt-2 flex h-10 w-32 items-center rounded-md border border-border">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="flex h-full w-10 items-center justify-center text-text-secondary hover:text-graphite hover:bg-surface-soft"
                >
                  &minus;
                </button>
                <span className="flex-1 text-center font-mono text-[13px] font-bold text-graphite">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="flex h-full w-10 items-center justify-center text-text-secondary hover:text-graphite hover:bg-surface-soft"
                >
                  +
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 space-y-2.5">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={!inStock || cartState === "adding"}
                className="flex w-full items-center justify-center gap-2 rounded-md bg-accent py-3 text-[13px] font-bold text-graphite transition hover:bg-accent-hover shadow-xs active:scale-[0.99] disabled:opacity-50"
              >
                {cartState === "added" ? (
                  <>
                    <Check className="h-4 w-4 text-graphite" strokeWidth={2.5} />
                    Added to Cart!
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-4 w-4 text-graphite" />
                    Add to Cart
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleBuyNow}
                disabled={!inStock}
                className="block w-full rounded-md bg-graphite py-3 text-center text-[13px] font-bold text-white transition hover:bg-black active:scale-[0.99] disabled:opacity-50"
              >
                Buy Now
              </button>

              <button
                type="button"
                onClick={() => setSaved(!saved)}
                className="flex w-full items-center justify-center gap-2 rounded-md border border-border bg-white py-2.5 text-[13px] font-semibold text-graphite transition hover:bg-surface-soft"
              >
                <Heart className={`h-4 w-4 ${saved ? "fill-graphite text-graphite" : "text-text-muted"}`} />
                {saved ? "Added to Wishlist" : "Add to Wishlist"}
              </button>
            </div>

            {/* Value Bullets */}
            <div className="mt-6 space-y-3 border-t border-border pt-6 text-[12px] text-text-secondary">
              <div className="flex items-center gap-3">
                <Truck className="h-4 w-4 text-graphite shrink-0" />
                <span>Free shipping on orders over ₹10,000</span>
              </div>
              <div className="flex items-center gap-3">
                <FileText className="h-4 w-4 text-graphite shrink-0" />
                <span>GST invoicing available for businesses</span>
              </div>
              <div className="flex items-center gap-3">
                <Headphones className="h-4 w-4 text-graphite shrink-0" />
                <span>Expert support for builders &amp; teams</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs Section */}
      <section className="mx-auto mt-12 max-w-[1280px] px-8 md:px-10">
        <div className="border-b border-border">
          <div className="flex gap-8 overflow-x-auto">
            {[
              { id: "overview", label: "Overview" },
              { id: "specs", label: "Specifications" },
              { id: "compat", label: "Compatibility" },
              { id: "included", label: "What's Included" },
              { id: "docs", label: "Documentation" },
              { id: "reviews", label: "Reviews (12)" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`border-b-2 pb-3.5 text-[13px] font-bold transition-colors ${
                  activeTab === tab.id
                    ? "border-accent text-graphite"
                    : "border-transparent text-text-muted hover:text-graphite"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content: 2-Column (Overview & Specifications + Key Features) */}
        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px]">
          {/* Left Column: Content */}
          <div className="space-y-8">
            {/* Overview */}
            <div>
              <h2 className="text-[18px] font-extrabold text-graphite">Overview</h2>
              <p className="mt-3 text-[13px] leading-relaxed text-text-secondary">
                The {title} is a premium brushless motor built for multirotor UAV platforms. Engineered for efficiency and durability, it provides smooth and stable performance across a wide range of applications including aerial photography, surveying, agriculture and industrial missions.
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-text-secondary">
                With a robust design and high-quality materials, this motor ensures reliable operation even in demanding conditions.
              </p>
            </div>

            {/* Specifications 2-Column Table */}
            <div>
              <h2 className="text-[18px] font-extrabold text-graphite">Specifications</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {/* Column 1 Table */}
                <div className="overflow-hidden rounded border border-border">
                  <table className="w-full text-left text-[12px]">
                    <tbody>
                      {[
                        { k: "KV Rating", v: "850 KV" },
                        { k: "Max Continuous Power", v: "320 W" },
                        { k: "Max Continuous Current", v: "25 A" },
                        { k: "Burst Current (10s)", v: "40 A" },
                        { k: "Rated Voltage", v: "4S – 6S LiPo (14.8V – 25.2V)" },
                        { k: "Recommended Propeller Size", v: "15 – 18 inch" },
                      ].map((row, i) => (
                        <tr key={row.k} className={i % 2 === 0 ? "bg-white" : "bg-surface-soft"}>
                          <td className="py-2.5 px-3.5 font-medium text-text-secondary border-b border-border">{row.k}</td>
                          <td className="py-2.5 px-3.5 font-mono font-semibold text-graphite border-b border-border text-right">{row.v}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Column 2 Table */}
                <div className="overflow-hidden rounded border border-border">
                  <table className="w-full text-left text-[12px]">
                    <tbody>
                      {[
                        { k: "Motor Weight", v: "198 g" },
                        { k: "Stator Dimensions", v: "52 × 12 mm" },
                        { k: "Shaft Diameter", v: "6 mm" },
                        { k: "Mounting Pattern", v: "4 × M3 (30 mm)" },
                        { k: "Motor Dimensions", v: "Φ58 × 36 mm" },
                        { k: "Operating Temperature", v: "-20°C to 60°C" },
                      ].map((row, i) => (
                        <tr key={row.k} className={i % 2 === 0 ? "bg-white" : "bg-surface-soft"}>
                          <td className="py-2.5 px-3.5 font-medium text-text-secondary border-b border-border">{row.k}</td>
                          <td className="py-2.5 px-3.5 font-mono font-semibold text-graphite border-b border-border text-right">{row.v}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Key Features Card */}
          <div>
            <div className="rounded-lg border border-border bg-white p-6 shadow-xs">
              <h3 className="text-[14px] font-extrabold text-graphite">Key Features</h3>
              <ul className="mt-4 space-y-3.5 text-[12px] text-text-secondary">
                {[
                  "High efficiency and thrust-to-weight ratio",
                  "Durable construction for long service life",
                  "Optimized for 4S–6S LiPo batteries",
                  "Suitable for 15–18 inch propellers",
                  "Ideal for professional UAV applications",
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-success shrink-0 mt-0.5" strokeWidth={2.5} />
                    <span className="leading-snug">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Related Products Slider Section */}
      <section className="mx-auto max-w-[1280px] px-8 py-16 md:px-10">
        <div className="flex items-center justify-between">
          <h2 className="text-[22px] font-extrabold tracking-tight text-graphite">
            Related Products
          </h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Previous"
              className="flex h-8 w-8 items-center justify-center rounded border border-border bg-white text-graphite transition hover:bg-surface-soft"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Next"
              className="flex h-8 w-8 items-center justify-center rounded border border-border bg-white text-graphite transition hover:bg-surface-soft"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {relatedProducts.slice(0, 4).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </div>
  );
}
