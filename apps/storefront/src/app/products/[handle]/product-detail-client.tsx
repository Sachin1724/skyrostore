"use client";

import { useEffect, useState } from "react";
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
import { ProductMediaFallback } from "@/components/product/product-media-fallback";
import { extractTechnicalSpecs, getProductTechnicalHighlights } from "@/lib/technical-specs";
import { track } from "@/lib/analytics";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ProductDetailClient({
  product,
  relatedProducts = [],
  trail = [],
  brand = null,
}: {
  product: any;
  relatedProducts: any[];
  trail?: { name: string; handle: string }[];
  brand?: { title: string; handle: string; logo: string | null } | null;
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "specs" | "compat" | "included" | "docs" | "reviews">("overview");
  const [quantity, setQuantity] = useState(1);
  const [saved, setSaved] = useState(false);
  const [cartState, setCartState] = useState<"idle" | "adding" | "added">("idle");
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);

  const variant = product.variants?.[0];
  const price = variant?.calculated_price;
  const inStock = variant?.inventory_quantity != null ? variant.inventory_quantity > 0 : true;
  const category = product.categories?.[0]?.name?.replace("[DEV] ", "") || "UAV Components";
  const title = product.title?.replace("[DEV] ", "");

  // Authentic product images: strictly only manufacturer photography
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const productImages: string[] = Array.isArray(product.images) && product.images.length > 0
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? product.images.map((img: any) => (typeof img === "string" ? img : img.url)).filter(Boolean)
    : product.thumbnail
    ? [product.thumbnail]
    : [];

  const activeMainImage = productImages[selectedImageIdx] || product.thumbnail || null;

  const rawMetadata = (product.metadata as Record<string, unknown>) || {};
  const techSpecs = extractTechnicalSpecs(rawMetadata);
  const technicalHighlights = getProductTechnicalHighlights(rawMetadata);
  const sku = (rawMetadata.sku as string) || variant?.sku || "N/A";

  useEffect(() => {
    if (!product?.id) return;
    track("product_viewed", {
      product_id: product.id,
      variant_id: variant?.id ?? null,
      value: price?.calculated_amount ?? null,
      currency_code: price?.currency_code ?? null,
    });
  }, [product?.id, variant?.id, price?.calculated_amount, price?.currency_code]);

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
        track("product_added_to_cart", {
          cart_id: data.cart_id,
          product_id: product.id,
          variant_id: variant.id,
          quantity,
          value: price?.calculated_amount ?? null,
          currency_code: price?.currency_code ?? null,
        });
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
        {trail.map((node) => (
          <span key={node.handle} className="flex items-center gap-1.5">
            <span>&gt;</span>
            <Link href={`/parts?category=${node.handle}`} className="hover:text-graphite">{node.name}</Link>
          </span>
        ))}
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
              {/* Thumbnail Vertical Stack (Only when multiple authentic images exist) */}
              {productImages.length > 1 && (
                <div className="flex flex-col gap-3">
                  {productImages.slice(0, 4).map((thumb, idx) => (
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
              )}

              {/* Large Main Preview */}
              <div className="relative aspect-square flex-1 overflow-hidden rounded-lg border border-border bg-surface-soft p-6 flex items-center justify-center">
                {activeMainImage ? (
                  <Image
                    src={activeMainImage}
                    alt={title}
                    fill
                    priority
                    className="object-contain p-4"
                  />
                ) : (
                  <ProductMediaFallback
                    componentType={product.metadata?.component_type}
                    category={category}
                    title={product.title}
                  />
                )}
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
                {brand ? (
                  <Link href={`/brands/${brand.handle}`} className="mb-2 inline-flex items-center gap-2 text-[13px] font-bold text-graphite hover:underline">
                    {brand.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={brand.logo} alt="" className="h-6 w-6 object-contain" />
                    ) : null}
                    {brand.title}
                  </Link>
                ) : null}
                <p className="text-[12px] font-semibold text-text-muted uppercase tracking-wider">{category}</p>
                <h1 className="mt-1 text-[26px] font-extrabold tracking-[-0.03em] text-graphite md:text-[30px]">
                  {title}
                </h1>
                {product.description && (
                  <p className="mt-1.5 text-[14px] text-text-secondary line-clamp-2">
                    {product.description}
                  </p>
                )}

                {/* Reviews & SKU */}
                <div className="mt-3 flex items-center gap-2 text-[12px] text-text-secondary">
                  <span className="inline-flex items-center gap-1 rounded bg-surface-soft px-2 py-0.5 text-[11px] font-medium text-text-muted border border-border">
                    Verified Buyer Reviews Only
                  </span>
                  <span className="text-text-disabled">|</span>
                  <span className="font-mono text-[11px] text-text-muted">SKU: {sku}</span>
                </div>

                {/* Price Display */}
                <div className="mt-5 border-t border-border pt-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[32px] font-extrabold tracking-tight text-graphite">
                      {price?.calculated_amount != null
                        ? formatPrice(price.calculated_amount, price.currency_code)
                        : "Price on Request"}
                    </span>
                    <span className="text-[12px] text-text-muted">(Incl. GST)</span>
                  </div>
                </div>

                {/* Narrative Overview */}
                <p className="mt-4 text-[13px] leading-relaxed text-text-secondary">
                  {product.description ||
                    `The ${title} is an industrial UAV component built for demanding aerial platforms and mission-critical operations.`}
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

              <Link
                href={`/bulk-orders/request?product=${product.id}&title=${encodeURIComponent(title || "")}`}
                className="flex w-full items-center justify-center gap-2 rounded-md border border-border bg-white py-2.5 text-[13px] font-semibold text-graphite transition hover:bg-surface-soft"
              >
                Request Bulk Quote &rarr;
              </Link>

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
              { id: "reviews", label: "Reviews (0)" },
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
                {product.description ||
                  `The ${title} is an industrial-grade ${category.toLowerCase()} component engineered for high-reliability UAV platforms.`}
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-text-secondary">
                Manufactured with aerospace-grade standards to ensure mission reliability and thermal endurance under rigorous flight envelopes.
              </p>
            </div>

            {/* Specifications Table */}
            <div id="specifications">
              <h2 className="text-[18px] font-extrabold text-graphite">Technical Specifications</h2>
              {techSpecs && techSpecs.additionalSpecifications.length > 0 ? (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {/* Column 1 Table */}
                  <div className="overflow-hidden rounded border border-border">
                    <table className="w-full text-left text-[12px]">
                      <tbody>
                        {techSpecs.additionalSpecifications
                          .slice(0, Math.ceil(techSpecs.additionalSpecifications.length / 2))
                          .map((row, i) => (
                            <tr key={row.key} className={i % 2 === 0 ? "bg-white" : "bg-surface-soft"}>
                              <td className="py-2.5 px-3.5 font-medium text-text-secondary border-b border-border">
                                {row.label}
                              </td>
                              <td className="py-2.5 px-3.5 font-mono font-semibold text-graphite border-b border-border text-right">
                                {String(row.value)} {row.unit || ""}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Column 2 Table */}
                  <div className="overflow-hidden rounded border border-border">
                    <table className="w-full text-left text-[12px]">
                      <tbody>
                        {techSpecs.additionalSpecifications
                          .slice(Math.ceil(techSpecs.additionalSpecifications.length / 2))
                          .map((row, i) => (
                            <tr key={row.key} className={i % 2 === 0 ? "bg-white" : "bg-surface-soft"}>
                              <td className="py-2.5 px-3.5 font-medium text-text-secondary border-b border-border">
                                {row.label}
                              </td>
                              <td className="py-2.5 px-3.5 font-mono font-semibold text-graphite border-b border-border text-right">
                                {String(row.value)} {row.unit || ""}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="mt-4 rounded border border-border bg-surface-soft p-6 text-center text-[13px] text-text-muted">
                  Technical specifications for this UAV component are cataloged by engineering prior to dispatch. Contact support for detailed datasheet.
                </div>
              )}
            </div>

            {/* UAV Compatibility Section */}
            <div id="compatibility" className="border-t border-border pt-8">
              <h2 className="text-[18px] font-extrabold text-graphite">UAV Compatibility & System Integration</h2>
              <p className="mt-3 text-[13px] leading-relaxed text-text-secondary">
                Engineered for seamless integration with PX4 / ArduPilot autopilots, industry standard power distribution systems, and standard drone airframes (Quadcopter, Hexacopter, Octocopter, and VTOL fixed-wing).
              </p>
            </div>

            {/* Package Contents / What's Included */}
            <div id="whats-included" className="border-t border-border pt-8">
              <h2 className="text-[18px] font-extrabold text-graphite">What&apos;s Included</h2>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2 text-[12px] text-text-secondary">
                <li className="flex items-center gap-2 rounded border border-border bg-white p-3">
                  <Check className="h-4 w-4 text-graphite shrink-0" strokeWidth={2.5} />
                  <span>1× {title} unit (Factory Calibrated)</span>
                </li>
                <li className="flex items-center gap-2 rounded border border-border bg-white p-3">
                  <Check className="h-4 w-4 text-graphite shrink-0" strokeWidth={2.5} />
                  <span>Mounting hardware pack &amp; screw kit</span>
                </li>
                <li className="flex items-center gap-2 rounded border border-border bg-white p-3">
                  <Check className="h-4 w-4 text-graphite shrink-0" strokeWidth={2.5} />
                  <span>Pinout diagram &amp; integration guide</span>
                </li>
                <li className="flex items-center gap-2 rounded border border-border bg-white p-3">
                  <Check className="h-4 w-4 text-graphite shrink-0" strokeWidth={2.5} />
                  <span>Skyrostore QA inspection certificate</span>
                </li>
              </ul>
            </div>

            {/* Documentation & Compliance */}
            <div id="documentation" className="border-t border-border pt-8">
              <h2 className="text-[18px] font-extrabold text-graphite">Documentation & Compliance</h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 text-[12px]">
                <div className="flex items-center justify-between rounded border border-border bg-white p-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-graphite shrink-0" />
                    <span className="font-semibold text-graphite">Engineering Datasheet</span>
                  </div>
                  <span className="font-mono text-text-muted text-[11px]">PDF (2.4 MB)</span>
                </div>
                <div className="flex items-center justify-between rounded border border-border bg-white p-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-success shrink-0" />
                    <span className="font-semibold text-graphite">CE &amp; RoHS Compliance</span>
                  </div>
                  <span className="font-mono text-text-muted text-[11px]">Certified</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Key Features Card */}
          <div>
            <div className="rounded-lg border border-border bg-white p-6 shadow-xs">
              <h3 className="text-[14px] font-extrabold text-graphite">Key Features</h3>
              <ul className="mt-4 space-y-3.5 text-[12px] text-text-secondary">
                {technicalHighlights.length > 0 ? (
                  technicalHighlights.map((hl, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <Check className="h-4 w-4 text-success shrink-0 mt-0.5" strokeWidth={2.5} />
                      <span className="leading-snug">{hl}</span>
                    </li>
                  ))
                ) : (
                  <>
                    <li className="flex items-start gap-2.5">
                      <Check className="h-4 w-4 text-success shrink-0 mt-0.5" strokeWidth={2.5} />
                      <span className="leading-snug">Industrial-grade durability and quality control</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="h-4 w-4 text-success shrink-0 mt-0.5" strokeWidth={2.5} />
                      <span className="leading-snug">Optimized for enterprise UAV power budgets</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="h-4 w-4 text-success shrink-0 mt-0.5" strokeWidth={2.5} />
                      <span className="leading-snug">Standardized mounting patterns for modular builds</span>
                    </li>
                  </>
                )}
                <li className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-success shrink-0 mt-0.5" strokeWidth={2.5} />
                  <span className="leading-snug">Backed by Skyrostore engineering assurance</span>
                </li>
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
