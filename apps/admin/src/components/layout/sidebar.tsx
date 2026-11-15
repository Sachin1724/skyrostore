"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BarChart3,
  ShoppingCart,
  Package,
  Warehouse,
  Users,
  Truck,
  CreditCard,
  MessageSquare,
  Settings,
  FileText,
  FolderTree,
  Tag,
  PenLine,
  Images,
  ShieldCheck,
  Undo2,
  Percent,
  Mail,
  X,
} from "lucide-react";

type NavItem = { href: string; label: string; icon: typeof LayoutDashboard; countKey?: keyof NavCounts };
export type NavCounts = { ordersAwaiting: number; bulkSubmitted: number; moderationPending: number; returnsPending: number };

const GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "Operations",
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard },
      { href: "/orders", label: "Orders", icon: ShoppingCart, countKey: "ordersAwaiting" },
      { href: "/shipments", label: "Shipments", icon: Truck },
      { href: "/bulk-orders", label: "Quotations", icon: FileText, countKey: "bulkSubmitted" },
      { href: "/returns", label: "Returns", icon: Undo2, countKey: "returnsPending" },
      { href: "/support", label: "Support", icon: MessageSquare },
    ],
  },
  {
    label: "Catalog",
    items: [
      { href: "/products", label: "Products", icon: Package },
      { href: "/categories", label: "Categories", icon: FolderTree },
      { href: "/brands", label: "Brands", icon: Tag },
      { href: "/inventory", label: "Inventory", icon: Warehouse },
      { href: "/media", label: "Media", icon: Images },
    ],
  },
  {
    label: "Merchandising",
    items: [
      { href: "/content", label: "Homepage", icon: PenLine },
      { href: "/promotions", label: "Promotions", icon: Percent },
      { href: "/moderation", label: "Reviews & questions", icon: ShieldCheck, countKey: "moderationPending" },
      { href: "/analytics", label: "Analytics", icon: BarChart3 },
      { href: "/customers", label: "Customers", icon: Users },
      { href: "/subscribers", label: "Subscribers", icon: Mail },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/payments", label: "Payments", icon: CreditCard },
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

function Badge({ count }: { count: number }) {
  if (!count) return null;
  return (
    <span className="ml-auto rounded-full bg-amber-100 px-1.5 py-0.5 text-[11px] font-semibold text-amber-800">
      {count > 99 ? "99+" : count}
    </span>
  );
}

export function AdminSidebar({ counts, open, onClose }: { counts: NavCounts; open: boolean; onClose: () => void }) {
  const pathname = usePathname();

  return (
    <>
      {open ? <div className="fixed inset-0 z-30 bg-black/40 md:hidden" onClick={onClose} aria-hidden /> : null}
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex w-56 shrink-0 flex-col border-r border-gray-200 bg-white transition-transform md:static md:translate-x-0 ${
        open ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="flex h-14 items-center justify-between border-b border-gray-200 px-4">
        <span className="text-sm font-semibold tracking-tight text-nearblack">SKYROSTORE</span>
        <button type="button" onClick={onClose} aria-label="Close menu" className="rounded p-1 text-gray-500 hover:bg-gray-100 md:hidden">
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto py-3">
        {GROUPS.map((group) => (
          <div key={group.label} className="mb-3">
            <p className="px-4 pb-1 text-[11px] font-semibold uppercase tracking-wider text-gray-400">{group.label}</p>
            {group.items.map((item) => {
              const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex items-center gap-2.5 px-4 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 ${
                    isActive ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                  {item.countKey ? <Badge count={counts[item.countKey]} /> : null}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
    </>
  );
}
