"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronRight, Cpu, FileText, Heart, LogOut, MapPin, Package, Star, User } from "lucide-react";

// Same names as the header's account menu, so a section is called the same thing everywhere.
const NAV_ITEMS = [
  { href: "/account/orders", label: "Your orders", hint: "Track, return or cancel", icon: Package },
  { href: "/account/wishlist", label: "Wishlist", hint: "Parts you saved", icon: Heart },
  { href: "/account/builds", label: "Saved builds", hint: "Drones you configured", icon: Cpu },
  { href: "/account/bulk-requests", label: "Quotations", hint: "Bulk order requests", icon: FileText },
  { href: "/account/reviews", label: "Your reviews", hint: "What you have rated", icon: Star },
  { href: "/account/addresses", label: "Addresses", hint: "Where we deliver", icon: MapPin },
  { href: "/account", label: "Your details", hint: "Name, email, phone", icon: User },
];

function useSignOut() {
  const router = useRouter();
  return async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
    router.replace("/account");
    router.refresh();
  };
}

/**
 * Desktop sidebar. Below lg it renders nothing: each account page already has a back link and its
 * own title, and the account home shows <AccountTiles /> instead, so a phone never scrolls past a
 * long list to reach the page it opened.
 */
export function AccountNav() {
  const pathname = usePathname();
  const signOut = useSignOut();

  return (
    <aside aria-label="Account navigation" className="hidden w-64 shrink-0 lg:block">
      <div className="card p-4">
        <nav className="space-y-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || (href !== "/account" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-[14px] font-semibold transition-colors ${
                  isActive ? "bg-navy text-white" : "text-navy hover:bg-surface-soft hover:text-brand"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-white" : "text-text-muted"}`} aria-hidden />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-4 border-t border-border pt-3">
          <button
            type="button"
            onClick={signOut}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-[14px] font-semibold text-text-secondary transition-colors hover:bg-error-soft hover:text-error"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            <span>Sign out</span>
          </button>
        </div>
      </div>
    </aside>
  );
}

/** Account home on phones and tablets: every section as a tile, two to a row, then sign out. */
export function AccountTiles() {
  const signOut = useSignOut();
  const sections = NAV_ITEMS.filter((i) => i.href !== "/account"); // "Your details" is this page

  return (
    <nav aria-label="Account sections" className="lg:hidden">
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {sections.map(({ href, label, hint, icon: Icon }) => (
          <li key={href}>
            <Link href={href} className="flex h-full flex-col gap-2 rounded-xl bg-white p-4 transition-colors active:bg-surface-soft">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-soft text-brand">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <span>
                <span className="block text-[15px] font-semibold text-navy">{label}</span>
                <span className="block text-[13px] leading-snug text-text-secondary">{hint}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={signOut}
        className="mt-3 flex min-h-12 w-full items-center justify-between rounded-xl bg-white px-4 text-[15px] font-semibold text-error"
      >
        <span className="flex items-center gap-3">
          <LogOut className="h-5 w-5" aria-hidden /> Sign out
        </span>
        <ChevronRight className="h-4 w-4 text-text-muted" aria-hidden />
      </button>
    </nav>
  );
}
