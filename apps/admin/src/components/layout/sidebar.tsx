import Link from "next/link";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Warehouse,
  Users,
  Wrench,
  Factory,
  Plane,
  ShieldCheck,
  Truck,
  CreditCard,
  MessageSquare,
  Settings,
  FileText,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/orders", label: "Orders", icon: ShoppingCart },
  { href: "/bulk-orders", label: "Bulk & Quotes", icon: FileText },
  { href: "/products", label: "Products", icon: Package },
  { href: "/inventory", label: "Inventory", icon: Warehouse },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/uav-builds", label: "UAV Builds", icon: Wrench },
  { href: "/manufacturing", label: "Manufacturing", icon: Factory },
  { href: "/flight-tests", label: "Flight Tests", icon: Plane },
  { href: "/quality", label: "Quality Control", icon: ShieldCheck },
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
