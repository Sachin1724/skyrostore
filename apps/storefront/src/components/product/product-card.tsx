import Link from "next/link";
import Image from "next/image";
import type { HttpTypes } from "@medusajs/types";
import { formatPrice } from "@/lib/utils";
import { cleanName } from "@/lib/data/catalog";
import { getProductTechnicalHighlights } from "@/lib/technical-specs";
import { ProductMediaFallback } from "./product-media-fallback";
import { QuickAdd } from "./quick-add";
import { ProductTile } from "./product-tile";
import { WishlistButton } from "@/app/products/[handle]/components/wishlist-button";
import { QuickViewButton } from "@/components/catalog/quick-view-button";
import { CompareCheckbox } from "@/components/catalog/compare-drawer";

const LOW_STOCK = 5;

/** Everything a listing shows about one product, read once from the Medusa record. */
export function productSummary(product: HttpTypes.StoreProduct) {
  const variant = product.variants?.[0];
  const price = variant?.calculated_price;
  const qty = variant?.inventory_quantity;
  const managed = variant?.manage_inventory !== false && qty != null;
  const amount = price?.calculated_amount ?? null;
  const original = price?.original_amount ?? null;
  return {
    title: cleanName(product.title ?? ""),
    href: `/products/${product.handle}`,
    category: product.categories?.[0]?.name ? cleanName(product.categories[0].name) : undefined,
    brand: product.collection?.title ?? undefined,
    spec: getProductTechnicalHighlights(product.metadata).join(" · "),
    variantId: variant?.id,
    multipleVariants: (product.variants?.length ?? 0) > 1,
    amount,
    // Struck-through price only when Medusa reports a real higher original (price list / sale).
    original: amount != null && original != null && original > amount ? original : null,
    currency: price?.currency_code ?? "inr",
    inStock: !managed || qty! > 0,
    lowStock: managed && qty! > 0 && qty! <= LOW_STOCK ? qty! : null,
  };
}

function StockLine({ inStock, lowStock }: { inStock: boolean; lowStock: number | null }) {
  if (!inStock) return <span className="text-[13px] font-medium text-text-muted">Out of stock</span>;
  if (lowStock) return <span className="text-[13px] font-semibold text-warning-strong">Only {lowStock} left</span>;
  return <span className="text-[13px] font-semibold text-success">In stock</span>;
}

function PriceLine({ s }: { s: ReturnType<typeof productSummary> }) {
  if (s.amount == null) return null;
  const off = s.original ? Math.round((1 - s.amount / s.original) * 100) : 0;
  return (
    <p className="flex flex-wrap items-baseline gap-x-2 tabular-nums">
      <span className="text-[16px] font-semibold text-navy">{formatPrice(s.amount, s.currency)}</span>
      {s.original ? (
        <>
          <s className="text-[13px] text-text-muted">{formatPrice(s.original, s.currency)}</s>
          <span className="text-[13px] font-medium text-success">{off}% off</span>
        </>
      ) : null}
    </p>
  );
}

function AddButton({ product, s }: { product: HttpTypes.StoreProduct; s: ReturnType<typeof productSummary> }) {
  if (s.multipleVariants) {
    return (
      <Link href={s.href} className="btn btn-secondary shrink-0">
        Choose Options
      </Link>
    );
  }
  return <QuickAdd productId={product.id} variantId={s.variantId} inStock={s.inStock} title={s.title} />;
}

/** Grid card: the shared tile, fed from a Medusa product. */
export function ProductCard({ product, priority = false }: { product: HttpTypes.StoreProduct; priority?: boolean }) {
  const s = productSummary(product);
  return (
    <ProductTile
      href={s.href}
      image={product.thumbnail}
      priority={priority}
      fallback={<ProductMediaFallback componentType={product.metadata?.component_type as string | undefined} category={s.category} title={s.title} />}
      eyebrow={[s.brand, s.category].filter(Boolean).join(" · ") || undefined}
      title={s.title}
      spec={s.spec || undefined}
      price={<PriceLine s={s} />}
      status={<StockLine inStock={s.inStock} lowStock={s.lowStock} />}
      action={<AddButton product={product} s={s} />}
      badge={
        s.original ? (
          <span className="absolute left-0 top-3 z-10 rounded-r-full bg-error py-1 pl-2.5 pr-3 text-[13px] font-semibold text-white">
            {Math.round((1 - s.amount! / s.original) * 100)}% off
          </span>
        ) : null
      }
      overlay={
        <>
          <div className="absolute right-2.5 top-2.5 z-10 flex flex-col items-end gap-1.5">
            <WishlistButton
              productId={product.id}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white transition-transform hover:scale-110"
            />
            <div className="card-extra">
              <QuickViewButton product={product} />
            </div>
            <div className="card-extra">
              <CompareCheckbox product={product} />
            </div>
          </div>
        </>
      }
    />
  );
}

/** Dense list row for the list view: same data, one line per product. */
export function ProductListRow({ product }: { product: HttpTypes.StoreProduct }) {
  const s = productSummary(product);
  return (
    <li className="flex items-center gap-4 py-4">
      <div className="flex flex-col items-center gap-1.5">
        <CompareCheckbox product={product} />
        <WishlistButton
          productId={product.id}
          className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-soft text-navy hover:text-brand"
        />
      </div>
      <Link href={s.href} tabIndex={-1} aria-hidden className="relative h-20 w-20 shrink-0 rounded-md bg-surface-soft">
        {product.thumbnail ? (
          <Image src={product.thumbnail} alt="" fill sizes="80px" className="object-contain p-2" />
        ) : (
          <ProductMediaFallback componentType={product.metadata?.component_type as string | undefined} category={s.category} title={s.title} />
        )}
      </Link>
      <div className="min-w-0 flex-1">
        <Link href={s.href} className="line-clamp-2 text-[16px] font-bold leading-snug text-navy hover:text-brand">{s.title}</Link>
        <p className="truncate text-[13px] text-text-muted">{[s.brand, s.category].filter(Boolean).join(" · ")}</p>
        {s.spec ? <p className="truncate text-[14px] tabular-nums text-text-secondary">{s.spec}</p> : null}
      </div>
      <div className="hidden w-40 shrink-0 text-right sm:block">
        <PriceLine s={s} />
        <StockLine inStock={s.inStock} lowStock={s.lowStock} />
      </div>
      <div className="flex items-center gap-2">
        <QuickViewButton product={product} variant="pill" />
        <AddButton product={product} s={s} />
      </div>
    </li>
  );
}
