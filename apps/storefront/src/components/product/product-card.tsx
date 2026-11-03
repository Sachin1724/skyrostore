import Link from "next/link";
import Image from "next/image";
import type { HttpTypes } from "@medusajs/types";
import { formatPrice } from "@/lib/utils";
import { cleanName } from "@/lib/data/catalog";
import { getProductTechnicalHighlights } from "@/lib/technical-specs";
import { ProductMediaFallback } from "./product-media-fallback";
import { QuickAdd } from "./quick-add";

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
  if (lowStock) return <span className="text-[13px] font-semibold text-[#8A5B00]">Only {lowStock} left</span>;
  return <span className="text-[13px] font-semibold text-success">In stock</span>;
}

function PriceLine({ s }: { s: ReturnType<typeof productSummary> }) {
  if (s.amount == null) return null;
  const off = s.original ? Math.round((1 - s.amount / s.original) * 100) : 0;
  return (
    <p className="flex flex-wrap items-baseline gap-x-2 tabular-nums">
      <span className="text-[18px] font-extrabold text-navy">{formatPrice(s.amount, s.currency)}</span>
      {s.original ? (
        <>
          <s className="text-[13px] text-text-muted">{formatPrice(s.original, s.currency)}</s>
          <span className="text-[13px] font-semibold text-success">{off}% off</span>
        </>
      ) : null}
    </p>
  );
}

function AddButton({ product, s }: { product: HttpTypes.StoreProduct; s: ReturnType<typeof productSummary> }) {
  if (s.multipleVariants) {
    return (
      <Link href={s.href} className="inline-flex h-10 shrink-0 items-center rounded-md border-[1.5px] border-brand px-3 text-[14px] font-semibold text-brand hover:bg-brand hover:text-white">
        Choose Options
      </Link>
    );
  }
  return <QuickAdd productId={product.id} variantId={s.variantId} inStock={s.inStock} title={s.title} />;
}

/** Grid card: image, category, two-line title, key spec, price, stock, add. */
export function ProductCard({ product, priority = false }: { product: HttpTypes.StoreProduct; priority?: boolean }) {
  const s = productSummary(product);
  return (
    <article className="group flex flex-col overflow-hidden rounded-lg border border-border bg-white transition-[border-color,box-shadow] hover:border-accent hover:shadow-[0_6px_20px_rgba(10,26,47,0.08)]">
      <Link href={s.href} tabIndex={-1} aria-hidden className="relative block aspect-square bg-surface-soft">
        {product.thumbnail ? (
          <Image
            src={product.thumbnail}
            alt=""
            fill
            priority={priority}
            sizes="(min-width: 1280px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-contain p-5 transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <ProductMediaFallback componentType={product.metadata?.component_type as string | undefined} category={s.category} title={s.title} />
        )}
        {s.original ? (
          <span className="absolute left-3 top-3 rounded bg-error px-2 py-0.5 text-[12px] font-bold text-white">
            -{Math.round((1 - s.amount! / s.original) * 100)}%
          </span>
        ) : null}
      </Link>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        {s.brand || s.category ? (
          <p className="truncate text-[12px] font-semibold text-text-muted">{[s.brand, s.category].filter(Boolean).join(" · ")}</p>
        ) : null}
        <h3 className="line-clamp-2 min-h-[2.7em] text-[15px] font-bold leading-snug text-navy">
          <Link href={s.href} className="hover:text-brand">{s.title}</Link>
        </h3>
        {s.spec ? <p className="truncate text-[13px] tabular-nums text-text-secondary">{s.spec}</p> : null}
        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <div className="min-w-0">
            <PriceLine s={s} />
            <StockLine inStock={s.inStock} lowStock={s.lowStock} />
          </div>
          <AddButton product={product} s={s} />
        </div>
      </div>
    </article>
  );
}

/** Dense list row for the list view: same data, one line per product. */
export function ProductListRow({ product }: { product: HttpTypes.StoreProduct }) {
  const s = productSummary(product);
  return (
    <li className="flex items-center gap-4 py-4">
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
      <AddButton product={product} s={s} />
    </li>
  );
}
