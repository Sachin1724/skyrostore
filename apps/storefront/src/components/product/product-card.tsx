"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { ProductMediaFallback } from "./product-media-fallback";
import { QuickAdd } from "./quick-add";
import { getProductTechnicalHighlights } from "@/lib/technical-specs";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ProductCard({ product }: { product: any }) {
  const [saved, setSaved] = useState(false);

  const variant = product.variants?.[0];
  const price = variant?.calculated_price;
  const category = product.categories?.[0]?.name?.replace("[DEV] ", "") as string | undefined;
  const brandName = product.collection?.title as string | undefined;
  const inStock = variant?.inventory_quantity != null ? variant.inventory_quantity > 0 : true;
  const technicalHighlights = getProductTechnicalHighlights(product.metadata);

  return (
    <Link
      href={`/products/${product.handle}`}
      className="group relative block bg-surface transition-colors hover:border-border-strong"
      style={{ borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}
    >
      <div
        className="relative aspect-square overflow-hidden bg-surface-soft"
        style={{ borderRadius: "var(--radius-md) var(--radius-md) 0 0" }}
      >
        {product.thumbnail ? (
          <Image
            src={product.thumbnail}
            alt={product.title}
            fill
            className="object-contain p-4 transition-transform group-hover:scale-[1.02]"
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
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
          aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
          className="absolute right-3 top-3 z-10 text-text-muted transition-colors hover:text-graphite"
          onClick={(e) => {
            e.preventDefault();
            setSaved(!saved);
          }}
        >
          <Heart
            className="h-[18px] w-[18px] transition-colors"
            strokeWidth={1.6}
            fill={saved ? "var(--color-graphite)" : "none"}
            color={saved ? "var(--color-graphite)" : "currentColor"}
          />
        </button>
      </div>
      <div className="p-3">
        {(brandName || category) && (
          <p className="text-[13px] text-text-muted">
            {brandName ? <span className="font-semibold text-text-secondary">{brandName}</span> : null}
            {brandName && category ? " · " : null}
            {category}
          </p>
        )}
        <h3 className="mt-0.5 text-[14px] font-semibold leading-snug text-graphite line-clamp-1">
          {product.title?.replace("[DEV] ", "")}
        </h3>

        {/* Real Technical Highlights */}
        {technicalHighlights.length > 0 && (
          <p className="mt-1 text-[13px] font-medium text-text-muted line-clamp-1">
            {technicalHighlights.join("  |  ")}
          </p>
        )}

        <div className="mt-3 flex items-end justify-between pt-1">
          <div>
            {price?.calculated_amount != null && (
              <p className="text-[15px] font-bold text-graphite">
                {formatPrice(price.calculated_amount, price.currency_code)}
              </p>
            )}
            <div className="mt-0.5 flex items-center gap-1.5">
              <span className={`h-1.5 w-1.5 rounded-full ${inStock ? "bg-success" : "bg-text-muted"}`} />
              <span className={`text-[13px] font-medium ${inStock ? "text-success" : "text-text-muted"}`}>
                {inStock ? "In Stock" : "Out of Stock"}
              </span>
            </div>
          </div>
          <QuickAdd productId={product.id} variantId={variant?.id} inStock={inStock} />
        </div>
      </div>
    </Link>
  );
}

