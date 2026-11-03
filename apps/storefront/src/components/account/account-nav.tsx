"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Package,
  Heart,
  Layers,
  LogOut,
  User,
  ShieldCheck,
  FileText,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/account/orders", label: "My Orders & Tracking", icon: Package },
  { href: "/account/bulk-requests", label: "B2B & Bulk Quotations", icon: Layers },
  { href: "/account/wishlist", label: "Saved Wishlist", icon: Heart },
  { href: "/account", label: "Profile & Authentication", icon: User },
];

export function AccountNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/account");
      router.refresh();
    } catch {
      // Fallback
    }
  }

  return (
    <aside aria-label="Account navigation" className="w-full lg:w-64 shrink-0">
      <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
        <div className="border-b border-border pb-3 mb-3">
          <span className="block text-[11px] font-extrabold uppercase tracking-wider text-brand">
            Builder Portal
          </span>
          <h2 className="text-[16px] font-extrabold text-navy">Account Navigation</h2>
        </div>

        <nav className="space-y-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || (href !== "/account" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-[13px] font-bold transition-all ${
                  isActive
                    ? "bg-navy text-white shadow-sm"
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

      {/* Trust reassurance badge */}
      <div className="mt-4 rounded-xl border border-border bg-white p-4 text-[12px] text-text-secondary shadow-sm space-y-2">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-brand shrink-0" aria-hidden />
          <span>GSTIN: 21AAECS9821R1ZM</span>
        </div>
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-brand shrink-0" aria-hidden />
          <span>Input Tax Credit Receipts</span>
        </div>
      </div>
    </aside>
  );
}
