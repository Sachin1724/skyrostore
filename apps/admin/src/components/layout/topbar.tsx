"use client";

import { usePathname, useRouter } from "next/navigation";
import { ExternalLink, LogOut, Menu } from "lucide-react";

const LABELS: Record<string, string> = {
  "": "Dashboard",
  orders: "Orders",
  analytics: "Analytics",
  events: "Events",
  "bulk-orders": "Quotations",
  products: "Products",
  new: "New",
  categories: "Categories",
  brands: "Brands",
  content: "Homepage",
  media: "Media",
  inventory: "Inventory",
  customers: "Customers",
  shipments: "Shipments",
  payments: "Payments",
  support: "Support",
  moderation: "Reviews & questions",
  promotions: "Promotions",
  returns: "Returns",
  subscribers: "Subscribers",
  settings: "Settings",
};

function crumbLabel(segment: string): string {
  return LABELS[segment] ?? (segment.length > 12 ? `#${segment.slice(-6)}` : segment);
}

export function AdminTopBar({ storefrontUrl, operatorEmail, onMenu }: { storefrontUrl: string; operatorEmail: string | null; onMenu: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const segments = pathname.split("/").filter(Boolean);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
    router.replace("/login");
    router.refresh();
  }

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-gray-200 bg-white px-3 md:px-6">
      <button type="button" onClick={onMenu} aria-label="Open menu" className="rounded p-2 text-gray-600 hover:bg-gray-100 md:hidden">
        <Menu className="h-5 w-5" aria-hidden />
      </button>
      <nav aria-label="Breadcrumb" className="hidden min-w-0 flex-1 items-center gap-1.5 truncate text-sm text-gray-500 md:flex">
        <span className="font-medium text-gray-900">Dashboard</span>
        {segments.map((seg, i) => (
          <span key={i} className="flex items-center gap-1.5">
            <span aria-hidden>/</span>
            <span className={i === segments.length - 1 ? "font-medium text-gray-900" : ""}>{crumbLabel(seg)}</span>
          </span>
        ))}
      </nav>

      <div className="ml-auto flex items-center gap-3 md:gap-4">
        <a
          href={storefrontUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 rounded sm:flex"
        >
          View live store
          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
        </a>
        <div className="hidden h-5 w-px bg-gray-200 sm:block" aria-hidden />
        {operatorEmail && <span className="hidden text-sm text-gray-500 lg:inline" title={operatorEmail}>{operatorEmail}</span>}
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 rounded"
        >
          <LogOut className="h-3.5 w-3.5" aria-hidden />
          Sign out
        </button>
      </div>
    </header>
  );
}
