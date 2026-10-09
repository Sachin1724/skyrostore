import Link from "next/link";
import { Search, User, ShoppingCart, Menu } from "lucide-react";

const NAV_LINKS = [
  { href: "/uavs", label: "UAVs" },
  { href: "/parts", label: "UAV Parts" },
  { href: "/build", label: "Build" },
  { href: "/bulk-orders", label: "Bulk Orders" },
  { href: "/accessories", label: "Accessories" },
  { href: "/support", label: "Support" },
] as const;

export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-surface" style={{ borderBottom: "1px solid var(--color-border)" }}>
      <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-8 md:px-10">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-[15px] font-bold tracking-[-0.02em] text-graphite">
            SKYROSTORE
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
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
        <div className="flex items-center gap-5">
          <button type="button" aria-label="Search" className="text-text-secondary hover:text-graphite">
            <Search className="h-[18px] w-[18px]" strokeWidth={1.6} />
          </button>
          <Link href="/account" aria-label="Account" className="text-text-secondary hover:text-graphite">
            <User className="h-[18px] w-[18px]" strokeWidth={1.6} />
          </Link>
          <Link href="/cart" aria-label="Cart" className="text-text-secondary hover:text-graphite">
            <ShoppingCart className="h-[18px] w-[18px]" strokeWidth={1.6} />
          </Link>
          <button type="button" aria-label="Menu" className="text-text-secondary hover:text-graphite md:hidden">
            <Menu className="h-[18px] w-[18px]" strokeWidth={1.6} />
          </button>
        </div>
      </div>
    </header>
  );
}
