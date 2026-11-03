import Link from "next/link";
import Image from "next/image";
import { formatPrice } from "@/lib/utils";
import { cleanName } from "@/lib/data/catalog";
import { getProductTechnicalHighlights } from "@/lib/technical-specs";
import { ProductMediaFallback } from "./product-media-fallback";
import { QuickAdd } from "./quick-add";

/** One line of the parts list: the spec that matters for this type, stock, price, add. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ProductRow({ product }: { product: any }) {
  const variant = product.variants?.[0];
  const price = variant?.calculated_price;
  const category = product.categories?.[0]?.name ? cleanName(product.categories[0].name) : undefined;
  const brandName = product.collection?.title as string | undefined;
  const inStock = variant?.inventory_quantity != null ? variant.inventory_quantity > 0 : true;
  const spec = getProductTechnicalHighlights(product.metadata).join(" · ");
  const title = cleanName(product.title ?? "");
  const priceLine = (className?: string) => (
    <div className={className}>
      {price?.calculated_amount != null ? (
        <p className="text-[17px] font-semibold tabular-nums">{formatPrice(price.calculated_amount, price.currency_code)}</p>
      ) : null}
      <p className={`text-[14px] leading-[1.9] ${inStock ? "text-success" : "text-text-muted"}`}>{inStock ? "In stock" : "Out of stock"}</p>
    </div>
  );

  return (
    <li className="flex items-center gap-4 py-4">
      <Link href={`/products/${product.handle}`} className="group flex min-w-0 flex-1 items-center gap-4 text-navy">
        <div className="relative h-16 w-16 shrink-0 bg-surface-soft md:h-20 md:w-20">
          {product.thumbnail ? (
            <Image src={product.thumbnail} alt="" fill sizes="80px" className="object-contain p-2" />
          ) : (
            <ProductMediaFallback componentType={product.metadata?.component_type} category={category} title={title} />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-[17px] font-semibold leading-snug group-hover:text-brand sm:truncate">{title}</p>
          <p className="truncate text-[15px] text-text-secondary">
            {[brandName, category].filter(Boolean).join(" · ")}
          </p>
          {spec ? <p className="truncate text-[15px] tabular-nums text-navy">{spec}</p> : null}
          {priceLine("mt-1 flex gap-3 sm:hidden")}
        </div>
        <div className="hidden shrink-0 text-right sm:block">
          {priceLine()}
        </div>
      </Link>
      <QuickAdd productId={product.id} variantId={variant?.id} inStock={inStock} />
    </li>
  );
}
