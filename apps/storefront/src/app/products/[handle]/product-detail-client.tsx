"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { BackLink } from "@/components/layout/back-link";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { HttpTypes } from "@medusajs/types";
import { Clock, CreditCard, FileText, RotateCcw, Share2, ShieldCheck, Truck } from "lucide-react";
import { CART_ADDED } from "@/components/layout/header-bar";
import { formatPrice } from "@/lib/utils";
import { extractTechnicalSpecs, getProductTechnicalHighlights } from "@/lib/technical-specs";
import { track } from "@/lib/analytics";
import { readListing } from "@/lib/listing";
import { ProductSections } from "./product-sections";
import { ProductGallery } from "./components/product-gallery";
import { CompatibleParts } from "./components/compatible-parts";
import { FrequentlyBoughtTogether } from "./components/frequently-bought-together";
import { RecentlyViewed } from "./components/recently-viewed";
import { WishlistButton } from "./components/wishlist-button";
import type { CompatibleItem } from "@/lib/data/compatible-products";

const LOW_STOCK = 5;

const TRUST = [
  { icon: Truck, title: "Tracked delivery", text: "Courier tracking number on every parcel" },
  { icon: CreditCard, title: "Secure payment", text: "UPI, cards and netbanking via Razorpay" },
  { icon: FileText, title: "GST invoice", text: "Included with every order" },
  { icon: RotateCcw, title: "Damaged on arrival?", text: "Replaced or refunded", href: "/policies/refunds" },
];

interface ProductDetailClientProps {
  product: HttpTypes.StoreProduct;
  trail?: { name: string; handle: string }[];
  brand?: { title: string; handle: string } | null;
  compatibleItems?: CompatibleItem[];
}

export function ProductDetailClient({
  product,
  trail = [],
  brand = null,
  compatibleItems = [],
}: ProductDetailClientProps) {
  const router = useRouter();
  const variants = product.variants ?? [];
  const [variantId, setVariantId] = useState(variants[0]?.id);
  const [quantity, setQuantity] = useState(1);
  const [cartState, setCartState] = useState<"idle" | "adding" | "added" | "failed">("idle");
  const [buyBoxVisible, setBuyBoxVisible] = useState(true);
  const buyBoxRef = useRef<HTMLDivElement>(null);

  const variant = variants.find((v) => v.id === variantId) ?? variants[0];
  const price = variant?.calculated_price;
  const amount = price?.calculated_amount ?? null;
  const original = amount != null && (price?.original_amount ?? 0) > amount ? price!.original_amount! : null;
  const currency = price?.currency_code ?? "inr";
  const stock = variant?.manage_inventory === false ? null : variant?.inventory_quantity ?? null;
  const inStock = stock == null || stock > 0;
  const maxQty = stock ?? 99;
  const title = (product.title ?? "").replace("[DEV] ", "");
  const category = product.categories?.[0]?.name ? product.categories[0].name.replace("[DEV] ", "") : undefined;
  const metadata = (product.metadata ?? {}) as Record<string, unknown>;
  const specRows = useMemo(() => extractTechnicalSpecs(metadata)?.additionalSpecifications ?? [], [metadata]);
  const highlights = useMemo(() => getProductTechnicalHighlights(metadata), [metadata]);
  const listing = useMemo(() => readListing(metadata), [metadata]);
  const sku = variant?.sku || (metadata.sku as string | undefined) || null;

  // Extract clean images array
  const images = useMemo(() => {
    return (product.images?.map((i) => i.url).filter(Boolean) as string[] | undefined)?.length
      ? (product.images!.map((i) => i.url).filter(Boolean) as string[])
      : product.thumbnail
        ? [product.thumbnail]
        : [];
  }, [product.images, product.thumbnail]);

  const discountPercent = original && amount
    ? Math.round((1 - amount / original) * 100)
    : null;

  useEffect(() => {
    track("product_viewed", {
      product_id: product.id,
      variant_id: variant?.id ?? null,
      value: amount,
      currency_code: currency,
    });
  }, [product.id, variant?.id, amount, currency]);

  // Mobile sticky buy bar threshold detection
  useEffect(() => {
    const el = buyBoxRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setBuyBoxVisible(e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  async function addToCart(openCart: boolean): Promise<boolean> {
    if (!variant?.id || !inStock || cartState === "adding") return false;
    setCartState("adding");
    try {
      const res = await fetch("/api/cart/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cart_id: localStorage.getItem("cart_id"),
          variant_id: variant.id,
          quantity,
        }),
      });

      if (!res.ok) {
        setCartState("failed");
        return false;
      }

      const data = await res.json();
      localStorage.setItem("cart_id", data.cart_id);
      window.dispatchEvent(new Event(openCart ? CART_ADDED : "storage"));
      track("product_added_to_cart", {
        cart_id: data.cart_id,
        product_id: product.id,
        variant_id: variant.id,
        quantity,
        value: amount,
        currency_code: currency,
      });

      setCartState("added");
      setTimeout(() => setCartState("idle"), 2000);
      return true;
    } catch {
      setCartState("failed");
      return false;
    }
  }

  const buyNow = async () => {
    if (await addToCart(false)) router.push("/checkout");
  };

  const addLabel = cartState === "adding" ? "Adding…" : cartState === "added" ? "Added to Cart" : "Add to Cart";
  const priceText = amount != null ? formatPrice(amount, currency) : null;

  return (
    <div className="mx-auto max-w-[1760px] px-4 pb-28 md:px-8 lg:pb-16">
      {/* Breadcrumb Hierarchy */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-4">
          <BackLink fallback="/parts" />
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5  text-[13px] text-text-secondary">
        <Link href="/" className="hover:text-brand">Home</Link>
        <span aria-hidden>/</span>
        <Link href="/parts" className="hover:text-brand">Parts</Link>
        {trail.map((node) => (
          <span key={node.handle} className="flex items-center gap-1.5">
            <span aria-hidden>/</span>
            <Link href={`/parts?category=${node.handle}`} className="hover:text-brand">{node.name}</Link>
          </span>
        ))}
        <span aria-hidden>/</span>
        <span aria-current="page" className="max-w-[40ch] truncate font-medium text-navy">{title}</span>
      </nav>
        </div>

      {/* Main PDP Grid: Gallery (Left) and Buy Box (Right) */}
      <section className="mt-4 grid gap-8 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:gap-12">
        {/* Product Gallery Island */}
        <ProductGallery
          title={title}
          images={images}
          thumbnail={product.thumbnail ?? null}
          videoUrl={listing.video_url ?? (metadata.video_url as string | null | undefined)}
          componentType={metadata.component_type as string | undefined}
          category={category}
          discountPercent={discountPercent}
        />

        {/* Buy Box Information */}
        <div>
          <p className="text-[14px] text-text-secondary">
            {brand ? (
              <Link href={`/brands/${brand.handle}`} className="font-semibold text-brand hover:text-navy">
                {brand.title}
              </Link>
            ) : null}
            {brand && category ? " · " : null}
            {category}
          </p>

          <h1 className="mt-1.5 text-[clamp(1.6rem,1.2rem+1.6vw,2.4rem)] font-extrabold leading-tight tracking-[-0.03em] text-balance text-navy">
            {title}
          </h1>

          {highlights.length ? (
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {highlights.map((h) => (
                <li key={h} className="rounded-full bg-surface-muted px-3 py-1 text-[13px] font-medium tabular-nums text-navy">
                  {h}
                </li>
              ))}
            </ul>
          ) : null}

          {/* Pricing Cluster */}
          <div className="mt-5 border-t border-border pt-5">
            <p className="flex flex-wrap items-baseline gap-x-3 tabular-nums">
              <span className="text-[30px] font-extrabold text-navy">{priceText ?? "Price on request"}</span>
              {original ? <s className="text-[16px] text-text-muted">{formatPrice(original, currency)}</s> : null}
              {priceText ? <span className="text-[14px] text-text-secondary">incl. GST</span> : null}
            </p>
            {discountPercent ? (
              <p className="text-[14px] font-semibold text-success">
                You save {formatPrice(original! - amount!, currency)} ({discountPercent}%)
              </p>
            ) : null}

            {/* Inventory Indicator */}
            <p className={`mt-1 text-[16px] font-semibold ${!inStock ? "text-text-muted" : stock != null && stock <= LOW_STOCK ? "text-warning-strong" : "text-success"}`}>
              {!inStock ? "Out of stock" : stock != null && stock <= LOW_STOCK ? `Only ${stock} left in stock` : "In stock"}
              {sku ? <span className="ml-3 font-normal text-text-secondary">SKU: {sku}</span> : null}
            </p>

            {/* Fulfillment and Warranty Signals */}
            {listing.dispatch_days != null || listing.warranty || listing.gst_rate != null ? (
              <ul className="mt-3 space-y-1.5 text-[14px] text-navy">
                {listing.dispatch_days != null && inStock ? (
                  <li className="flex items-center gap-2">
                    <Clock className="h-4 w-4 shrink-0 text-brand" aria-hidden />
                    {listing.dispatch_days === 0 ? "Ships today" : `Ships within ${listing.dispatch_days} ${listing.dispatch_days === 1 ? "day" : "days"}`}
                  </li>
                ) : null}
                {listing.warranty ? (
                  <li className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 shrink-0 text-brand" aria-hidden />
                    {listing.warranty}
                  </li>
                ) : null}
                {listing.gst_rate != null ? (
                  <li className="flex items-center gap-2 text-text-secondary">
                    <FileText className="h-4 w-4 shrink-0 text-brand" aria-hidden />
                    GST {listing.gst_rate}% included{listing.hsn_code ? ` · HSN ${listing.hsn_code}` : ""}
                  </li>
                ) : null}
              </ul>
            ) : null}
          </div>

          {/* Variants Selector */}
          {variants.length > 1 ? (
            <fieldset className="mt-5">
              <legend className="text-[14px] font-bold text-navy">Select Specification</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {variants.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => {
                      setVariantId(v.id);
                      setQuantity(1);
                    }}
                    aria-pressed={v.id === variant?.id}
                    className={`min-h-10 rounded-md border-[1.5px] px-3.5 text-[14px] font-semibold transition-all ${
                      v.id === variant?.id
                        ? "border-brand bg-brand-soft text-brand"
                        : "border-border-strong text-navy hover:border-brand"
                    }`}
                  >
                    {v.title}
                  </button>
                ))}
              </div>
            </fieldset>
          ) : null}

          {/* Quantity Stepper and Actions */}
          <div ref={buyBoxRef} className="mt-5 space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-[14px] font-bold text-navy">Quantity</span>
              <div className="flex h-11 items-center rounded-md border border-border-strong bg-white" role="group" aria-label="Quantity">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  aria-label="Decrease quantity"
                  className="h-full w-11 text-[20px] text-navy hover:text-brand disabled:opacity-40"
                >
                  &minus;
                </button>
                <output aria-live="polite" className="w-10 text-center text-[16px] font-semibold tabular-nums text-navy">
                  {quantity}
                </output>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
                  disabled={quantity >= maxQty}
                  aria-label="Increase quantity"
                  className="h-full w-11 text-[20px] text-navy hover:text-brand disabled:opacity-40"
                >
                  +
                </button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => addToCart(true)}
                disabled={!inStock || cartState === "adding"}
                className="btn btn-primary"
              >
                {addLabel}
              </button>
              <button
                type="button"
                onClick={buyNow}
                disabled={!inStock || cartState === "adding"}
                className="btn btn-secondary"
              >
                Buy Now
              </button>
            </div>

            <p aria-live="polite" className="min-h-5 text-[14px] text-error">
              {cartState === "failed" ? "Could not add to cart. Check your connection and try again." : ""}
            </p>
          </div>

          {/* Postal Delivery PIN Code Verification */}
          <DeliveryCheck />

          {/* Institutional / Compatibility Helpers */}
          <div className="mt-4 flex flex-wrap items-center gap-2 text-[14px] text-text-secondary">
            <WishlistButton
              productId={product.id}
              showLabel
              className="btn btn-secondary btn-sm mr-2"
            />
            <ShareButton title={title} />
            <Link href="/build" className="font-semibold text-brand hover:text-navy">
              Check fit in the build checker
            </Link>
            {" · "}
            <Link
              href={`/bulk-orders/request?product=${product.id}&title=${encodeURIComponent(title)}`}
              className="font-semibold text-brand hover:text-navy"
            >
              Request a bulk quote
            </Link>
          </div>

          {specRows.length ? (
            <div className="mt-6">
              <div className="flex items-baseline justify-between">
                <h2 className="text-[16px] font-semibold text-navy">Key specifications</h2>
                <a href="#specifications" className="text-[13px] font-medium text-brand hover:text-navy">All specifications</a>
              </div>
              <dl className="mt-2 divide-y divide-border text-[14px]">
                {specRows.slice(0, 6).map((r) => (
                  <div key={r.key} className="flex justify-between gap-4 py-2">
                    <dt className="text-text-secondary">{r.label}</dt>
                    <dd className="font-medium tabular-nums text-navy">{r.value}{r.unit ? ` ${r.unit}` : ""}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : null}
        </div>
      </section>

      {/* 4-Column Trust Guarantee Strip */}
      <ul className="mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border lg:grid-cols-4">
        {TRUST.map(({ icon: Icon, title: t, text, href }) => {
          const body = (
            <>
              <Icon className="h-6 w-6 shrink-0 text-brand" strokeWidth={1.6} aria-hidden />
              <span>
                <span className="block text-[14px] font-bold text-navy">{t}</span>
                <span className="block text-[13px] text-text-secondary">{text}</span>
              </span>
            </>
          );
          return (
            <li key={t} className="bg-white">
              {href ? (
                <Link href={href} className="flex h-full items-center gap-3 p-4 hover:bg-surface-soft">{body}</Link>
              ) : (
                <div className="flex h-full items-center gap-3 p-4">{body}</div>
              )}
            </li>
          );
        })}
      </ul>

      {/* Frequently Bought Together Bundle */}
      <FrequentlyBoughtTogether
        currentProduct={product}
        compatibleItems={compatibleItems}
      />

      {/* "Works With" Verified Compatible Parts */}
      <CompatibleParts items={compatibleItems} />

      {/* Deep Technical Specifications, Overview, Documents, Reviews, Q&A */}
      <ProductSections
        productId={product.id}
        productTitle={title}
        description={product.description ?? null}
        specs={specRows}
        listing={listing}
      />

      {/* Recently Viewed Products History */}
      <RecentlyViewed currentProduct={product} />

      {/* Mobile Sticky Buy Bar */}
      <div
        className={`fixed inset-x-0 bottom-0 z-30 flex items-center gap-2 border-t border-border bg-white px-4 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] transition-transform duration-300 ease-drawer lg:hidden ${
          buyBoxVisible ? "translate-y-full" : "translate-y-0"
        }`}
        aria-hidden={buyBoxVisible}
        inert={buyBoxVisible}
      >
        <p className="min-w-0 flex-1 truncate text-[16px] font-extrabold tabular-nums text-navy">
          {priceText ?? "Price on request"}
        </p>
        <button
          type="button"
          onClick={() => addToCart(true)}
          disabled={!inStock || cartState === "adding"}
          className="btn btn-secondary btn-sm"
        >
          {cartState === "added" ? "Added" : "Add"}
        </button>
        <button
          type="button"
          onClick={buyNow}
          disabled={!inStock || cartState === "adding"}
          className="btn btn-primary btn-sm"
        >
          Buy Now
        </button>
      </div>
    </div>
  );
}

function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        const url = window.location.href;
        if (navigator.share) return navigator.share({ title, url }).catch(() => undefined);
        await navigator.clipboard?.writeText(url).catch(() => undefined);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }}
      className="btn btn-secondary btn-sm mr-3"
    >
      <Share2 className="h-4 w-4" aria-hidden />
      <span aria-live="polite">{copied ? "Link Copied" : "Share"}</span>
    </button>
  );
}

function DeliveryCheck() {
  const [pin, setPin] = useState("");
  const [state, setState] = useState<{ kind: "idle" | "checking" | "yes" | "no" | "unknown" | "error"; pin?: string }>({ kind: "idle" });

  async function check(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{6}$/.test(pin)) return setState({ kind: "error" });
    setState({ kind: "checking" });
    const res = await fetch(`/api/delivery-check?pin=${pin}`).catch(() => null);
    if (!res?.ok) return setState({ kind: "unknown", pin });
    const { serviceable } = (await res.json()) as { serviceable: boolean | null };
    setState({ kind: serviceable === null ? "unknown" : serviceable ? "yes" : "no", pin });
  }

  const message = {
    idle: "",
    checking: "Checking courier serviceability…",
    yes: `Delivery available to ${state.pin}. Same-day dispatch from Odisha.`,
    no: `Courier direct routes do not reach ${state.pin} yet. Contact support for freight options.`,
    unknown: "Serviceability confirmed at checkout based on destination.",
    error: "Enter a valid 6-digit Indian PIN code.",
  }[state.kind];

  return (
    <form onSubmit={check} className="mt-5 rounded-lg border border-border bg-surface-soft p-4">
      <label htmlFor="pin" className="flex items-center gap-2 text-[14px] font-bold text-navy">
        <Truck className="h-4 w-4 text-brand" aria-hidden /> Check Delivery &amp; Pin Code
      </label>
      <div className="mt-2 flex gap-2">
        <input
          id="pin"
          name="pin"
          inputMode="numeric"
          autoComplete="postal-code"
          maxLength={6}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
          placeholder="e.g. 751024…"
          aria-describedby="pin-result"
          className="h-11 min-w-0 flex-1 rounded-md border border-border-strong bg-white px-3 text-[16px] tabular-nums text-navy focus:border-brand"
        />
        <button
          type="submit"
          disabled={state.kind === "checking"}
          className="btn btn-secondary"
        >
          Check
        </button>
      </div>
      <p id="pin-result" aria-live="polite" className={`mt-2 min-h-5 text-[14px] ${state.kind === "yes" ? "text-success" : state.kind === "no" || state.kind === "error" ? "text-error" : "text-text-secondary"}`}>
        {message}
      </p>
    </form>
  );
}
