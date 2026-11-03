import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ProductRow } from "@/components/product/product-row";
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

  const childNodes = activeBrand ? [] : active ? active.children : tree;
  const railHeading = "text-[15px] font-semibold text-navy";

  return (
    <>
      <Header />
      <main className="min-h-screen bg-surface-soft px-5 pb-24 md:px-10">
        <section className="pt-10 pb-10 lg:pt-16">
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-[15px] text-text-secondary">
            <Link href="/" className="hover:text-brand">Home</Link>
            <span aria-hidden>/</span>
            {trail || activeBrand ? (
              <Link href="/parts" className="hover:text-brand">UAV Parts</Link>
            ) : (
              <span aria-current="page" className="text-navy">UAV Parts</span>
            )}
            {trail?.map((node, i) => (
              <span key={node.id} className="flex items-center gap-1.5">
                <span aria-hidden>/</span>
                {i === trail.length - 1 && !activeBrand ? (
                  <span aria-current="page" className="text-navy">{node.name}</span>
                ) : (
                  <Link href={href(node.handle)} className="hover:text-brand">{node.name}</Link>
                )}
              </span>
            ))}
            {activeBrand ? (
              <span className="flex items-center gap-1.5">
                <span aria-hidden>/</span>
                <span aria-current="page" className="text-navy">{activeBrand.title}</span>
              </span>
            ) : null}
          </nav>
          <h1 className="mt-4 text-[clamp(2.5rem,1.6rem+3.6vw,4.5rem)] font-bold leading-[0.95] tracking-[-0.04em] text-balance text-navy">
            {activeBrand ? `${activeBrand.title}${active ? ` ${active.name}` : ""}` : active ? active.name : "UAV Parts"}
          </h1>
          <p className="mt-4 max-w-[48ch] text-[18px] leading-[1.5] text-navy">
            {active ? `Browse ${active.name} by type, spec or brand.` : "Motors, props, ESCs, packs, frames and electronics, filtered by the spec you build to."}
          </p>
        </section>

        <div className="grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside aria-label="Filters" className="space-y-8">
            {/* Below lg the chip row above the list already offers these. */}
            <div className={childNodes.length > 0 ? "hidden lg:block" : undefined}>
              <h2 className={railHeading}>{siblingsLabel}</h2>
              {levelNodes.length === 0 ? (
                <p className="mt-3 text-[15px] text-text-secondary">No further sub-categories.</p>
              ) : (
                <ul className="mt-3 space-y-1 text-[15px] text-text-secondary">
                  {levelNodes.map((node) => (
                    <li key={node.id}>
                      <Link href={href(node.handle, params.brand)} className="flex items-baseline justify-between gap-3 py-1 hover:text-brand">
                        <span>{node.name}</span>
                        <span className="tabular-nums">{countForNode(node, index)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              {active ? (
                <Link
                  href={href(trail && trail.length > 1 ? trail[trail.length - 2].handle : undefined, params.brand)}
                  className="mt-3 block text-[15px] font-semibold text-brand hover:text-navy"
                >
                  Back to {trail && trail.length > 1 ? trail[trail.length - 2].name : "all categories"}
                </Link>
              ) : null}
            </div>

            {facets.map((facet) => (
              <div key={facet.key}>
                <h2 className={railHeading}>
                  {facet.label}
                  {facet.unit ? <span className="ml-1 font-normal text-text-secondary">({facet.unit})</span> : null}
                </h2>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {facet.values.map(({ value, count }) => {
                    const selected = selectedSpecs[facet.key] === value;
                    return (
                      <Link
                        key={value}
                        href={toggleSpec(facet.key, value)}
                        aria-pressed={selected}
                        className={`px-2.5 py-1.5 text-[15px] tabular-nums transition-colors ${
                          selected ? "bg-navy text-white" : "bg-white text-navy hover:text-brand"
                        }`}
                      >
                        {value}
                        {facet.unit && facet.unit.length <= 3 ? facet.unit : ""}
                        <span className={selected ? "ml-1.5 text-white/70" : "ml-1.5 text-text-secondary"}>{count}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}

            {visibleBrands.length > 0 ? (
              <div>
                <h2 className={railHeading}>Brand</h2>
                <ul className="mt-3 space-y-1 text-[15px] text-text-secondary">
                  {visibleBrands.map((b) => {
                    const selected = activeBrand?.id === b.id;
                    return (
                      <li key={b.id}>
                        <Link
                          href={href(params.category, selected ? undefined : b.handle)}
                          aria-current={selected ? "true" : undefined}
                          className={`flex items-baseline justify-between gap-3 py-1 hover:text-brand ${selected ? "font-semibold text-navy" : ""}`}
                        >
                          <span>{b.title}</span>
                          <span className="tabular-nums">{index.byBrand.get(b.id)}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : null}

            {params.category || params.brand || Object.keys(selectedSpecs).length ? (
              <Link href="/parts" className="inline-flex min-h-11 items-center bg-white px-5 text-[15px] font-semibold text-navy hover:text-brand">
                Clear filters
              </Link>
            ) : null}
          </aside>

          <div>
            {childNodes.length > 0 ? (
              <ul className="mb-8 flex flex-wrap gap-2">
                {childNodes.map((node) => (
                  <li key={node.id}>
                    <Link href={href(node.handle)} className="inline-flex min-h-11 items-baseline gap-2 bg-white px-4 py-2.5 text-[16px] font-semibold text-navy hover:text-brand">
                      {node.name}
                      <span className="text-[15px] font-normal tabular-nums text-text-secondary">{countForNode(node, index)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}

            <p className="text-[16px] text-text-secondary">
              <span className="font-semibold tabular-nums text-navy">{products.length}</span> {products.length === 1 ? "product" : "products"}
            </p>

            {products.length === 0 ? (
              <p className="mt-4 bg-white px-6 py-10 text-center text-[16px] text-text-secondary">No products here yet.</p>
            ) : (
              <ul className="mt-4 divide-y divide-border bg-white px-4 md:px-6">
                {products.map((product) => (
                  <ProductRow key={product.id} product={product} />
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
