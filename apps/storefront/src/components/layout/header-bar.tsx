"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Menu, ShoppingCart, X } from "lucide-react";
import { SearchAutocomplete } from "@/components/layout/search-autocomplete";
import { AccountMenu } from "@/components/layout/account-menu";
import { DeliverTo } from "@/components/layout/deliver-to";
import { categoryHref } from "@/lib/category-art";
import { CART_ADDED, CART_ADDING, CART_FAILED, type PendingItem } from "@/lib/cart-client";
import { SkyroLogo } from "@/components/brand/logo";
import { CartDrawer, cartCount, cartTotal, type DrawerCart } from "@/components/cart/cart-drawer";
import { formatPrice } from "@/lib/utils";

type Cat = { name: string; handle: string };

export function HeaderBar({ categories }: { categories: Cat[] }) {
  const pathname = usePathname();
  const [cart, setCart] = useState<DrawerCart | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [pending, setPending] = useState<PendingItem | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [bump, setBump] = useState(0);
  const menuRef = useRef<HTMLDialogElement>(null);

  const refresh = useCallback(async () => {
    const id = localStorage.getItem("cart_id");
    if (!id) return setCart(null);
    const res = await fetch(`/api/cart?id=${id}`).catch(() => null);
    setCart(res?.ok ? (await res.json()).cart : null);
  }, []);

  useEffect(() => {
    void refresh();
    // The drawer opens the moment a product button is pressed, then fills in when the add returns.
    const onAdding = (e: Event) => {
      setPending((e as CustomEvent<PendingItem | undefined>).detail ?? { title: "Your item" });
      setCartOpen(true);
    };
    const onAdded = (e: Event) => {
      const next = (e as CustomEvent<DrawerCart | null>).detail;
      const done = () => {
        setPending(null);
        setBump((n) => n + 1);
      };
      if (next) {
        setCart(next);
        done();
      } else void refresh().then(done);
    };
    const onUpdated = (e: Event) => {
      const next = (e as CustomEvent<DrawerCart | null>).detail;
      if (next) setCart(next);
      else void refresh();
    };
    const onFailed = () => setPending(null);
    const onStorage = () => void refresh();
    const events: [string, (e: Event) => void][] = [
      ["storage", onStorage],
      [CART_ADDING, onAdding],
      [CART_ADDED, onAdded],
      ["cart:updated", onUpdated],
      [CART_FAILED, onFailed],
    ];
    for (const [name, fn] of events) window.addEventListener(name, fn);
    return () => {
      for (const [name, fn] of events) window.removeEventListener(name, fn);
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
      <div className="mx-auto flex h-16 max-w-[1760px] items-center gap-3 px-4 md:h-[72px] md:gap-8 md:px-8">
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
          <SkyroLogo priority />
        </Link>

        <DeliverTo />

        <div role="search" className="hidden h-11 min-w-0 flex-1 rounded-full bg-surface-soft focus-within:bg-white focus-within:ring-2 focus-within:ring-brand/40 md:flex">
          <SearchAutocomplete className="min-w-0 flex-1" browse={categories} scoped />
        </div>

        <nav aria-label="Account" className="ml-auto flex items-center gap-1 md:gap-4">
          <AccountMenu />
          <Link href="/account/orders" className="hidden h-11 flex-col justify-center leading-tight text-navy hover:text-brand lg:flex">
            <span className="text-[12px] text-text-secondary">Returns</span>
            <span className="text-[14px] font-semibold">&amp; orders</span>
          </Link>
          <Link href="/account/wishlist" aria-label="Wishlist" className="hidden h-11 min-w-11 items-center justify-center text-navy hover:text-brand md:flex">
            <Heart className="h-[22px] w-[22px]" strokeWidth={1.8} aria-hidden />
          </Link>
          <button
            type="button"
            onClick={() => {
              void refresh();
              setCartOpen(true);
            }}
            aria-label={`Open cart, ${count} ${count === 1 ? "item" : "items"}`}
            className="flex h-11 items-center gap-2.5 rounded-full px-2.5 text-[14px] font-medium text-navy hover:text-brand md:h-10 md:bg-surface-soft md:px-3.5"
          >
            <span className="relative">
              <ShoppingCart className="h-[22px] w-[22px]" strokeWidth={1.8} aria-hidden />
              {count > 0 ? (
                <span key={bump} className={`absolute -right-2.5 -top-2 ${bump ? "count-bump" : ""} flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand px-1 text-[13px] font-bold tabular-nums text-white`}>
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

      {/* Phones: search always visible on its own row, the delivery PIN under it. */}
      <div className="px-4 pb-1 md:hidden">
        <div role="search" className="flex h-11 rounded-full bg-surface-soft focus-within:ring-2 focus-within:ring-brand/40">
          <SearchAutocomplete className="min-w-0 flex-1" browse={categories} />
        </div>
      </div>
      <div className="px-4 pb-1 lg:hidden">
        <DeliverTo variant="row" />
      </div>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} cart={cart} setCart={setCart} pending={pending} />

      <dialog
        ref={menuRef}
        onClose={() => setMenuOpen(false)}
        onClick={(e) => e.target === menuRef.current && setMenuOpen(false)}
        aria-label="Menu"
        className="sheet-left m-0 mr-auto h-dvh max-h-dvh w-[86vw] max-w-[360px] overscroll-contain bg-white p-0 text-navy backdrop:bg-navy/40"
      >
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <SkyroLogo />
          <button type="button" onClick={() => setMenuOpen(false)} aria-label="Close menu" className="flex h-11 w-11 items-center justify-center">
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <nav aria-label="Main" className="overflow-y-auto px-4 py-2" onClick={(e) => (e.target as HTMLElement).closest("a") && setMenuOpen(false)}>
          <Link href="/" className="flex min-h-12 items-center border-b border-surface-muted text-[16px] font-semibold">
            Home
          </Link>
          <p className="pb-1 pt-4 text-[13px] font-semibold text-text-secondary">Shop</p>
          <ul>
            {categories.map((c) => (
              <li key={c.handle}>
                <Link href={categoryHref(c)} className="flex min-h-12 items-center border-b border-surface-muted text-[16px] font-semibold">
                  {c.name}
                </Link>
              </li>
            ))}
            <li><Link href="/parts" className="flex min-h-12 items-center border-b border-surface-muted text-[16px] font-semibold text-brand">All parts</Link></li>
          </ul>
          <p className="pb-1 pt-5 text-[13px] font-semibold text-text-secondary">More</p>
          <ul>
            {[
              { href: "/build", label: "Build checker" },
              { href: "/brands", label: "Brands" },
              { href: "/bulk-orders", label: "Bulk orders" },
              { href: "/account/orders", label: "Your orders" },
              { href: "/account/wishlist", label: "Wishlist" },
              { href: "/account", label: "Account" },
              { href: "/support", label: "Help and support" },
            ].map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="flex min-h-12 items-center border-b border-surface-muted text-[16px] font-medium">{l.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </dialog>
    </>
  );
}
