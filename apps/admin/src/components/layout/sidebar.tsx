import Link from "next/link";
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
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/orders", label: "Orders", icon: ShoppingCart },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/bulk-orders", label: "Bulk & Quotes", icon: FileText },
  { href: "/products", label: "Products", icon: Package },
  { href: "/categories", label: "Categories", icon: FolderTree },
  { href: "/brands", label: "Brands", icon: Tag },
  { href: "/content", label: "Homepage", icon: PenLine },
  { href: "/media", label: "Media", icon: Images },
  { href: "/inventory", label: "Inventory", icon: Warehouse },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/shipments", label: "Shipments", icon: Truck },
  { href: "/payments", label: "Payments", icon: CreditCard },
  { href: "/support", label: "Support", icon: MessageSquare },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export function AdminSidebar() {
  return (
    <aside className="flex w-56 flex-col border-r border-gray-200 bg-white">
      <div className="flex h-14 items-center border-b border-gray-200 px-4">
        <span className="text-sm font-semibold tracking-tight text-nearblack">
          SKYROSTORE
        </span>
      </div>
      <nav className="flex-1 overflow-y-auto py-3">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
