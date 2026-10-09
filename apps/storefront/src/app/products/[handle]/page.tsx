import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { getProductByHandle } from "@/lib/data/products";
import { formatPrice } from "@/lib/utils";
import { AddToCartButton } from "@/components/product/add-to-cart-button";
import { ProductMediaFallback } from "@/components/product/product-media-fallback";
import { extractTechnicalSpecs, TechnicalSpecificationField } from "@/lib/technical-specs";
import {
  ShieldCheck,
  CheckCircle2,
  FileText,
  Sliders,
  Package,
  Layers,
  ArrowRight,
  ExternalLink,
} from "lucide-react";

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
      title: `${product.title?.replace("[DEV] ", "")} | Skyrostore UAV Engineering`,
      description: product.description || product.subtitle || "Professional UAV component with verified engineering specifications.",
    };
  } catch (err) {
    console.error("generateMetadata error:", err);
    return { title: "Product | Skyrostore" };
  }
}

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

  // Extract versioned/canonical specs
  const rawMetadata = (product.metadata as Record<string, unknown>) || {};
  const techSpecs = extractTechnicalSpecs(rawMetadata);
  const componentType = techSpecs?.componentType || (rawMetadata.component_type as string) || null;

  // Group additional specifications by group
  const groupedSpecs: Record<string, TechnicalSpecificationField[]> = {};
  if (techSpecs?.additionalSpecifications?.length) {
    for (const spec of techSpecs.additionalSpecifications) {
      if (!spec.visible) continue;
      const groupName = spec.group || "General";
      if (!groupedSpecs[groupName]) {
        groupedSpecs[groupName] = [];
      }
      groupedSpecs[groupName].push(spec);
    }
  }

  // Predefined order of technical specification groups
  const groupOrder = ["Performance", "Electrical", "Mechanical", "Dimensions", "Compatibility", "General"];
  const sortedGroups = Object.keys(groupedSpecs).sort((a, b) => {
    const indexA = groupOrder.indexOf(a);
    const indexB = groupOrder.indexOf(b);
    return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB);
  });

  const hasSpecs = sortedGroups.length > 0;

  return (
    <>
      <Header />
      <main className="mx-auto max-w-[1280px] px-8 py-8 md:px-10">
        {/* Technical Breadcrumbs */}
        <nav className="flex items-center text-[12px] font-mono uppercase tracking-[0.05em] text-text-muted">
          <Link href="/" className="hover:text-text-secondary">Catalog</Link>
          <span className="mx-2 text-text-disabled">/</span>
          {category && (
            <>
              <Link href="/parts" className="hover:text-text-secondary">{category}</Link>
              <span className="mx-2 text-text-disabled">/</span>
            </>
          )}
          <span className="truncate text-graphite">{product.title?.replace("[DEV] ", "")}</span>
        </nav>

        {/* Primary Product Header / Overview Grid */}
        <div className="mt-6 grid gap-10 lg:grid-cols-[52%_1fr]">
          {/* Gallery / Fallback View */}
          <div
            className="relative aspect-square w-full overflow-hidden bg-surface-soft"
            style={{ borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}
          >
            {product.thumbnail ? (
              <Image
                src={product.thumbnail}
                alt={product.title}
                fill
                className="object-contain p-8"
                priority
                sizes="(min-width: 1024px) 52vw, 100vw"
              />
            ) : (
              <ProductMediaFallback
                componentType={componentType}
                category={category}
                title={product.title}
                className="h-full w-full"
              />
            )}

            {/* Component Type Badge Overlay */}
            {componentType && (
              <div
                className="absolute top-4 left-4 inline-flex items-center gap-1.5 bg-surface/90 px-2.5 py-1 text-[11px] font-mono uppercase tracking-[0.08em] text-text-secondary backdrop-blur-xs"
                style={{ borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)" }}
              >
                <Layers className="h-3 w-3 text-text-muted" />
                {componentType.replace(/_/g, " ")}
              </div>
            )}
          </div>

          {/* Commercial & Technical Overview */}
          <div className="flex flex-col justify-start">
            <div>
              {category && (
                <span className="font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-text-muted">
                  {category}
                </span>
              )}
              <h1 className="mt-1 text-[28px] font-bold leading-[1.1] tracking-[-0.025em] text-graphite md:text-[34px]">
                {product.title?.replace("[DEV] ", "")}
              </h1>
              {product.subtitle && (
                <p className="mt-2 text-[14px] leading-relaxed text-text-secondary">
                  {product.subtitle}
                </p>
              )}
              {sku && (
                <div className="mt-3 inline-flex items-center gap-2 font-mono text-[11px] text-text-muted">
                  <span className="text-text-disabled">SKU:</span>
                  <span className="font-semibold text-graphite">{sku}</span>
                </div>
              )}
            </div>

            {/* Price & Commercial State */}
            <div className="mt-6 pt-5" style={{ borderTop: "1px solid var(--color-border)" }}>
              {price?.calculated_amount != null ? (
                <div className="flex items-baseline gap-3">
                  <span className="text-[30px] font-bold tracking-tight text-graphite">
                    {formatPrice(price.calculated_amount, price.currency_code ?? undefined)}
                  </span>
                  <span className="text-[12px] text-text-muted">excl. GST</span>
                </div>
              ) : (
                <p className="text-[18px] font-semibold text-graphite">Price on Application</p>
              )}

              {variant && (
                <div className="mt-2 flex items-center gap-2 text-[12px]">
                  {variant.inventory_quantity != null && variant.inventory_quantity > 0 ? (
                    <span className="inline-flex items-center gap-1.5 font-medium text-success">
                      <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
                      In Stock &bull; Ready for Dispatch ({variant.inventory_quantity} units)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 font-medium text-text-muted">
                      <span className="h-2 w-2 rounded-full bg-text-disabled" />
                      Available on Request / Custom Lead Time
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Primary Action Buttons */}
            {variant && (
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <AddToCartButton variantId={variant.id} />
                <Link
                  href={`/bulk-orders/request?product=${encodeURIComponent(product.id)}&title=${encodeURIComponent(product.title || "")}`}
                  className="inline-flex items-center gap-2 bg-surface px-5 py-3 text-[13px] font-semibold text-graphite transition-colors hover:bg-surface-muted"
                  style={{ borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)" }}
                >
                  <Package className="h-4 w-4 text-text-muted" strokeWidth={1.6} />
                  Request Bulk Quote
                </Link>
              </div>
            )}

            {/* Institutional Trust Assurances */}
            <div className="mt-8 grid grid-cols-2 gap-3 pt-6" style={{ borderTop: "1px solid var(--color-border)" }}>
              {[
                { title: "Pan-India Logistics", subtitle: "Insured express transit" },
                { title: "Commercial GST Invoice", subtitle: "Input tax credit verified" },
                { title: "Bench Tested", subtitle: "100% factory QA verified" },
                { title: "Engineering Support", subtitle: "Direct integration advice" },
              ].map((assur) => (
                <div key={assur.title} className="p-3 bg-surface-soft" style={{ borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)" }}>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-graphite" strokeWidth={1.8} />
                    <span className="text-[12px] font-semibold text-graphite">{assur.title}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-text-muted">{assur.subtitle}</p>
                </div>
              ))}
            </div>

            {/* Overview / Brief Description */}
            {product.description && (
              <div className="mt-6 pt-6" style={{ borderTop: "1px solid var(--color-border)" }}>
                <h2 className="text-[12px] font-bold uppercase tracking-[0.08em] text-graphite">
                  Overview
                </h2>
                <p className="mt-2 text-[14px] leading-[1.6] text-text-secondary whitespace-pre-line">
                  {product.description}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Technical Sections: Specifications, Compatibility, Documentation, What's Included */}
        <div className="mt-16 space-y-12">
          {/* Section 1: Authoritative Technical Specifications */}
          {hasSpecs && (
            <section
              id="specifications"
              className="bg-surface p-8"
              style={{ borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}
            >
              <div className="flex items-center justify-between pb-4" style={{ borderBottom: "1px solid var(--color-border)" }}>
                <div className="flex items-center gap-2.5">
                  <Sliders className="h-5 w-5 text-graphite" />
                  <h2 className="text-[18px] font-bold text-graphite tracking-tight">
                    Engineering Specifications
                  </h2>
                </div>
                <span className="font-mono text-[11px] text-text-muted">
                  Schema v{techSpecs?.schemaVersion || 1} &bull; Authoritative Data
                </span>
              </div>

              <div className="mt-6 grid gap-8 md:grid-cols-2">
                {sortedGroups.map((group) => (
                  <div key={group} className="space-y-3">
                    <h3 className="text-[12px] font-bold uppercase tracking-[0.08em] text-graphite">
                      {group}
                    </h3>
                    <div className="overflow-hidden" style={{ borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)" }}>
                      <table className="w-full text-left text-[12px]">
                        <tbody>
                          {groupedSpecs[group].map((field, idx) => (
                            <tr
                              key={field.key}
                              className={idx % 2 === 0 ? "bg-surface" : "bg-surface-soft"}
                              style={{ borderBottom: idx < groupedSpecs[group].length - 1 ? "1px solid var(--color-border)" : undefined }}
                            >
                              <td className="py-2.5 px-4 font-medium text-text-secondary">
                                {field.label}
                              </td>
                              <td className="py-2.5 px-4 text-right font-mono font-semibold text-graphite">
                                {String(field.value)}
                                {field.unit && <span className="ml-1 text-[11px] text-text-muted">{field.unit}</span>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Section 2: UAV Compatibility */}
          <section
            id="compatibility"
            className="bg-surface-soft p-8"
            style={{ borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}
          >
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <div className="inline-flex items-center gap-2 bg-graphite text-white px-2.5 py-1 text-[11px] font-mono uppercase tracking-[0.06em]" style={{ borderRadius: "var(--radius-sm)" }}>
                  <CheckCircle2 className="h-3.5 w-3.5 text-accent" />
                  Skyrostore Compatibility Verified
                </div>
                <h2 className="mt-3 text-[18px] font-bold text-graphite tracking-tight">
                  Airframe & Propulsion System Compatibility
                </h2>
                <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-text-secondary">
                  This component is verified by our propulsion engineering engine. You can test payload margins,
                  thrust-to-weight ratios, and battery discharge envelopes before placing an order.
                </p>
              </div>
              <Link
                href="/build"
                className="inline-flex items-center justify-center gap-2 bg-accent px-5 py-2.5 text-[13px] font-semibold text-graphite transition-colors hover:bg-accent-hover self-start md:self-auto"
                style={{ borderRadius: "var(--radius-sm)" }}
              >
                Configure in UAV Builder
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Quick Component Specs Summary */}
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="bg-surface p-3" style={{ borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)" }}>
                <span className="font-mono text-[10px] uppercase text-text-muted">Component Class</span>
                <p className="mt-1 font-semibold text-graphite text-[13px]">{componentType?.replace(/_/g, " ") || "Hardware Component"}</p>
              </div>
              <div className="bg-surface p-3" style={{ borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)" }}>
                <span className="font-mono text-[10px] uppercase text-text-muted">Validation Status</span>
                <p className="mt-1 font-semibold text-success text-[13px]">Engine Ready</p>
              </div>
              <div className="bg-surface p-3" style={{ borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)" }}>
                <span className="font-mono text-[10px] uppercase text-text-muted">Custom UAV Builds</span>
                <p className="mt-1 font-semibold text-graphite text-[13px]">Supported</p>
              </div>
              <div className="bg-surface p-3" style={{ borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)" }}>
                <span className="font-mono text-[10px] uppercase text-text-muted">Bulk Orders</span>
                <p className="mt-1 font-semibold text-graphite text-[13px]">Available</p>
              </div>
            </div>
          </section>

          {/* Section 3: Documentation & Compliance */}
          <section
            id="documentation"
            className="bg-surface p-8"
            style={{ borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}
          >
            <div className="flex items-center gap-2.5 pb-4" style={{ borderBottom: "1px solid var(--color-border)" }}>
              <FileText className="h-5 w-5 text-graphite" />
              <h2 className="text-[18px] font-bold text-graphite tracking-tight">
                Documentation & Regulatory Compliance
              </h2>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="p-4 bg-surface-soft" style={{ borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)" }}>
                <span className="font-mono text-[11px] font-semibold text-graphite">Technical Datasheet</span>
                <p className="mt-1 text-[12px] text-text-muted">Complete electrical curves, thermal envelopes, and mounting hole geometry.</p>
                <span className="mt-3 inline-flex items-center gap-1 text-[12px] font-medium text-graphite hover:underline cursor-pointer">
                  Download Technical PDF <ExternalLink className="h-3 w-3" />
                </span>
              </div>
              <div className="p-4 bg-surface-soft" style={{ borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)" }}>
                <span className="font-mono text-[11px] font-semibold text-graphite">DGCA / Regional Compliance</span>
                <p className="mt-1 text-[12px] text-text-muted">Compatible with standard DGCA-compliant UAV architectures and NPNT protocols where applicable.</p>
                <span className="mt-3 inline-flex items-center gap-1 text-[12px] font-medium text-text-muted">
                  Compliance Sheet Included
                </span>
              </div>
              <div className="p-4 bg-surface-soft" style={{ borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)" }}>
                <span className="font-mono text-[11px] font-semibold text-graphite">Integration & Wiring Guide</span>
                <p className="mt-1 text-[12px] text-text-muted">Pinout assignments, recommended soldering temperatures, and wire gauge guides.</p>
                <span className="mt-3 inline-flex items-center gap-1 text-[12px] font-medium text-graphite hover:underline cursor-pointer">
                  View Pinout Diagram <ExternalLink className="h-3 w-3" />
                </span>
              </div>
            </div>
          </section>

          {/* Section 4: What's Included */}
          <section
            id="whats-included"
            className="bg-surface p-8"
            style={{ borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}
          >
            <div className="flex items-center gap-2.5 pb-4" style={{ borderBottom: "1px solid var(--color-border)" }}>
              <Package className="h-5 w-5 text-graphite" />
              <h2 className="text-[18px] font-bold text-graphite tracking-tight">
                Package Contents
              </h2>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 md:grid-cols-4">
              {[
                "1x Verified Hardware Unit",
                "High-Tensile Mounting Hardware",
                "Factory QC Inspection Card",
                "Sealed Anti-Static Packaging",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-2.5 p-3 bg-surface-soft text-[12px] font-medium text-graphite"
                  style={{ borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)" }}
                >
                  <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
