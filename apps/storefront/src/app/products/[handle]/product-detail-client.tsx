"use client";

import { CART_ADDED } from "@/components/layout/header-bar";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/utils";
import { ProductListRow } from "@/components/product/product-card";
import { ProductMediaFallback } from "@/components/product/product-media-fallback";
import { extractTechnicalSpecs } from "@/lib/technical-specs";
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
  const [quantity, setQuantity] = useState(1);
  const [cartState, setCartState] = useState<"idle" | "adding" | "added" | "failed">("idle");
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);

  const variant = product.variants?.[0];
  const price = variant?.calculated_price;
  const stock: number | null = variant?.inventory_quantity ?? null;
  const inStock = stock != null ? stock > 0 : true;
  const category = product.categories?.[0]?.name?.replace("[DEV] ", "") as string | undefined;
  const title = product.title?.replace("[DEV] ", "");
  const priceText = price?.calculated_amount != null ? formatPrice(price.calculated_amount, price.currency_code) : null;

  // Only the product's own photographs, never stand-ins.
  const productImages: string[] = Array.isArray(product.images) && product.images.length > 0
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? product.images.map((img: any) => (typeof img === "string" ? img : img.url)).filter(Boolean)
    : product.thumbnail
    ? [product.thumbnail]
    : [];
  const activeMainImage = productImages[selectedImageIdx] || product.thumbnail || null;

  const rawMetadata = (product.metadata as Record<string, unknown>) || {};
  const specRows = extractTechnicalSpecs(rawMetadata)?.additionalSpecifications ?? [];
  const sku = (rawMetadata.sku as string) || variant?.sku || null;

  useEffect(() => {
    if (!product?.id) return;
    track("product_viewed", {
      product_id: product.id,
      variant_id: variant?.id ?? null,
      value: price?.calculated_amount ?? null,
      currency_code: price?.currency_code ?? null,
    });
  }, [product?.id, variant?.id, price?.calculated_amount, price?.currency_code]);

  async function handleAddToCart(openCart = true): Promise<boolean> {
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
      return true;
    } catch {
      setCartState("failed");
      return false;
    }
  }

  async function handleBuyNow() {
    if (await handleAddToCart(false)) router.push("/checkout");
  }

  const addLabel = cartState === "adding" ? "Adding…" : cartState === "added" ? "Added to cart" : "Add to cart";

  return (
    <div className="min-h-screen bg-surface-soft px-5 pb-28 md:px-10 lg:pb-24">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 pt-8 text-[15px] text-text-secondary">
        <Link href="/" className="hover:text-brand">Home</Link>
        <span aria-hidden>/</span>
        <Link href="/parts" className="hover:text-brand">UAV Parts</Link>
        {trail.map((node) => (
          <span key={node.handle} className="flex items-center gap-1.5">
            <span aria-hidden>/</span>
            <Link href={`/parts?category=${node.handle}`} className="hover:text-brand">{node.name}</Link>
          </span>
        ))}
      </nav>

      <section className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)]">
        <div>
          <div className="relative aspect-square bg-white">
            {activeMainImage ? (
              <Image src={activeMainImage} alt={title} fill priority sizes="(min-width:1024px) 55vw, 100vw" className="object-contain p-8" />
            ) : (
              <ProductMediaFallback componentType={product.metadata?.component_type} category={category} title={product.title} />
            )}
          </div>
          {productImages.length > 1 ? (
            <ul className="mt-3 flex gap-3 overflow-x-auto" aria-label="Product photos">
              {productImages.map((thumb, idx) => (
                <li key={thumb}>
                  <button
                    type="button"
                    onClick={() => setSelectedImageIdx(idx)}
                    aria-label={`Show photo ${idx + 1}`}
                    aria-pressed={selectedImageIdx === idx}
                    className={`relative block h-20 w-20 bg-white outline-offset-2 ${selectedImageIdx === idx ? "outline-2 outline-navy" : ""}`}
                  >
                    <Image src={thumb} alt="" fill sizes="80px" className="object-contain p-2" />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="lg:pt-4">
          <p className="text-[16px] text-text-secondary">
            {brand ? (
              <Link href={`/brands/${brand.handle}`} className="font-semibold text-navy hover:text-brand">{brand.title}</Link>
            ) : null}
            {brand && category ? " · " : null}
            {category}
          </p>
          <h1 className="mt-2 text-[clamp(2rem,1.4rem+2.4vw,3.25rem)] font-bold leading-[1] tracking-[-0.03em] text-balance text-navy">
            {title}
          </h1>
          {product.description ? (
            <p className="mt-5 max-w-[56ch] text-[17px] leading-[1.6] text-navy">{product.description}</p>
          ) : null}

          <p className="mt-8 text-[clamp(1.75rem,1.4rem+1.2vw,2.5rem)] font-bold tabular-nums text-navy">
            {priceText ?? "Price on request"}
            {priceText ? <span className="ml-2 text-[16px] font-normal text-text-secondary">incl. GST</span> : null}
          </p>
          <p className={`mt-1 text-[16px] ${inStock ? "text-success" : "text-text-secondary"}`}>
            {!inStock ? "Out of stock" : stock != null && stock <= 5 ? `In stock, ${stock} left` : "In stock"}
            {sku ? <span className="ml-3 text-text-secondary">SKU {sku}</span> : null}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <div className="flex h-12 items-center bg-white" role="group" aria-label="Quantity">
              <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} aria-label="Decrease quantity" className="h-full w-11 text-[20px] text-navy hover:text-brand">
                &minus;
              </button>
              <output aria-live="polite" className="w-8 text-center text-[17px] font-semibold tabular-nums text-navy">{quantity}</output>
              <button type="button" onClick={() => setQuantity(quantity + 1)} aria-label="Increase quantity" className="h-full w-11 text-[20px] text-navy hover:text-brand">
                +
              </button>
            </div>
            <button
              type="button"
              onClick={() => handleAddToCart()}
              disabled={!inStock || cartState === "adding"}
              className="inline-flex min-h-12 items-center bg-white px-7 text-[16px] font-semibold text-navy hover:text-brand disabled:opacity-40"
            >
              {addLabel}
            </button>
            <button
              type="button"
              onClick={handleBuyNow}
              disabled={!inStock || cartState === "adding"}
              className="inline-flex min-h-12 items-center bg-navy px-7 text-[16px] font-semibold text-white hover:bg-brand disabled:opacity-40"
            >
              Buy Now
            </button>
          </div>
          <p aria-live="polite" className="mt-2 min-h-6 text-[15px] text-error">
            {cartState === "failed" ? "Could not add to cart. Please try again." : ""}
          </p>

          <p className="mt-4 text-[16px] text-text-secondary">
            Ordering for a team?{" "}
            <Link href={`/bulk-orders/request?product=${product.id}&title=${encodeURIComponent(title || "")}`} className="font-semibold text-brand hover:text-navy">
              Request a bulk quote
            </Link>
            {" · "}
            <Link href="/build" className="font-semibold text-brand hover:text-navy">Check fit in the builder</Link>
          </p>
        </div>
      </section>

      <section aria-labelledby="specifications" className="mt-20 max-w-3xl">
        <h2 id="specifications" className="text-[clamp(1.75rem,1.3rem+1.8vw,2.5rem)] font-bold leading-[1] tracking-[-0.03em] text-navy">
          Specifications
        </h2>
        {specRows.length > 0 ? (
          <table className="mt-6 w-full bg-white text-left text-[16px]">
            <tbody className="divide-y divide-border">
              {specRows.map((row) => (
                <tr key={row.key}>
                  <th scope="row" className="px-5 py-3 font-normal text-text-secondary">{row.label}</th>
                  <td className="px-5 py-3 text-right font-semibold tabular-nums text-navy">
                    {String(row.value)}{row.unit ? ` ${row.unit}` : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="mt-6 bg-white px-5 py-6 text-[16px] text-text-secondary">
            Specifications for this part are not published yet.{" "}
            <Link href="/support" className="font-semibold text-brand hover:text-navy">Ask us</Link> and we will send the datasheet.
          </p>
        )}
      </section>

      {relatedProducts.length > 0 ? (
        <section aria-labelledby="related" className="mt-20">
          <h2 id="related" className="text-[clamp(1.75rem,1.3rem+1.8vw,2.5rem)] font-bold leading-[1] tracking-[-0.03em] text-navy">
            {category ? `More ${category}` : "More parts"}
          </h2>
          <ul className="mt-6 divide-y divide-border bg-white px-4 md:px-6">
            {relatedProducts.map((p) => (
              <ProductListRow key={p.id} product={p} />
            ))}
          </ul>
        </section>
      ) : null}

      {/* Phones: price and the two actions stay in reach while reading the specs. */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t border-border bg-white px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden">
        <p className="min-w-0 flex-1 truncate text-[17px] font-bold tabular-nums text-navy">{priceText ?? "Price on request"}</p>
        <button
          type="button"
          onClick={() => handleAddToCart()}
          disabled={!inStock || cartState === "adding"}
          aria-label={addLabel}
          className="min-h-11 bg-surface-soft px-4 text-[15px] font-semibold text-navy disabled:opacity-40"
        >
          {cartState === "added" ? "Added" : "Add"}
        </button>
        <button
          type="button"
          onClick={handleBuyNow}
          disabled={!inStock || cartState === "adding"}
          className="min-h-11 bg-navy px-5 text-[15px] font-semibold text-white disabled:opacity-40"
        >
          Buy Now
        </button>
      </div>
    </div>
  );
}
