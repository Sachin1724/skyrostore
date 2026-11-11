"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { BackLink } from "@/components/layout/back-link";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { HttpTypes } from "@medusajs/types";
import { Clock, FileText, Share2, ShieldCheck, Star, Truck } from "lucide-react";
import { useIconHover } from "@animateicons/react";
import { ShoppingCartIcon, CheckIcon } from "@animateicons/react/lucide";
import { addToCart as addItems } from "@/lib/cart-client";
import { saveDeliveryPin, useDeliveryPin } from "@/lib/delivery-pin";
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
import { loadReviews } from "./components/product-reviews";
import { ProductAlternatives } from "@/components/product/product-alternatives";
import type { CompatibleItem } from "@/lib/data/compatible-products";
import type { Offer } from "@/lib/data/site-settings";

const LOW_STOCK = 5;

// True for every order; shown beside the buttons, where the decision is made.
const POLICY = [
  { text: "Tracked delivery, tracking number by email", href: "/policies/shipping" },
  { text: "Pay by UPI, card or netbanking through Razorpay" },
  { text: "GST invoice with every order" },
  { text: "Damaged on arrival? Replaced or refunded", href: "/policies/refunds" },
];

interface ProductDetailClientProps {
  product: HttpTypes.StoreProduct;
  trail?: { name: string; handle: string }[];
  brand?: { title: string; handle: string } | null;
  compatibleItems?: CompatibleItem[];
  offers?: Offer[];
}

export function ProductDetailClient({
  product,
  trail = [],
  brand = null,
  compatibleItems = [],
  offers = [],
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
    const data = await addItems([{ variant_id: variant.id, quantity }], {
      open: openCart,
      pending: { title, thumbnail: images[0] ?? null },
    });
    if (!data) {
      setCartState("failed");
      return false;
    }
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
  }

  const buyNow = async () => {
    if (await addToCart(false)) router.push("/checkout");
  };

  const addLabel = cartState === "adding" ? "Adding…" : cartState === "added" ? "Added to cart" : "Add to cart";
  const { ref: cartIconRef, triggerProps: cartIconTrigger } = useIconHover({ trigger: "click" });
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
          <RatingSummary productId={product.id} />

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
              {priceText ? <span className="text-[14px] text-text-secondary">Inclusive of all taxes</span> : null}
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

            {!inStock ? <ProductAlternatives productId={product.id} /> : null}

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
              <legend className="text-[14px] font-bold text-navy">Option</legend>
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

          {offers.length ? <Offers offers={offers} /> : null}

          {/* Delivery first, as large stores do: the buyer knows it reaches them before pressing buy. */}
          <DeliveryCheck />

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
                onClick={(e) => {
                  cartIconTrigger.onClick?.(e);
                  addToCart(true);
                }}
                disabled={!inStock || cartState === "adding"}
                className="btn btn-primary inline-flex items-center justify-center gap-2"
              >
                {cartState === "added" ? (
                  <CheckIcon size={18} aria-hidden />
                ) : (
                  <ShoppingCartIcon ref={cartIconRef} size={18} aria-hidden />
                )}
                {addLabel}
              </button>
              <button
                type="button"
                onClick={buyNow}
                disabled={!inStock || cartState === "adding"}
                className="btn btn-brand"
              >
                Buy now
              </button>
            </div>

            <p aria-live="polite" className="min-h-5 text-[14px] text-error">
              {cartState === "failed" ? "Could not add to cart. Check your connection and try again." : ""}
            </p>

            <ul className="space-y-1 text-[13px] text-text-secondary">
              {POLICY.map((p) => (
                <li key={p.text} className="flex items-center gap-2">
                  <span aria-hidden className="h-1 w-1 shrink-0 rounded-full bg-text-muted" />
                  {p.href ? <Link href={p.href} className="hover:text-brand">{p.text}</Link> : p.text}
                </li>
              ))}
            </ul>
          </div>

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

      {/* Deep Technical Specifications, Overview, Documents, Reviews, Q&A */}
      <ProductSections
        productId={product.id}
        productTitle={title}
        description={product.description ?? null}
        specs={specRows}
        listing={listing}
      />

      {/* Buy it with: parts the compatibility rules pair with this one */}
      <FrequentlyBoughtTogether
        currentProduct={product}
        compatibleItems={compatibleItems}
      />

      {/* Works with this part */}
      <CompatibleParts items={compatibleItems} />

      {/* Recently Viewed Products History */}
      <RecentlyViewed currentProduct={product} className="mt-12" />

      {/* Mobile Sticky Buy Bar */}
      <div
        className={`fixed inset-x-0 bottom-0 z-30 flex items-center gap-2 border-t border-border bg-white px-4 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] transition-transform duration-300 ease-drawer ${
          buyBoxVisible ? "translate-y-full" : "translate-y-0"
        }`}
        aria-hidden={buyBoxVisible}
        inert={buyBoxVisible}
      >
        <p className="flex min-w-0 flex-1 items-baseline gap-3">
          <span className="hidden truncate text-[15px] font-semibold text-navy lg:block">{title}</span>
          <span className="shrink-0 text-[16px] font-extrabold tabular-nums text-navy">{priceText ?? "Price on request"}</span>
        </p>
        <button
          type="button"
          onClick={() => addToCart(true)}
          disabled={!inStock || cartState === "adding"}
          className="btn btn-secondary btn-sm"
        >
          {cartState === "added" ? "Added" : "Add to cart"}
        </button>
        <button
          type="button"
          onClick={buyNow}
          disabled={!inStock || cartState === "adding"}
          className="btn btn-brand btn-sm"
        >
          Buy now
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
      <span aria-live="polite">{copied ? "Link copied" : "Share"}</span>
    </button>
  );
}

/** Coupon codes the admin chose to show here; each copies with one tap for checkout. */
function Offers({ offers }: { offers: Offer[] }) {
  const [copied, setCopied] = useState<string | null>(null);
  return (
    <section aria-labelledby="offers-heading" className="mt-5">
      <h2 id="offers-heading" className="text-[14px] font-semibold text-navy">Available offers</h2>
      <ul className="mt-2 space-y-1.5">
        {offers.map((o) => (
          <li key={o.code} className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[14px] text-navy">
            <span className="text-success">{o.label}</span>
            <span className="text-text-secondary">with code</span>
            <button
              type="button"
              onClick={async () => {
                await navigator.clipboard?.writeText(o.code).catch(() => undefined);
                setCopied(o.code);
                setTimeout(() => setCopied(null), 1600);
              }}
              className="rounded border border-dashed border-border-strong px-2 py-0.5 text-[13px] font-semibold tracking-wide hover:border-brand"
            >
              {o.code}
            </button>
            <span aria-live="polite" className="text-[13px] text-text-secondary">{copied === o.code ? "Copied" : ""}</span>
          </li>
        ))}
      </ul>
      <p className="mt-1 text-[13px] text-text-secondary">Enter the code in your cart before checkout.</p>
    </section>
  );
}

type DeliveryState = { kind: "idle" | "checking" | "yes" | "no" | "unknown" | "error"; pin?: string };

/** Delivery to the buyer's PIN. A PIN saved from the header (or an earlier product) is checked on arrival. */
function DeliveryCheck() {
  const saved = useDeliveryPin();
  const [pin, setPin] = useState("");
  const [editing, setEditing] = useState(false);
  const [state, setState] = useState<DeliveryState>({ kind: "idle" });

  async function run(value: string) {
    if (!/^\d{6}$/.test(value)) return setState({ kind: "error" });
    setState({ kind: "checking", pin: value });
    const res = await fetch(`/api/delivery-check?pin=${value}`).catch(() => null);
    const { serviceable } = res?.ok ? ((await res.json()) as { serviceable: boolean | null }) : { serviceable: null };
    setState({ kind: serviceable === null ? "unknown" : serviceable ? "yes" : "no", pin: value });
  }

  useEffect(() => {
    if (saved && saved !== state.pin) {
      setPin(saved);
      void run(saved);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-check only when the saved PIN changes
  }, [saved]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{6}$/.test(pin)) return setState({ kind: "error" });
    setEditing(false);
    saveDeliveryPin(pin); // the effect above runs the check
    if (pin === saved) void run(pin);
  }

  const message = {
    idle: "Enter your PIN code to check delivery.",
    checking: "Checking…",
    yes: `Delivers to ${state.pin}.`,
    no: `Couriers do not reach ${state.pin} yet. Contact support for other options.`,
    unknown: `We confirm delivery to ${state.pin} at checkout.`,
    error: "Enter a valid 6-digit PIN code.",
  }[state.kind];

  const showForm = editing || !saved;

  return (
    <div className="mt-5 rounded-lg bg-surface-soft p-4">
      <p className="flex items-center gap-2 text-[14px] font-semibold text-navy">
        <Truck className="h-4 w-4 text-brand" aria-hidden /> Delivery
        {!showForm ? (
          <button type="button" onClick={() => setEditing(true)} className="ml-auto text-[13px] font-semibold text-brand hover:text-navy">
            Change
          </button>
        ) : null}
      </p>
      {showForm ? (
        <form onSubmit={submit} className="mt-2 flex gap-2">
          <label htmlFor="pin" className="sr-only">Delivery PIN code</label>
          <input
            id="pin"
            name="pin"
            inputMode="numeric"
            autoComplete="postal-code"
            maxLength={6}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            placeholder="PIN code, e.g. 751024"
            aria-describedby="pin-result"
            className="h-11 min-w-0 flex-1 rounded-md border border-border-strong bg-white px-3 text-[16px] tabular-nums text-navy focus:border-brand"
          />
          <button type="submit" disabled={state.kind === "checking"} className="btn btn-secondary">
            Check
          </button>
        </form>
      ) : null}
      <p id="pin-result" aria-live="polite" className={`mt-2 text-[14px] ${state.kind === "yes" ? "font-medium text-success" : state.kind === "no" || state.kind === "error" ? "text-error" : "text-text-secondary"}`}>
        {message}
      </p>
    </div>
  );
}

/** Stars and count under the title, linking to the reviews. Nothing at all until the first review. */
function RatingSummary({ productId }: { productId: string }) {
  const [summary, setSummary] = useState<{ average: number; total: number } | null>(null);
  useEffect(() => {
    loadReviews(productId)
      .then((d) => d?.total_reviews > 0 && setSummary({ average: Number(d.average_rating) || 0, total: d.total_reviews }))
      .catch(() => null);
  }, [productId]);
  if (!summary) return null;
  return (
    <a href="#reviews" className="mt-2 inline-flex items-center gap-1.5 text-[14px] text-navy hover:text-brand">
      <span className="flex" aria-hidden>
        {[1, 2, 3, 4, 5].map((s) => (
          <Star key={s} className={`h-4 w-4 ${s <= Math.round(summary.average) ? "fill-brand text-brand" : "fill-border text-border-strong"}`} />
        ))}
      </span>
      <span className="tabular-nums">
        {summary.average.toFixed(1)} · {summary.total} {summary.total === 1 ? "review" : "reviews"}
      </span>
    </a>
  );
}
