import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ProductCard } from "@/components/product/product-card";
import { getProducts } from "@/lib/data/products";
import {
  getCategoryTree,
  getBrands,
  getCatalogIndex,
  pathTo,
  descendantIds,
  countForNode,
  type CategoryNode,
} from "@/lib/data/catalog";
import { applyFacets, buildFacets } from "@/lib/technical-specs";
import Link from "next/link";
import Image from "next/image";

export const metadata = { title: "UAV Parts & Components — Skyrostore" };

function href(category?: string, brand?: string, specs: Record<string, string> = {}) {
  const qs = new URLSearchParams();
  if (category) qs.set("category", category);
  if (brand) qs.set("brand", brand);
  for (const [key, value] of Object.entries(specs)) qs.set(`f_${key}`, value);
  const s = qs.toString();
  return s ? `/parts?${s}` : "/parts";
}

export default async function PartsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const [tree, brands, index] = await Promise.all([getCategoryTree(), getBrands(), getCatalogIndex()]);

  const trail = params.category ? pathTo(tree, params.category) : null;
  const active = trail ? trail[trail.length - 1] : null;
  const activeBrand = brands.find((b) => b.handle === params.brand) ?? null;

  const { products: listed } = await getProducts({
    limit: 100,
    category_id: active ? descendantIds(active) : undefined,
    collection_id: activeBrand ? [activeBrand.id] : undefined,
  });

  // "Shop by" spec filters (KV, stator size, cells…), carried as f_<key> params.
  const selectedSpecs: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (key.startsWith("f_") && value) selectedSpecs[key.slice(2)] = value;
  }
  const facets = active || activeBrand ? buildFacets(listed) : [];
  const products = applyFacets(listed, selectedSpecs);
  const toggleSpec = (key: string, value: string) => {
    const next = { ...selectedSpecs };
    if (next[key] === value) delete next[key];
    else next[key] = value;
    return href(params.category, params.brand, next);
  };

  // Sidebar shows the children of the current node, or the roots at the top level.
  const levelNodes: CategoryNode[] = active ? active.children : tree;
  const siblingsLabel = active ? `Inside ${active.name}` : "Categories";
  const visibleBrands = brands.filter((b) => (index.byBrand.get(b.id) ?? 0) > 0);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-surface-soft">
        <section className="relative overflow-hidden border-b border-border bg-white">
          <div className="mx-auto flex max-w-[1280px] flex-col justify-between px-8 py-8 md:flex-row md:items-center md:px-10">
            <div className="relative z-10 max-w-lg">
              <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-[12px] font-medium text-text-muted">
                <Link href="/" className="hover:text-graphite">Home</Link>
                <span>&gt;</span>
                {trail || activeBrand ? (
                  <Link href="/parts" className="hover:text-graphite">UAV Parts</Link>
                ) : (
                  <span className="text-graphite">UAV Parts</span>
                )}
                {trail?.map((node, i) => (
                  <span key={node.id} className="flex items-center gap-1.5">
                    <span>&gt;</span>
                    {i === trail.length - 1 && !activeBrand ? (
                      <span className="text-graphite">{node.name}</span>
                    ) : (
                      <Link href={href(node.handle)} className="hover:text-graphite">{node.name}</Link>
                    )}
                  </span>
                ))}
                {activeBrand ? (
                  <span className="flex items-center gap-1.5">
                    <span>&gt;</span>
                    <span className="text-graphite">{activeBrand.title}</span>
                  </span>
                ) : null}
              </nav>
              <h1 className="mt-3 text-[32px] font-extrabold tracking-[-0.03em] text-graphite md:text-[38px]">
                {activeBrand ? `${activeBrand.title}${active ? ` ${active.name}` : ""}` : active ? active.name : "UAV Parts"}
              </h1>
              <p className="mt-1.5 text-[14px] text-text-secondary">
                {active ? `Browse ${active.name} by type or brand.` : "High quality components for your next build."}
              </p>
            </div>
            <div className="pointer-events-none relative mt-4 h-24 w-full max-w-[480px] md:mt-0 md:h-28">
              <Image src="/images/hero/catalog-banner.png" alt="UAV Components Collage" fill className="object-contain object-right" />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1280px] px-8 py-8 md:px-10">
          <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
            <aside className="space-y-6">
              <div className="rounded-lg border border-border bg-white p-4">
                <div className="text-[13px] font-bold text-graphite">{siblingsLabel}</div>
                {levelNodes.length === 0 ? (
                  <p className="mt-3 text-[12px] text-text-muted">No further sub-categories.</p>
                ) : (
                  <ul className="mt-3 space-y-2 text-[12px] text-text-secondary">
                    {levelNodes.map((node) => (
                      <li key={node.id}>
                        <Link href={href(node.handle, params.brand)} className="flex items-center justify-between hover:text-graphite">
                          <span>{node.name}</span>
                          <span className="text-[11px] text-text-muted">({countForNode(node, index)})</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
                {active ? (
                  <Link
                    href={href(trail && trail.length > 1 ? trail[trail.length - 2].handle : undefined, params.brand)}
                    className="mt-3 block text-[11px] font-semibold text-graphite hover:underline"
                  >
                    ← Back to {trail && trail.length > 1 ? trail[trail.length - 2].name : "all categories"}
                  </Link>
                ) : null}
              </div>

              {facets.map((facet) => (
                <div key={facet.key} className="rounded-lg border border-border bg-white p-4">
                  <div className="text-[13px] font-bold text-graphite">
                    Shop by {facet.label}
                    {facet.unit ? <span className="ml-1 font-normal text-text-muted">({facet.unit})</span> : null}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {facet.values.map(({ value, count }) => {
                      const selected = selectedSpecs[facet.key] === value;
                      return (
                        <Link
                          key={value}
                          href={toggleSpec(facet.key, value)}
                          aria-pressed={selected}
                          className={`rounded border px-2 py-1 font-mono text-[11px] transition-colors ${
                            selected
                              ? "border-graphite bg-graphite text-white"
                              : "border-border text-graphite hover:border-graphite"
                          }`}
                        >
                          {value}
                          {facet.unit && facet.unit.length <= 3 ? facet.unit : ""}
                          <span className={selected ? "ml-1 text-white/70" : "ml-1 text-text-muted"}>{count}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}

              {visibleBrands.length > 0 ? (
                <div className="rounded-lg border border-border bg-white p-4">
                  <div className="text-[13px] font-bold text-graphite">Brand</div>
                  <ul className="mt-3 space-y-2 text-[12px] text-text-secondary">
                    {visibleBrands.map((b) => {
                      const selected = activeBrand?.id === b.id;
                      return (
                        <li key={b.id}>
                          <Link
                            href={href(params.category, selected ? undefined : b.handle)}
                            className={`flex items-center justify-between hover:text-graphite ${selected ? "font-bold text-graphite" : ""}`}
                          >
                            <span>{b.title}</span>
                            <span className="text-[11px] text-text-muted">({index.byBrand.get(b.id)})</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : null}

              {params.category || params.brand || Object.keys(selectedSpecs).length ? (
                <Link href="/parts" className="block w-full rounded-md border border-border bg-white py-2 text-center text-[12px] font-bold text-graphite transition-colors hover:bg-surface-soft">
                  Clear Filters
                </Link>
              ) : null}
            </aside>

            <div>
              {active && active.children.length > 0 && !activeBrand ? (
                <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                  {active.children.map((child) => (
                    <Link key={child.id} href={href(child.handle)} className="rounded-lg border border-border bg-white p-4 transition-colors hover:border-graphite">
                      <div className="text-[13px] font-bold text-graphite">{child.name}</div>
                      <div className="mt-0.5 text-[11px] text-text-muted">{countForNode(child, index)} products</div>
                    </Link>
                  ))}
                </div>
              ) : null}

              {!active && !activeBrand && tree.length > 0 ? (
                <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                  {tree.map((node) => (
                    <Link key={node.id} href={href(node.handle)} className="rounded-lg border border-border bg-white p-4 transition-colors hover:border-graphite">
                      <div className="text-[13px] font-bold text-graphite">{node.name}</div>
                      <div className="mt-0.5 text-[11px] text-text-muted">{countForNode(node, index)} products</div>
                    </Link>
                  ))}
                </div>
              ) : null}

              <div className="flex items-center justify-between rounded-lg border border-border bg-white px-4 py-3">
                <p className="text-[13px] font-semibold text-graphite">
                  <span className="font-bold">{products.length}</span> products
                </p>
              </div>

              {products.length === 0 ? (
                <p className="mt-6 rounded-lg border border-border bg-white p-8 text-center text-[13px] text-text-secondary">
                  No products here yet.
                </p>
              ) : (
                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
