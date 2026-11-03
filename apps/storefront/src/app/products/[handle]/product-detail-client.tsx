"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { HttpTypes } from "@medusajs/types";
import { ChevronLeft, ChevronRight, CreditCard, FileText, RotateCcw, Truck, X, ZoomIn } from "lucide-react";
import { CART_ADDED } from "@/components/layout/header-bar";
import { formatPrice } from "@/lib/utils";
import { ProductMediaFallback } from "@/components/product/product-media-fallback";
import { extractTechnicalSpecs, getProductTechnicalHighlights } from "@/lib/technical-specs";
import { track } from "@/lib/analytics";

const LOW_STOCK = 5;

const TRUST = [
  { icon: Truck, title: "Tracked delivery", text: "Courier tracking number on every parcel" },
  { icon: CreditCard, title: "Secure payment", text: "UPI, cards and netbanking via Razorpay" },
  { icon: FileText, title: "GST invoice", text: "Included with every order" },
  { icon: RotateCcw, title: "Damaged on arrival?", text: "Replaced or refunded", href: "/policies/refunds" },
];

export function ProductDetailClient({
  product,
  trail = [],
  brand = null,
}: {
  product: HttpTypes.StoreProduct;
  trail?: { name: string; handle: string }[];
  brand?: { title: string; handle: string } | null;
}) {
  const router = useRouter();
  const variants = product.variants ?? [];
  const [variantId, setVariantId] = useState(variants[0]?.id);
  const [quantity, setQuantity] = useState(1);
  const [cartState, setCartState] = useState<"idle" | "adding" | "added" | "failed">("idle");
  const [imageIdx, setImageIdx] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [buyBoxVisible, setBuyBoxVisible] = useState(true);
  const zoomRef = useRef<HTMLDialogElement>(null);
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
  const specRows = extractTechnicalSpecs(metadata)?.additionalSpecifications ?? [];
  const highlights = getProductTechnicalHighlights(metadata);
  const inTheBox = typeof metadata.in_the_box === "string" ? metadata.in_the_box.split(/\n|,/).map((s) => s.trim()).filter(Boolean) : [];
  const sku = variant?.sku || (metadata.sku as string | undefined) || null;

  // Only the product's own photographs, never stand-ins.
  const images = (product.images?.map((i) => i.url).filter(Boolean) as string[] | undefined)?.length
    ? (product.images!.map((i) => i.url).filter(Boolean) as string[])
    : product.thumbnail
      ? [product.thumbnail]
      : [];
  const image = images[imageIdx] ?? null;
  const step = (d: number) => images.length > 1 && setImageIdx((i) => (i + d + images.length) % images.length);

  useEffect(() => {
    track("product_viewed", { product_id: product.id, variant_id: variant?.id ?? null, value: amount, currency_code: currency });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  // Phones get a sticky buy bar once the main buttons scroll out of view.
  useEffect(() => {
    const el = buyBoxRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setBuyBoxVisible(e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const d = zoomRef.current;
    if (!d) return;
    if (zoomed && !d.open) d.showModal();
    if (!zoomed && d.open) d.close();
  }, [zoomed]);

  async function addToCart(openCart: boolean): Promise<boolean> {
    if (!variant?.id || !inStock || cartState === "adding") return false;
    setCartState("adding");
    try {
      const res = await fetch("/api/cart/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cart_id: localStorage.getItem("cart_id"), variant_id: variant.id, quantity }),
      });
      if (!res.ok) {
        setCartState("failed");
        return false;
      }
      const data = await res.json();
      localStorage.setItem("cart_id", data.cart_id);
      window.dispatchEvent(new Event(openCart ? CART_ADDED : "storage"));
      track("product_added_to_cart", { cart_id: data.cart_id, product_id: product.id, variant_id: variant.id, quantity, value: amount, currency_code: currency });
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
    <div className="mx-auto max-w-[1376px] px-4 pb-28 md:px-8 lg:pb-16">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 pt-5 text-[13px] text-text-secondary">
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
        <span aria-current="page" className="max-w-[40ch] truncate text-navy">{title}</span>
      </nav>

      <section className="mt-4 grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-12">
        {/* Gallery */}
        <div
          role="region"
          aria-label="Product photos"
          tabIndex={images.length > 1 ? 0 : -1}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") step(1);
            if (e.key === "ArrowLeft") step(-1);
          }}
          className="lg:sticky lg:top-[150px] lg:self-start"
        >
          <div className="relative aspect-square overflow-hidden rounded-lg border border-border bg-white">
            {image ? (
              <>
                <div key={image} className={imageIdx ? "fade-in absolute inset-0" : "absolute inset-0"}>
                  <Image src={image} alt={title} fill priority sizes="(min-width:1024px) 55vw, 100vw" className="object-contain p-8" />
                </div>
                <button
                  type="button"
                  onClick={() => setZoomed(true)}
                  aria-label="Zoom photo"
                  className="absolute bottom-3 right-3 flex h-11 w-11 items-center justify-center rounded-md border border-border bg-white text-navy hover:text-brand"
                >
                  <ZoomIn className="h-5 w-5" aria-hidden />
                </button>
              </>
            ) : (
              <ProductMediaFallback componentType={metadata.component_type as string | undefined} category={category} title={title} />
            )}
            {original ? (
              <span className="absolute left-3 top-3 rounded bg-error px-2 py-0.5 text-[13px] font-bold text-white">
                -{Math.round((1 - amount! / original) * 100)}%
              </span>
            ) : null}
          </div>
          {images.length > 1 ? (
            <ul className="mt-3 flex gap-2.5 overflow-x-auto pb-1">
              {images.map((src, i) => (
                <li key={src}>
                  <button
                    type="button"
                    onClick={() => setImageIdx(i)}
                    aria-label={`Show photo ${i + 1} of ${images.length}`}
                    aria-current={imageIdx === i ? "true" : undefined}
                    className={`relative block h-20 w-20 rounded-md border-2 bg-white ${imageIdx === i ? "border-brand" : "border-border hover:border-border-strong"}`}
                  >
                    <Image src={src} alt="" fill sizes="80px" className="object-contain p-1.5" />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        {/* Buy box */}
        <div>
          <p className="text-[14px] text-text-secondary">
            {brand ? <Link href={`/brands/${brand.handle}`} className="font-semibold text-brand hover:text-navy">{brand.title}</Link> : null}
            {brand && category ? " · " : null}
            {category}
          </p>
          <h1 className="mt-1.5 text-[clamp(1.6rem,1.2rem+1.6vw,2.4rem)] font-extrabold leading-tight tracking-[-0.03em] text-balance text-navy">{title}</h1>
          {highlights.length ? (
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {highlights.map((h) => (
                <li key={h} className="rounded-md bg-brand-soft px-2.5 py-1 text-[13px] font-semibold tabular-nums text-navy">{h}</li>
              ))}
            </ul>
          ) : null}

          <div className="mt-5 border-t border-border pt-5">
            <p className="flex flex-wrap items-baseline gap-x-3 tabular-nums">
              <span className="text-[30px] font-extrabold text-navy">{priceText ?? "Price on request"}</span>
              {original ? <s className="text-[17px] text-text-muted">{formatPrice(original, currency)}</s> : null}
              {priceText ? <span className="text-[14px] text-text-secondary">incl. GST</span> : null}
            </p>
            {original ? (
              <p className="text-[14px] font-semibold text-success">
                You save {formatPrice(original - amount!, currency)} ({Math.round((1 - amount! / original) * 100)}%)
              </p>
            ) : null}
            <p className={`mt-1 text-[15px] font-semibold ${!inStock ? "text-text-muted" : stock != null && stock <= LOW_STOCK ? "text-[#8A5B00]" : "text-success"}`}>
              {!inStock ? "Out of stock" : stock != null && stock <= LOW_STOCK ? `Only ${stock} left` : "In stock"}
              {sku ? <span className="ml-3 font-normal text-text-secondary">SKU {sku}</span> : null}
            </p>
          </div>

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
                    className={`min-h-10 rounded-md border-[1.5px] px-3.5 text-[14px] font-semibold ${
                      v.id === variant?.id ? "border-brand bg-brand-soft text-brand" : "border-border-strong text-navy hover:border-brand"
                    }`}
                  >
                    {v.title}
                  </button>
                ))}
              </div>
            </fieldset>
          ) : null}

          <div ref={buyBoxRef} className="mt-5 space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-[14px] font-bold text-navy">Quantity</span>
              <div className="flex h-11 items-center rounded-md border border-border-strong bg-white" role="group" aria-label="Quantity">
                <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))} disabled={quantity <= 1} aria-label="Decrease quantity" className="h-full w-11 text-[20px] text-navy hover:text-brand disabled:opacity-40">
                  &minus;
                </button>
                <output aria-live="polite" className="w-10 text-center text-[16px] font-semibold tabular-nums text-navy">{quantity}</output>
                <button type="button" onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))} disabled={quantity >= maxQty} aria-label="Increase quantity" className="h-full w-11 text-[20px] text-navy hover:text-brand disabled:opacity-40">
                  +
                </button>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => addToCart(true)}
                disabled={!inStock || cartState === "adding"}
                className="h-12 rounded-md bg-brand text-[16px] font-semibold text-white transition-colors hover:bg-navy disabled:opacity-40"
              >
                {addLabel}
              </button>
              <button
                type="button"
                onClick={buyNow}
                disabled={!inStock || cartState === "adding"}
                className="h-12 rounded-md border-[1.5px] border-navy text-[16px] font-semibold text-navy transition-colors hover:bg-navy hover:text-white disabled:opacity-40"
              >
                Buy Now
              </button>
            </div>
            <p aria-live="polite" className="min-h-5 text-[14px] text-error">
              {cartState === "failed" ? "Could not add to cart. Check your connection and try again." : ""}
            </p>
          </div>

          <DeliveryCheck />

          <p className="mt-4 text-[14px] text-text-secondary">
            <Link href="/build" className="font-semibold text-brand hover:text-navy">Check fit in the build checker</Link>
            {" · "}
            <Link href={`/bulk-orders/request?product=${product.id}&title=${encodeURIComponent(title)}`} className="font-semibold text-brand hover:text-navy">
              Request a bulk quote
            </Link>
          </p>
        </div>
      </section>

      <ul className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border lg:grid-cols-4">
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

      <div className="mt-8 grid items-start gap-4 lg:grid-cols-3">
        <InfoCard title="Description">
          {product.description ? (
            <p className="whitespace-pre-line text-[15px] leading-relaxed text-text-secondary">{product.description}</p>
          ) : (
            <p className="text-[15px] text-text-secondary">No description yet.</p>
          )}
        </InfoCard>
        <InfoCard title="Specifications">
          {specRows.length ? (
            <table className="w-full text-left text-[14px]">
              <tbody>
                {specRows.map((row, i) => (
                  <tr key={row.key} className={i % 2 ? "" : "bg-surface-soft"}>
                    <th scope="row" className="px-3 py-2 font-medium text-text-secondary">{row.label}</th>
                    <td className="px-3 py-2 text-right font-semibold tabular-nums text-navy">
                      {String(row.value)}
                      {row.unit ? ` ${row.unit}` : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-[15px] text-text-secondary">
              Not published yet. <Link href="/support" className="font-semibold text-brand">Ask support</Link> for the datasheet.
            </p>
          )}
        </InfoCard>
        {inTheBox.length ? (
          <InfoCard title="In the Box">
            <ul className="list-disc space-y-1 pl-5 text-[15px] text-text-secondary">
              {inTheBox.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </InfoCard>
        ) : null}
      </div>

      <dialog
        ref={zoomRef}
        onClose={() => setZoomed(false)}
        onClick={(e) => e.target === zoomRef.current && setZoomed(false)}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") step(1);
          if (e.key === "ArrowLeft") step(-1);
        }}
        aria-label={`${title} photo`}
        className="pop m-auto h-[min(92vh,900px)] w-[min(94vw,900px)] max-w-none overscroll-contain rounded-lg bg-white p-0 backdrop:bg-navy/70"
      >
        {image ? <Image src={image} alt={title} fill sizes="900px" className="object-contain p-6" /> : null}
        <button type="button" onClick={() => setZoomed(false)} aria-label="Close photo" className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-md bg-white text-navy shadow">
          <X className="h-5 w-5" aria-hidden />
        </button>
        {images.length > 1 ? (
          <>
            <button type="button" onClick={() => step(-1)} aria-label="Previous photo" className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-md bg-white text-navy shadow">
              <ChevronLeft className="h-5 w-5" aria-hidden />
            </button>
            <button type="button" onClick={() => step(1)} aria-label="Next photo" className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-md bg-white text-navy shadow">
              <ChevronRight className="h-5 w-5" aria-hidden />
            </button>
          </>
        ) : null}
      </dialog>

      {/* Phones: price and the two actions stay in reach once the main buttons scroll away. */}
      <div
        className={`fixed inset-x-0 bottom-0 z-30 flex items-center gap-2 border-t border-border bg-white px-4 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] transition-transform duration-300 ease-drawer lg:hidden ${
          buyBoxVisible ? "translate-y-full" : "translate-y-0"
        }`}
        aria-hidden={buyBoxVisible}
        inert={buyBoxVisible}
      >
        <p className="min-w-0 flex-1 truncate text-[17px] font-extrabold tabular-nums text-navy">{priceText ?? "Price on request"}</p>
        <button type="button" onClick={() => addToCart(true)} disabled={!inStock || cartState === "adding"} className="h-11 rounded-md border-[1.5px] border-brand px-4 text-[15px] font-semibold text-brand disabled:opacity-40">
          {cartState === "added" ? "Added" : "Add"}
        </button>
        <button type="button" onClick={buyNow} disabled={!inStock || cartState === "adding"} className="h-11 rounded-md bg-brand px-5 text-[15px] font-semibold text-white disabled:opacity-40">
          Buy Now
        </button>
      </div>
    </div>
  );
}

/** Card on desktop, collapsible on phones (open by default so nothing is hidden). */
function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details open className="group rounded-lg border border-border bg-white">
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-5 text-[16px] font-bold text-navy lg:pointer-events-none">
        {title}
        <span aria-hidden className="text-[20px] font-medium text-brand group-open:hidden lg:hidden">+</span>
        <span aria-hidden className="hidden text-[20px] font-medium text-brand group-open:inline lg:!hidden">&minus;</span>
      </summary>
      <div className="px-5 pb-5">{children}</div>
    </details>
  );
}

/** PIN code check against the courier. Says only what the courier API actually answered. */
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
    checking: "Checking…",
    yes: `Delivers to ${state.pin}. Shipping is shown before you pay.`,
    no: `Couriers do not reach ${state.pin} yet. Contact support for options.`,
    unknown: "Could not check right now. Delivery is confirmed at checkout.",
    error: "Enter a 6-digit PIN code.",
  }[state.kind];

  return (
    <form onSubmit={check} className="mt-5 rounded-lg border border-border bg-surface-soft p-4">
      <label htmlFor="pin" className="flex items-center gap-2 text-[14px] font-bold text-navy">
        <Truck className="h-4 w-4 text-brand" aria-hidden /> Check delivery
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
          placeholder="PIN code, e.g. 751024…"
          aria-describedby="pin-result"
          className="h-11 min-w-0 flex-1 rounded-md border border-border-strong bg-white px-3 text-[15px] tabular-nums text-navy"
        />
        <button type="submit" disabled={state.kind === "checking"} className="h-11 rounded-md border-[1.5px] border-brand bg-white px-4 text-[14px] font-semibold text-brand hover:bg-brand hover:text-white">
          Check
        </button>
      </div>
      <p id="pin-result" aria-live="polite" className={`mt-2 min-h-5 text-[14px] ${state.kind === "yes" ? "text-success" : state.kind === "no" || state.kind === "error" ? "text-error" : "text-text-secondary"}`}>
        {message}
      </p>
    </form>
  );
}
