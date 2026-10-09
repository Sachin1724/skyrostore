import { notFound } from "next/navigation";
import Image from "next/image";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { getProductByHandle } from "@/lib/data/products";
import { formatPrice } from "@/lib/utils";
import { AddToCartButton } from "@/components/product/add-to-cart-button";
import { Cpu } from "lucide-react";
import Link from "next/link";


export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  try {
    const { handle } = await params;
    const product = await getProductByHandle(handle);
    if (!product) return { title: "Product Not Found" };
    return {
      title: product.title,
      description: product.description || product.subtitle,
    };
  } catch (err) {
    console.error("generateMetadata error:", err);
    return { title: "Product" };
  }
}

const SPEC_SKIP = new Set(["sku", "id", "component_type"]);

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const product = await getProductByHandle(handle);
  if (!product) notFound();

  const variant = product.variants?.[0];
  const price = variant?.calculated_price;
  const sku = (product.metadata?.sku as string) || variant?.sku;
  const category = product.categories?.[0]?.name?.replace("[DEV] ", "") as string | undefined;
  const metadata = product.metadata as Record<string, string> | null;
  const specs = metadata
    ? Object.fromEntries(
        Object.entries(metadata).filter(([k]) => !SPEC_SKIP.has(k))
      )
    : null;

  return (
    <>
      <Header />
      <main className="mx-auto max-w-[1280px] px-8 py-6 md:px-10">
        {/* Breadcrumb */}
        <nav className="text-[11px] text-text-muted">
          <Link href="/" className="hover:text-text-secondary">Home</Link>
          <span className="mx-1.5">/</span>
          {category && (
            <>
              <Link href="/parts" className="hover:text-text-secondary">{category}</Link>
              <span className="mx-1.5">/</span>
            </>
          )}
          <span className="text-text-secondary">{product.title?.replace("[DEV] ", "")}</span>
        </nav>

        <div className="mt-6 grid gap-10 md:grid-cols-[55%_1fr]">
          {/* Gallery */}
          <div
            className="relative aspect-square overflow-hidden bg-surface-soft"
            style={{ borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}
          >
            {product.thumbnail ? (
              <Image
                src={product.thumbnail}
                alt={product.title}
                fill
                className="object-contain p-6"
                priority
                sizes="(min-width: 768px) 55vw, 100vw"
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center p-8 text-center select-none bg-surface-soft">
                <div
                  className="flex h-14 w-14 items-center justify-center bg-surface"
                  style={{
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--color-border)",
                  }}
                >
                  <Cpu className="h-7 w-7 text-text-disabled stroke-[1.4]" />
                </div>
                <span className="mt-3 font-mono text-[11px] uppercase tracking-[0.08em] text-text-muted">
                  Technical Media Pending
                </span>
                <span className="mt-1 text-[12px] text-text-disabled">
                  Official hardware photography is being cataloged
                </span>
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            <h1 className="text-[32px] font-bold leading-[1.05] tracking-[-0.025em] text-graphite">
              {product.title?.replace("[DEV] ", "")}
            </h1>
            {product.subtitle && (
              <p className="mt-1 text-[14px] text-text-secondary">{product.subtitle}</p>
            )}
            {sku && (
              <p className="mt-2 font-mono text-[12px] text-text-muted">SKU: {sku}</p>
            )}

            {price?.calculated_amount != null && (
              <p className="mt-5 text-[26px] font-bold text-graphite">
                {formatPrice(price.calculated_amount, price.currency_code ?? undefined)}
              </p>
            )}

            {variant && (
              <div className="mt-2 text-[13px]">
                {variant.inventory_quantity != null &&
                variant.inventory_quantity > 0 ? (
                  <span className="font-medium text-success">&bull; In Stock</span>
                ) : (
                  <span className="text-text-muted">Check availability</span>
                )}
              </div>
            )}

            {variant && (
              <div className="mt-6 flex gap-3">
                <AddToCartButton variantId={variant.id} />
              </div>
            )}

            {/* Service benefits */}
            <div className="mt-8 space-y-0" style={{ borderTop: "1px solid var(--color-border)" }}>
              {["Pan India Shipping", "GST Invoice", "Secure Payment", "Expert Support"].map((s) => (
                <div key={s} className="py-2.5 text-[12px] text-text-secondary" style={{ borderBottom: "1px solid var(--color-border)" }}>
                  {s}
                </div>
              ))}
            </div>

            {product.description && (
              <div className="mt-8">
                <h2 className="text-[14px] font-semibold text-graphite">
                  Description
                </h2>
                <p className="mt-2 max-w-[520px] text-[14px] leading-[1.55] text-text-secondary">
                  {product.description}
                </p>
              </div>
            )}

            {specs && Object.keys(specs).length > 0 && (
              <div className="mt-8">
                <h2 className="text-[14px] font-semibold text-graphite">
                  Specifications
                </h2>
                <table className="mt-3 w-full text-[13px]">
                  <tbody>
                    {Object.entries(specs).map(([key, value]) => (
                      <tr key={key} style={{ borderBottom: "1px solid var(--color-border)" }}>
                        <td className="py-2 pr-4 text-text-secondary">{key}</td>
                        <td className="py-2 font-medium text-graphite">{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

