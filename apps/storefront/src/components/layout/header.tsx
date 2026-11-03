import Link from "next/link";
import { getCategoryTree, type CategoryNode } from "@/lib/data/catalog";
import { HeaderBar } from "./header-bar";
import { CategoryMenu } from "./category-menu";

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
      <div className="bg-navy text-[13px] text-[#DCE7F3]">
        <ul className="mx-auto flex h-9 max-w-[1376px] items-center justify-center gap-10 px-4 md:px-8">
          <li>Pay by UPI, card or netbanking, secured by Razorpay</li>
          <li className="hidden md:block">Tracked delivery on every parcel</li>
          <li className="hidden md:block">GST invoice with every order</li>
        </ul>
      </div>
      <header className="sticky top-0 z-50 border-b border-border bg-white">
        <HeaderBar categories={tree.map((c) => ({ name: c.name, handle: c.handle }))} />
        <nav aria-label="Categories" className="hidden border-t border-surface-muted lg:block">
          <div className="mx-auto flex h-12 max-w-[1376px] items-center gap-7 px-8 text-[14px] font-semibold text-navy">
            <CategoryMenu tree={tree} />
            {tree.length === 0 ? (
              <>
                <Link href="/uavs" className="hover:text-brand">Drones</Link>
                <Link href="/parts" className="hover:text-brand">Parts</Link>
              </>
            ) : (
              tree.slice(0, BAR_LIMIT).map((c) => (
                <Link key={c.id} href={`/parts?category=${c.handle}`} className="whitespace-nowrap hover:text-brand">
                  {c.name}
                </Link>
              ))
            )}
            <span className="flex-1" />
            <Link href="/build" className="whitespace-nowrap text-brand hover:text-navy">Build checker</Link>
            <Link href="/bulk-orders" className="whitespace-nowrap hover:text-brand">Bulk orders</Link>
          </div>
        </nav>
      </header>
    </>
  );
}
