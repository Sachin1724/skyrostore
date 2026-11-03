"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Headset, Menu, ShoppingCart, User, X } from "lucide-react";
import { SearchAutocomplete } from "@/components/layout/search-autocomplete";
import { SkyroLogo } from "@/components/brand/logo";
import { CartDrawer, cartCount, cartTotal, type DrawerCart } from "@/components/cart/cart-drawer";
import { formatPrice } from "@/lib/utils";

type Cat = { name: string; handle: string };

/** Event a product button fires after adding to the cart: the header refreshes and opens the drawer. */
export const CART_ADDED = "cart:added";

export function HeaderBar({ categories }: { categories: Cat[] }) {
  const pathname = usePathname();
  const [cart, setCart] = useState<DrawerCart | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scope, setScope] = useState("");
  const menuRef = useRef<HTMLDialogElement>(null);

  const refresh = useCallback(async () => {
    const id = localStorage.getItem("cart_id");
    if (!id) return setCart(null);
    const res = await fetch(`/api/cart?id=${id}`).catch(() => null);
    setCart(res?.ok ? (await res.json()).cart : null);
  }, []);

  useEffect(() => {
    void refresh();
    const onAdded = () => void refresh().then(() => setCartOpen(true));
    const onStorage = () => void refresh();
    window.addEventListener("storage", onStorage);
    window.addEventListener(CART_ADDED, onAdded);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(CART_ADDED, onAdded);
    };
  }, [refresh]);

  useEffect(() => setMenuOpen(false), [pathname]);

  useEffect(() => {
    const d = menuRef.current;
    if (!d) return;
    if (menuOpen && !d.open) d.showModal();
    if (!menuOpen && d.open) d.close();
  }, [menuOpen]);

  const count = cartCount(cart);

  return (
    <>
      <div className="mx-auto flex h-16 max-w-[1376px] items-center gap-3 px-4 md:h-[76px] md:gap-8 md:px-8">
        <button
          type="button"
          aria-label="Open menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(true)}
          className="-ml-2 flex h-11 w-11 items-center justify-center text-navy lg:hidden"
        >
          <Menu className="h-6 w-6" aria-hidden />
        </button>
        <Link href="/" aria-label="Skyrostore home" className="shrink-0">
          <SkyroLogo />
        </Link>

        <div role="search" className="hidden h-[46px] min-w-0 flex-1 rounded-md border-[1.5px] border-border-strong focus-within:border-brand md:flex">
          {categories.length > 0 ? (
            <>
              <label htmlFor="search-scope" className="sr-only">Search in</label>
              <select
                id="search-scope"
                value={scope}
                onChange={(e) => setScope(e.target.value)}
                className="max-w-[170px] rounded-l-[4px] border-r border-border bg-surface-soft px-3 text-[13px] font-semibold text-navy"
              >
                <option value="">All categories</option>
                {categories.map((c) => (
                  <option key={c.handle} value={c.handle}>{c.name}</option>
                ))}
              </select>
            </>
          ) : null}
          <SearchAutocomplete className="min-w-0 flex-1" category={scope} />
        </div>

        <nav aria-label="Account" className="ml-auto flex items-center gap-1 md:ml-0 md:gap-3">
          <Link href="/support" className="hidden min-w-11 flex-col items-center gap-0.5 text-[12px] font-medium text-navy hover:text-brand lg:flex">
            <Headset className="h-[22px] w-[22px]" strokeWidth={1.8} aria-hidden />
            Support
          </Link>
          <Link href="/account" aria-label="Account" className="flex h-11 min-w-11 flex-col items-center justify-center gap-0.5 text-[12px] font-medium text-navy hover:text-brand">
            <User className="h-[22px] w-[22px]" strokeWidth={1.8} aria-hidden />
            <span className="hidden lg:block">Account</span>
          </Link>
          <button
            type="button"
            onClick={() => {
              void refresh();
              setCartOpen(true);
            }}
            aria-label={`Open cart, ${count} ${count === 1 ? "item" : "items"}`}
            className="flex h-11 items-center gap-2.5 rounded-md px-2.5 text-[14px] font-semibold text-navy hover:text-brand md:h-[46px] md:bg-brand-soft md:px-3.5"
          >
            <span className="relative">
              <ShoppingCart className="h-[22px] w-[22px]" strokeWidth={1.8} aria-hidden />
              {count > 0 ? (
                <span className="absolute -right-2.5 -top-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand px-1 text-[11px] font-bold tabular-nums text-white">
                  {count}
                </span>
              ) : null}
            </span>
            {count > 0 ? (
              <span className="hidden tabular-nums md:block">{formatPrice(cartTotal(cart), cart?.currency_code)}</span>
            ) : null}
          </button>
        </nav>
      </div>

      {/* Phones: search always visible on its own row. */}
      <div className="px-4 pb-3 md:hidden">
        <div role="search" className="flex h-11 rounded-md border-[1.5px] border-border-strong focus-within:border-brand">
          <SearchAutocomplete className="min-w-0 flex-1" />
        </div>
      </div>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} cart={cart} setCart={setCart} />

      <dialog
        ref={menuRef}
        onClose={() => setMenuOpen(false)}
        onClick={(e) => e.target === menuRef.current && setMenuOpen(false)}
        aria-label="Menu"
        className="m-0 mr-auto h-dvh max-h-dvh w-[86vw] max-w-[360px] overscroll-contain bg-white p-0 text-navy backdrop:bg-navy/40"
      >
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <SkyroLogo />
          <button type="button" onClick={() => setMenuOpen(false)} aria-label="Close menu" className="flex h-11 w-11 items-center justify-center">
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <nav aria-label="Main" className="overflow-y-auto px-4 py-2" onClick={(e) => (e.target as HTMLElement).closest("a") && setMenuOpen(false)}>
          <p className="pb-1 pt-3 text-[13px] font-semibold text-text-secondary">Shop</p>
          <ul>
            {categories.map((c) => (
              <li key={c.handle}>
                <Link href={`/parts?category=${c.handle}`} className="flex min-h-12 items-center border-b border-surface-muted text-[17px] font-semibold">
                  {c.name}
                </Link>
              </li>
            ))}
            <li><Link href="/parts" className="flex min-h-12 items-center border-b border-surface-muted text-[17px] font-semibold text-brand">All parts</Link></li>
            <li><Link href="/uavs" className="flex min-h-12 items-center border-b border-surface-muted text-[17px] font-semibold">Drones</Link></li>
          </ul>
          <p className="pb-1 pt-5 text-[13px] font-semibold text-text-secondary">More</p>
          <ul>
            {[
              { href: "/build", label: "Build checker" },
              { href: "/brands", label: "Brands" },
              { href: "/bulk-orders", label: "Bulk orders" },
              { href: "/account/orders", label: "My orders" },
              { href: "/support", label: "Support" },
            ].map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="flex min-h-12 items-center border-b border-surface-muted text-[17px] font-medium">{l.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </dialog>
    </>
  );
}
