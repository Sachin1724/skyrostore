"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, User, ShoppingCart, Menu } from "lucide-react";
import { SearchAutocomplete } from "@/components/layout/search-autocomplete";

const NAV_LINKS = [
  { href: "/uavs", label: "UAVs" },
  { href: "/parts", label: "UAV Parts" },
  { href: "/build", label: "Build" },
  { href: "/brands", label: "Brands" },
  { href: "/bulk-orders", label: "Bulk Orders" },
  { href: "/support", label: "Support" },
] as const;

export function Header() {
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const updateCount = () => {
      const cartId = localStorage.getItem("cart_id");
      if (!cartId) return;
      fetch(`/api/cart?id=${cartId}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          const count = data?.cart?.items?.reduce(
            (sum: number, item: { quantity: number }) => sum + item.quantity,
            0
          ) || 0;
          setCartCount(count);
        })
        .catch(() => null);
    };

    updateCount();
    window.addEventListener("storage", updateCount);
    return () => window.removeEventListener("storage", updateCount);
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-white" style={{ borderBottom: "1px solid var(--color-border)" }}>
      <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-8 md:px-10">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-[17px] font-extrabold tracking-[-0.03em] text-graphite">
            SKYROSTORE
          </Link>
          <nav className="hidden items-center gap-6 lg:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[13px] font-medium text-text-secondary transition-colors hover:text-graphite"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4 md:gap-5">
          {/* Integrated search bar with product suggestions */}
          <SearchAutocomplete className="hidden sm:block w-48 md:w-64" />

          <Link
            href="/account"
            aria-label="Account"
            className="p-1 text-text-secondary transition-colors hover:text-graphite"
          >
            <User className="h-[18px] w-[18px]" strokeWidth={1.7} />
          </Link>

          <Link
            href="/cart"
            aria-label="Cart"
            className="relative p-1 text-text-secondary transition-colors hover:text-graphite"
          >
            <ShoppingCart className="h-[18px] w-[18px]" strokeWidth={1.7} />
            <span
              className="absolute -right-1.5 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent font-mono text-[10px] font-bold text-graphite"
              style={{ boxShadow: "0 0 0 1.5px #FFFFFF" }}
            >
              {cartCount}
            </span>
          </Link>

          <button
            type="button"
            aria-label="Menu"
            className="p-1 text-text-secondary hover:text-graphite lg:hidden"
          >
            <Menu className="h-[18px] w-[18px]" strokeWidth={1.7} />
          </button>
        </div>
      </div>
    </header>
  );
}
