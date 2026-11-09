"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Package,
  Heart,
  Layers,
  LogOut,
  User,
  Star,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/account/orders", label: "Orders and tracking", icon: Package },
  { href: "/account/bulk-requests", label: "Bulk quotations", icon: Layers },
  { href: "/account/wishlist", label: "Saved parts", icon: Heart },
  { href: "/account/builds", label: "Saved builds", icon: Layers },
  { href: "/account/reviews", label: "My reviews", icon: Star },
  { href: "/account", label: "My details", icon: User },
];

export function AccountNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.replace("/account");
      router.refresh();
    } catch {
      // Fallback
    }
  }

  return (
    <aside aria-label="Account navigation" className="w-full lg:w-64 shrink-0">
      <div className="card p-4">
        <nav className="space-y-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || (href !== "/account" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-[13px] font-bold transition-all ${
                  isActive
                    ? "bg-navy text-white"
                    : "text-navy hover:bg-surface-soft hover:text-brand"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? "text-brand-cyan" : "text-text-muted"}`} aria-hidden />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-4 pt-3 border-t border-border">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-[13px] font-bold text-text-secondary hover:bg-rose-50 hover:text-error transition-colors"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

    </aside>
  );
}
