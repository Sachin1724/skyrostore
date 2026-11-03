import Link from "next/link";
import type { HttpTypes } from "@medusajs/types";
import { ProductCard, ProductListRow } from "@/components/product/product-card";
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
import { FilterPanel, SortSelect } from "./catalog-controls";
import { BrandHeader } from "./brand-header";
import { SearchSuggestions } from "./search-suggestions";
import { QuickViewModal } from "./quick-view-modal";
import { CompareDrawer } from "./compare-drawer";

export type CatalogParams = Record<string, string | undefined>;

const PAGE_SIZE = 24;
const FETCH_LIMIT = 500;

const SORTS = [
  { value: "best_selling", label: "Best Selling" },
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
] as const;

const amountOf = (p: HttpTypes.StoreProduct) => p.variants?.[0]?.calculated_price?.calculated_amount ?? null;
const inStock = (p: HttpTypes.StoreProduct) => {
  const v = p.variants?.[0];
  return v?.manage_inventory === false || v?.inventory_quantity == null || v.inventory_quantity > 0;
};
const toRupees = (paise: number) => Math.round(paise / 100);
const rupeesParam = (v?: string) => (v && /^\d+$/.test(v) ? Number(v) : null);

/**
 * One listing for every catalogue route (/parts, /search, /uavs, /brands/[handle]).
 * Every filter, the sort, the view and the page live in the URL, so reload, back and
 * shared links all restore the same list.
 */
export async function CatalogView({
  params,
  basePath,
  fixed = {},
  heading,
  intro,
  crumbs,
}: {
  params: CatalogParams;
  basePath: string;
  /** Filters the route itself implies (a brand page's brand); never shown as removable. */
  fixed?: { category?: string; brand?: string };
  heading?: string;
  intro?: string;
  crumbs: { href: string; label: string }[];
}) {
  const [tree, brands, index] = await Promise.all([getCategoryTree(), getBrands(), getCatalogIndex()]);

  const categoryHandle = fixed.category ?? params.category;
  const brandHandle = fixed.brand ?? params.brand;
  const q = params.q?.trim() || undefined;
  const trail = categoryHandle ? pathTo(tree, categoryHandle) : null;
  const active = trail ? trail[trail.length - 1] : null;
  const activeBrand = brands.find((b) => b.handle === brandHandle) ?? null;

  const { products: fetched } = await getProducts({
    limit: FETCH_LIMIT,
    q,
    category_id: active ? descendantIds(active) : undefined,
    collection_id: activeBrand ? [activeBrand.id] : undefined,
  });

  const specs: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) if (key.startsWith("f_") && value) specs[key.slice(2)] = value;
  const min = rupeesParam(params.min);
  const max = rupeesParam(params.max);
  const stockOnly = params.stock === "1";
  const sort = SORTS.some((s) => s.value === params.sort) ? params.sort! : "best_selling";
  const view = params.view === "list" ? "list" : "grid";

  const facets = buildFacets(fetched);
  let list = applyFacets(fetched, specs).filter((p) => {
    const a = amountOf(p);
    if (min != null && (a == null || toRupees(a) < min)) return false;
    if (max != null && (a == null || toRupees(a) > max)) return false;
    return !stockOnly || inStock(p);
  });

  if (sort === "best_selling") {
    list = [...list].sort((a, b) => {
      const invA = a.variants?.[0]?.inventory_quantity ?? 0;
      const invB = b.variants?.[0]?.inventory_quantity ?? 0;
      const countA = (a.variants?.length ?? 1) * 10 + invA;
      const countB = (b.variants?.length ?? 1) * 10 + invB;
      return countB - countA;
    });
  } else if (sort === "newest") {
    list = [...list].sort((a, b) => String(b.created_at ?? "").localeCompare(String(a.created_at ?? "")));
  } else {
    const dir = sort === "price_asc" ? 1 : -1;
    list = [...list].sort((a, b) => ((amountOf(a) ?? Infinity) - (amountOf(b) ?? Infinity)) * dir);
  }

  const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const page = Math.min(pages, Math.max(1, Number(params.page) || 1));
  const shown = list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  /** Current URL with some params changed; any filter change returns to page 1. */
  const href = (change: CatalogParams, keepPage = false) => {
    const next: CatalogParams = { ...params, ...change };
    if (!keepPage) delete next.page;
    if (fixed.category) delete next.category;
    if (fixed.brand) delete next.brand;
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(next)) if (v) qs.set(k, v);
    const s = qs.toString();
    return s ? `${basePath}?${s}` : basePath;
  };

  // Removable selections, shown as chips above the results.
  const chips: { label: string; href: string }[] = [];
  if (active && !fixed.category) chips.push({ label: active.name, href: href({ category: undefined }) });
  if (activeBrand && !fixed.brand) chips.push({ label: activeBrand.title, href: href({ brand: undefined }) });
  for (const [key, value] of Object.entries(specs)) {
    const f = facets.find((x) => x.key === key);
    chips.push({ label: `${f?.label ?? key}: ${value}${f?.unit && f.unit.length <= 3 ? f.unit : ""}`, href: href({ [`f_${key}`]: undefined }) });
  }
  if (min != null || max != null) {
    const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
    chips.push({ label: max != null ? `${inr(min ?? 0)} – ${inr(max)}` : `From ${inr(min!)}`, href: href({ min: undefined, max: undefined }) });
  }
  if (stockOnly) chips.push({ label: "In stock", href: href({ stock: undefined }) });
  const clearAll = href(Object.fromEntries(Object.keys(params).filter((k) => k !== "q").map((k) => [k, undefined])));

  const levelNodes: CategoryNode[] = fixed.category ? active?.children ?? [] : active ? active.children : tree;
  const visibleBrands = fixed.brand ? [] : brands.filter((b) => (index.byBrand.get(b.id) ?? 0) > 0);
  const title = heading ?? (activeBrand && !fixed.brand ? `${activeBrand.title}${active ? ` ${active.name}` : ""}` : active?.name ?? "All Parts");
  const railHeading = "text-[14px] font-bold text-navy";

  const isBrandPage = Boolean(fixed.brand && activeBrand);
  const isSearchPage = basePath === "/search" || Boolean(q);

  return (
    <main id="main" className="min-h-screen bg-page pb-20">
      <div className="mx-auto max-w-[1376px] px-4 md:px-8">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 pt-5 text-[13px] text-text-secondary">
          <Link href="/" className="hover:text-brand">Home</Link>
          {crumbs.map((c) => (
            <span key={c.href} className="flex items-center gap-1.5">
              <span aria-hidden>/</span>
              <Link href={c.href} className="hover:text-brand">{c.label}</Link>
            </span>
          ))}
          {!fixed.category &&
            trail?.map((node) => (
              <span key={node.id} className="flex items-center gap-1.5">
                <span aria-hidden>/</span>
                <Link href={href({ category: node.handle })} className="hover:text-brand">{node.name}</Link>
              </span>
            ))}
        </nav>

        {/* Brand Header on /brands/[handle] */}
        {isBrandPage && activeBrand ? (
          <div className="mt-4">
            <BrandHeader brandTitle={activeBrand.title} count={list.length} />
          </div>
        ) : (
          <div className="mt-2 flex flex-wrap items-baseline gap-x-3">
            <h1 className="text-[clamp(1.6rem,1.2rem+1.4vw,2.1rem)] font-extrabold tracking-[-0.03em] text-navy">{title}</h1>
            <p className="text-[14px] tabular-nums text-text-secondary">
              {list.length} {list.length === 1 ? "result" : "results"}
            </p>
          </div>
        )}

        {/* Search Popular Suggestions on /search */}
        {isSearchPage ? (
          <div className="mt-4">
            <SearchSuggestions currentQuery={q} />
          </div>
        ) : null}

        {intro ? <p className="mt-1 max-w-[60ch] text-[15px] text-text-secondary">{intro}</p> : null}

        <div className="mt-5 grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[264px_minmax(0,1fr)] lg:gap-8">
          <div className="lg:sticky lg:top-[150px] lg:self-start">
            <FilterPanel activeCount={chips.length} resultCount={list.length}>
              {levelNodes.length > 0 ? (
                <section className="border-b border-border py-4">
                  <h2 className={railHeading}>{active ? `Inside ${active.name}` : "Category"}</h2>
                  <ul className="mt-2 text-[14px] text-text-secondary">
                    {levelNodes.map((node) => (
                      <li key={node.id}>
                        <Link
                          href={fixed.category ? `/parts?category=${node.handle}` : href({ category: node.handle })}
                          className="flex min-h-9 items-center justify-between gap-3 hover:text-brand"
                        >
                          <span>{node.name}</span>
                          <span className="tabular-nums text-text-muted">{countForNode(node, index)}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              <form action={basePath} className="border-b border-border py-4">
                {/* Carry every other selection through the GET submit. */}
                {Object.entries(params)
                  .filter(([k, v]) => v && !["min", "max", "stock", "page"].includes(k) && !(fixed.category && k === "category") && !(fixed.brand && k === "brand"))
                  .map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
                <fieldset>
                  <legend className={railHeading}>Price (₹)</legend>
                  <div className="mt-2 flex items-end gap-2">
                    <label className="flex flex-1 flex-col gap-1 text-[12px] text-text-secondary">
                      Min
                      <input name="min" type="text" inputMode="numeric" pattern="[0-9]*" defaultValue={min ?? ""} placeholder="0" autoComplete="off" className="h-10 w-full rounded-md border border-border-strong px-2.5 text-[14px] text-navy" />
                    </label>
                    <label className="flex flex-1 flex-col gap-1 text-[12px] text-text-secondary">
                      Max
                      <input name="max" type="text" inputMode="numeric" pattern="[0-9]*" defaultValue={max ?? ""} placeholder="Any" autoComplete="off" className="h-10 w-full rounded-md border border-border-strong px-2.5 text-[14px] text-navy" />
                    </label>
                  </div>
                </fieldset>
                <label className="mt-4 flex min-h-9 cursor-pointer items-center justify-between gap-3 text-[14px] font-bold text-navy">
                  In stock only
                  <input type="checkbox" name="stock" value="1" defaultChecked={stockOnly} className="h-[18px] w-[18px] accent-brand" />
                </label>
                <button type="submit" className="mt-3 h-10 w-full rounded-md border-[1.5px] border-brand text-[14px] font-semibold text-brand hover:bg-brand hover:text-white">
                  Apply
                </button>
              </form>

              {facets.map((facet) => (
                <section key={facet.key} className="border-b border-border py-4">
                  <h2 className={railHeading}>
                    {facet.label}
                    {facet.unit ? <span className="ml-1 font-normal text-text-secondary">({facet.unit})</span> : null}
                  </h2>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {facet.values.map(({ value, count }) => {
                      const selected = specs[facet.key] === value;
                      return (
                        <Link
                          key={value}
                          href={href({ [`f_${facet.key}`]: selected ? undefined : value })}
                          aria-current={selected ? "true" : undefined}
                          className={`inline-flex min-h-9 items-center rounded-md border px-2.5 text-[14px] tabular-nums transition-colors ${
                            selected ? "border-brand bg-brand text-white" : "border-border-strong bg-white text-navy hover:border-brand hover:text-brand"
                          }`}
                        >
                          {value}
                          {facet.unit && facet.unit.length <= 3 ? facet.unit : ""}
                          <span className={selected ? "ml-1.5 text-white/80" : "ml-1.5 text-text-muted"}>{count}</span>
                        </Link>
                      );
                    })}
                  </div>
                </section>
              ))}

              {visibleBrands.length > 0 ? (
                <section className="py-4">
                  <h2 className={railHeading}>Brand</h2>
                  <ul className="mt-2 text-[14px] text-text-secondary">
                    {visibleBrands.map((b) => {
                      const selected = activeBrand?.id === b.id;
                      return (
                        <li key={b.id}>
                          <Link
                            href={href({ brand: selected ? undefined : b.handle })}
                            aria-current={selected ? "true" : undefined}
                            className={`flex min-h-9 items-center justify-between gap-3 hover:text-brand ${selected ? "font-bold text-brand" : ""}`}
                          >
                            <span>{b.title}</span>
                            <span className="tabular-nums text-text-muted">{index.byBrand.get(b.id)}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ) : null}
            </FilterPanel>
          </div>

          <section aria-label="Results" className="min-w-0">
            {chips.length > 0 ? (
              <div className="mb-3 flex flex-wrap items-center gap-2">
                {chips.map((c) => (
                  <Link
                    key={c.label}
                    href={c.href}
                    aria-label={`Remove filter ${c.label}`}
                    className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border-strong bg-brand-soft pl-3 pr-2 text-[13px] font-semibold text-navy hover:border-brand"
                  >
                    {c.label}
                    <span aria-hidden className="text-[16px] leading-none">×</span>
                  </Link>
                ))}
                <Link href={clearAll} className="ml-1 text-[13px] font-semibold text-brand hover:text-navy">Clear all</Link>
              </div>
            ) : null}

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-white px-3 py-2.5">
              <SortSelect value={sort} options={SORTS.map((s) => ({ ...s, href: href({ sort: s.value === "best_selling" ? undefined : s.value }) }))} />
              <div className="flex items-center gap-2">
                <div role="group" aria-label="View" className="flex gap-1.5">
                  {(["grid", "list"] as const).map((v) => (
                    <Link
                      key={v}
                      href={href({ view: v === "grid" ? undefined : v }, true)}
                      aria-current={view === v ? "true" : undefined}
                      className={`inline-flex h-10 items-center rounded-md border px-3 text-[14px] font-semibold ${
                        view === v ? "border-brand bg-brand-soft text-brand" : "border-border text-text-secondary hover:text-brand"
                      }`}
                    >
                      {v === "grid" ? "Grid" : "List"}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {shown.length === 0 ? (
              <div className="mt-4 rounded-lg border border-border bg-white px-6 py-12 text-center">
                <p className="text-[18px] font-bold text-navy">{q ? `Nothing matches “${q}”` : "No products match these filters"}</p>
                <p className="mt-2 text-[15px] text-text-secondary">
                  {chips.length ? "Remove a filter, or browse a category." : "Try another word, or browse a category."}
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  {chips.length ? (
                    <Link href={clearAll} className="inline-flex h-10 items-center rounded-md bg-brand px-4 text-[14px] font-semibold text-white hover:bg-navy">Clear Filters</Link>
                  ) : null}
                  {tree.slice(0, 6).map((c) => (
                    <Link key={c.id} href={`/parts?category=${c.handle}`} className="inline-flex h-10 items-center rounded-md border border-border-strong px-4 text-[14px] font-semibold text-navy hover:border-brand hover:text-brand">
                      {c.name}
                    </Link>
                  ))}
                </div>
                <p className="mt-6 text-[14px] text-text-secondary">
                  Looking for something specific? <Link href="/support" className="font-semibold text-brand">Ask support</Link>
                </p>
              </div>
            ) : view === "list" ? (
              <ul className="mt-4 divide-y divide-border rounded-lg border border-border bg-white px-4 md:px-5">
                {shown.map((p) => <ProductListRow key={p.id} product={p} />)}
              </ul>
            ) : (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 2xl:grid-cols-4">
                {shown.map((p, i) => <ProductCard key={p.id} product={p} priority={i < 4} />)}
              </div>
            )}

            {pages > 1 ? (
              <nav aria-label="Pagination" className="mt-8 flex flex-wrap items-center justify-center gap-2">
                {page > 1 ? (
                  <Link href={href({ page: String(page - 1) }, true)} className="inline-flex h-10 items-center rounded-md border border-border bg-white px-3 text-[14px] font-semibold hover:border-brand">Previous</Link>
                ) : null}
                {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
                  <Link
                    key={n}
                    href={href({ page: n === 1 ? undefined : String(n) }, true)}
                    aria-current={n === page ? "page" : undefined}
                    className={`inline-flex h-10 min-w-10 items-center justify-center rounded-md border text-[14px] font-semibold tabular-nums ${
                      n === page ? "border-brand bg-brand text-white" : "border-border bg-white text-navy hover:border-brand"
                    }`}
                  >
                    {n}
                  </Link>
                ))}
                {page < pages ? (
                  <Link href={href({ page: String(page + 1) }, true)} className="inline-flex h-10 items-center rounded-md border border-border bg-white px-3 text-[14px] font-semibold hover:border-brand">Next</Link>
                ) : null}
              </nav>
            ) : null}
          </section>
        </div>
      </div>

      {/* Global Quick View Dialog */}
      <QuickViewModal />

      {/* Floating Compare Drawer and Side-by-Side Modal */}
      <CompareDrawer />
    </main>
  );
}
