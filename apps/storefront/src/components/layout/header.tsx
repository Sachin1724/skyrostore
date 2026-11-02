"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, ShoppingCart, Menu, X } from "lucide-react";
import { SearchAutocomplete } from "@/components/layout/search-autocomplete";
import { SkyroLogo } from "@/components/brand/logo";

const NAV_LINKS = [
  { href: "/uavs", label: "Drones" },
  { href: "/parts", label: "Parts" },
  { href: "/build", label: "Build" },
  { href: "/brands", label: "Brands" },
  { href: "/bulk-orders", label: "Bulk orders" },
] as const;

export function Header() {
  const [cartCount, setCartCount] = useState(0);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    const updateCount = () => {
      const cartId = localStorage.getItem("cart_id");
      if (!cartId) return setCartCount(0);
      fetch(`/api/cart?id=${cartId}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          setCartCount(
            data?.cart?.items?.reduce((sum: number, item: { quantity: number }) => sum + item.quantity, 0) || 0
          );
        })
        .catch(() => null);
    };
    updateCount();
    window.addEventListener("storage", updateCount);
    return () => window.removeEventListener("storage", updateCount);
  }, []);

  const linkClass = (href: string) =>
    `text-[15px] transition-colors hover:text-brand ${
      pathname === href || pathname.startsWith(`${href}/`) ? "font-semibold text-navy" : "text-text-secondary"
    }`;

  return (
    <header className="sticky top-0 z-50 bg-white">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between gap-6 px-5 md:px-10">
        <div className="flex items-center gap-10">
          <Link href="/" aria-label="Skyrostore home">
            <SkyroLogo />
          </Link>
          <nav aria-label="Main" className="hidden items-center gap-7 lg:flex">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className={linkClass(link.href)}>
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <SearchAutocomplete className="hidden w-56 sm:block md:w-72" />
          <Link href="/account" aria-label="Account" className="flex h-11 w-11 items-center justify-center text-navy hover:text-brand">
            <User className="h-5 w-5" strokeWidth={1.8} />
          </Link>
          <Link
            href="/cart"
            aria-label={`Cart, ${cartCount} ${cartCount === 1 ? "item" : "items"}`}
            className="relative flex h-11 w-11 items-center justify-center text-navy hover:text-brand"
          >
            <ShoppingCart className="h-5 w-5" strokeWidth={1.8} />
            {cartCount > 0 ? (
              <span className="absolute right-0.5 top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[13px] font-semibold tabular-nums text-white">
                {cartCount}
              </span>
            ) : null}
          </Link>
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((v) => !v)}
            className="flex h-11 w-11 items-center justify-center text-navy lg:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open ? (
        <nav id="mobile-menu" aria-label="Main" className="bg-brand-soft px-5 pb-6 pt-2 lg:hidden">
          <SearchAutocomplete className="mb-4 sm:hidden" />
          <ul>
            {[...NAV_LINKS, { href: "/support", label: "Support" }].map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="block py-3 text-[18px] font-semibold text-navy">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
