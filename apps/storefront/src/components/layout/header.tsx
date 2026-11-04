import { Suspense } from "react";
import { getCategoryTree, type CategoryNode } from "@/lib/data/catalog";
import { HeaderBar } from "./header-bar";
import { CategoryMenu } from "./category-menu";
import { Ticker } from "./ticker";
import { NavLink } from "./nav-link";

const BAR_LIMIT = 7;

/** Site header: facts strip, logo + search + account + cart, then the category bar. */
export async function Header() {
  // A header must never take a page down; with no tree the bar still offers Parts and Drones.
  const tree: CategoryNode[] = await getCategoryTree().catch(() => []);

  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:bg-white focus:px-4 focus:py-2">
        Skip to content
      </a>
      <Ticker />
      <header className="sticky top-0 z-50 bg-white/85 backdrop-blur-xl backdrop-saturate-150">
        <HeaderBar categories={tree.map((c) => ({ name: c.name, handle: c.handle }))} />
        <nav aria-label="Categories" className="hidden pb-2.5 lg:block">
          <div className="mx-auto flex h-10 max-w-[1760px] items-center gap-7 px-8 text-[14px] font-medium text-text-secondary">
            <CategoryMenu tree={tree} />
            <Suspense fallback={null}>
              {tree.length === 0 ? (
                <>
                  <NavLink href="/uavs">Drones</NavLink>
                  <NavLink href="/parts">Parts</NavLink>
                </>
              ) : (
                tree.slice(0, BAR_LIMIT).map((c) => (
                  <NavLink key={c.id} href={`/parts?category=${c.handle}`}>{c.name}</NavLink>
                ))
              )}
              <span className="flex-1" />
              <NavLink href="/build" className="font-semibold text-brand">Build your drone</NavLink>
              <NavLink href="/bulk-orders">Bulk orders</NavLink>
            </Suspense>
          </div>
        </nav>
      </header>
    </>
  );
}
