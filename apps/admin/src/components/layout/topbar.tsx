"use client";

import { usePathname, useRouter } from "next/navigation";
import { ExternalLink, LogOut } from "lucide-react";

const LABELS: Record<string, string> = {
  "": "Dashboard",
  orders: "Orders",
  analytics: "Analytics",
  events: "Events",
  "bulk-orders": "Bulk & Quotes",
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
  moderation: "Moderation",
  settings: "Settings",
};

function crumbLabel(segment: string): string {
  return LABELS[segment] ?? (segment.length > 12 ? `#${segment.slice(-6)}` : segment);
}

export function AdminTopBar({ storefrontUrl, operatorEmail }: { storefrontUrl: string; operatorEmail: string | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const segments = pathname.split("/").filter(Boolean);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
    router.replace("/login");
    router.refresh();
  }

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-gray-500">
        <span className="font-medium text-gray-900">Dashboard</span>
        {segments.map((seg, i) => (
          <span key={i} className="flex items-center gap-1.5">
            <span aria-hidden>/</span>
            <span className={i === segments.length - 1 ? "font-medium text-gray-900" : ""}>{crumbLabel(seg)}</span>
          </span>
        ))}
      </nav>

      <div className="flex items-center gap-4">
        <a
          href={storefrontUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 rounded"
        >
          View live store
          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
        </a>
        <div className="h-5 w-px bg-gray-200" aria-hidden />
        {operatorEmail && <span className="text-sm text-gray-500" title={operatorEmail}>{operatorEmail}</span>}
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
