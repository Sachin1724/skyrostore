"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Package,
  ShoppingCart,
  Clock,
  Search,
  FileText,
  Truck,
  RotateCcw,
  Headphones,
  Sliders,
  Boxes,
  MapPin,
  ChevronRight,
  Download,
  AlertCircle,
  X,
  CheckCircle2,
} from "lucide-react";

function formatINR(val: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(val);
}

interface OrderItem {
  id: string;
  orderNumber: string;
  date: string;
  itemCount: number;
  total: number;
  status: "Delivered" | "In Transit" | "Processing" | "Cancelled";
  statusDescription: string;
  carrier?: string;
  images: string[];
  extraCount?: number;
}

const MOCK_ORDERS: OrderItem[] = [
  {
    id: "ord-1",
    orderNumber: "#SKY-2026-00124",
    date: "Oct 5, 2026",
    itemCount: 3,
    total: 20504,
    status: "Delivered",
    statusDescription: "Delivered on Oct 8, 2026 via Delhivery",
    carrier: "Delhivery",
    images: [
      "/images/products/t-motor-mn5212.png",
      "/images/products/carbon-fiber-prop-15in.png",
      "/images/products/lipo-6s-5000mah.png",
    ],
    extraCount: 1,
  },
  {
    id: "ord-2",
    orderNumber: "#SKY-2026-00123",
    date: "Oct 1, 2026",
    itemCount: 1,
    total: 14999,
    status: "In Transit",
    statusDescription: "Arriving Oct 10, 2026 via BlueDart",
    carrier: "BlueDart",
    images: ["/images/products/pixhawk-6x.png"],
  },
  {
    id: "ord-3",
    orderNumber: "#SKY-2026-00122",
    date: "Sep 28, 2026",
    itemCount: 4,
    total: 36980,
    status: "Processing",
    statusDescription: "Preparing for shipment • Expected by Oct 12, 2026",
    images: [
      "/images/products/x450-carbon-frame.png",
      "/images/products/t-motor-mn5212.png",
      "/images/products/hobbywing-60a-esc.png",
    ],
    extraCount: 1,
  },
  {
    id: "ord-4",
    orderNumber: "#SKY-2026-00121",
    date: "Sep 20, 2026",
    itemCount: 2,
    total: 12499,
    status: "Delivered",
    statusDescription: "Delivered on Sep 24, 2026 via Delhivery",
    carrier: "Delhivery",
    images: [
      "/images/products/hobbywing-60a-esc.png",
      "/images/products/carbon-fiber-prop-15in.png",
    ],
  },
];

export function OrderDashboard() {
  const [activeTab, setActiveTab] = useState<
    "All Orders" | "Processing" | "Shipped" | "Delivered" | "Cancelled"
  >("All Orders");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);
  const [showInvoiceAlert, setShowInvoiceAlert] = useState<string | null>(null);

  // Filter orders
  const filteredOrders = MOCK_ORDERS.filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.carrier?.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeTab === "All Orders") return matchesSearch;
    if (activeTab === "Processing") return matchesSearch && order.status === "Processing";
    if (activeTab === "Shipped") return matchesSearch && order.status === "In Transit";
    if (activeTab === "Delivered") return matchesSearch && order.status === "Delivered";
    if (activeTab === "Cancelled") return matchesSearch && order.status === "Cancelled";
    return matchesSearch;
  });

  return (
    <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
      {/* 1. LEFT SIDEBAR: ACCOUNT NAVIGATION (3 cols) */}
      <aside className="rounded-xl border border-gray-800 bg-[#181B20] p-6 text-white shadow-sm lg:col-span-3">
        {/* User Card */}
        <div className="flex items-center gap-3.5 border-b border-gray-800 pb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#2a2f38] text-[15px] font-bold text-white">
            SM
          </div>
          <div className="overflow-hidden">
            <h3 className="truncate text-[14px] font-bold text-white">Sachin Mallick</h3>
            <p className="truncate text-[11px] text-gray-400">sachin@example.com</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="mt-6 space-y-1 text-[13px]">
          <Link
            href="/account"
            className="flex items-center justify-between rounded-md px-3 py-2.5 text-gray-400 transition-colors hover:bg-[#22272e] hover:text-white"
          >
            <span>Dashboard</span>
          </Link>
          <Link
            href="/account/orders"
            className="flex items-center justify-between rounded-md bg-[#22272e] px-3 py-2.5 font-bold text-[#84cc16]"
          >
            <span>My Orders</span>
          </Link>
          <Link
            href="/account/bulk-requests"
            className="flex items-center justify-between rounded-md px-3 py-2.5 text-gray-400 transition-colors hover:bg-[#22272e] hover:text-white"
          >
            <span>Bulk Requests</span>
          </Link>
          <Link
            href="/build"
            className="flex items-center justify-between rounded-md px-3 py-2.5 text-gray-400 transition-colors hover:bg-[#22272e] hover:text-white"
          >
            <span>Saved Configurations</span>
          </Link>
          <Link
            href="/parts"
            className="flex items-center justify-between rounded-md px-3 py-2.5 text-gray-400 transition-colors hover:bg-[#22272e] hover:text-white"
          >
            <span>Wishlist</span>
          </Link>
          <Link
            href="/account"
            className="flex items-center justify-between rounded-md px-3 py-2.5 text-gray-400 transition-colors hover:bg-[#22272e] hover:text-white"
          >
            <span>Addresses</span>
          </Link>
          <Link
            href="/account"
            className="flex items-center justify-between rounded-md px-3 py-2.5 text-gray-400 transition-colors hover:bg-[#22272e] hover:text-white"
          >
            <span>Profile &amp; Security</span>
          </Link>
          <Link
            href="/account"
            className="flex items-center justify-between rounded-md px-3 py-2.5 text-gray-400 transition-colors hover:bg-[#22272e] hover:text-white"
          >
            <span>Notifications</span>
          </Link>
          <Link
            href="/support"
            className="flex items-center justify-between rounded-md px-3 py-2.5 text-gray-400 transition-colors hover:bg-[#22272e] hover:text-white"
          >
            <span>Support</span>
          </Link>
          <div className="pt-4 border-t border-gray-800">
            <Link
              href="/account"
              className="flex items-center justify-between rounded-md px-3 py-2.5 text-rose-400 transition-colors hover:bg-[#22272e]"
            >
              <span>Log Out</span>
            </Link>
          </div>
        </nav>
      </aside>

      {/* 2. CENTER: MY ORDERS WORKSPACE (6 cols) */}
      <section className="space-y-6 lg:col-span-6">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#84cc16]">
            MY ACCOUNT
          </span>
          <h1 className="mt-1 text-[28px] font-extrabold tracking-tight text-graphite">
            My Orders
          </h1>
          <p className="mt-1 text-[13px] text-text-muted">
            Track your orders, view details, download invoices and manage returns.
          </p>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex items-center gap-3.5 rounded-lg border border-border bg-white p-4 shadow-sm">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#f0fdf4] text-[#16a34a]">
              <Package className="h-5 w-5 stroke-[2]" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-text-muted">Total Orders</p>
              <p className="text-[20px] font-extrabold text-graphite">12</p>
              <p className="text-[10px] text-text-disabled">Across all time</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 rounded-lg border border-border bg-white p-4 shadow-sm">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#f0fdf4] text-[#16a34a]">
              <ShoppingCart className="h-5 w-5 stroke-[2]" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-text-muted">Total Spend</p>
              <p className="text-[20px] font-extrabold text-graphite">₹1,24,580</p>
              <p className="text-[10px] text-text-disabled">Including taxes</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 rounded-lg border border-border bg-white p-4 shadow-sm">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#f0fdf4] text-[#16a34a]">
              <Clock className="h-5 w-5 stroke-[2]" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-text-muted">Pending Deliveries</p>
              <p className="text-[20px] font-extrabold text-graphite">2</p>
              <p className="text-[10px] text-text-disabled">Orders in transit</p>
            </div>
          </div>
        </div>

        {/* Status Filter Tabs & Search Bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-3">
          <div className="flex items-center gap-5 overflow-x-auto">
            {(
              ["All Orders", "Processing", "Shipped", "Delivered", "Cancelled"] as const
            ).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`whitespace-nowrap pb-2 text-[13px] font-bold transition-all ${
                  activeTab === tab
                    ? "border-b-2 border-[#84cc16] text-graphite"
                    : "text-text-muted hover:text-graphite"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="relative sm:w-56">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search by order number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-border bg-white py-1.5 pl-8 pr-3 text-[12px] text-graphite placeholder:text-text-disabled focus:border-graphite focus:outline-none"
            />
          </div>
        </div>

        {showInvoiceAlert && (
          <div className="flex items-center justify-between rounded border border-emerald-200 bg-emerald-50 p-3 text-[12px] text-emerald-800">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Tax invoice for {showInvoiceAlert} prepared and downloaded.</span>
            </div>
            <button
              onClick={() => setShowInvoiceAlert(null)}
              className="text-emerald-700 hover:text-emerald-900"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Order Cards List */}
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="rounded-lg border border-border bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
                <div>
                  <h3 className="text-[14px] font-bold text-graphite">{order.orderNumber}</h3>
                  <p className="mt-0.5 text-[11px] text-text-muted">
                    {order.date} • {order.itemCount} {order.itemCount === 1 ? "item" : "items"} •{" "}
                    {formatINR(order.total)}
                  </p>
                </div>
                <div>
                  {order.status === "Delivered" && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Delivered
                    </span>
                  )}
                  {order.status === "In Transit" && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-2.5 py-0.5 text-[11px] font-bold text-sky-700 border border-sky-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
                      In Transit
                    </span>
                  )}
                  {order.status === "Processing" && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 border border-amber-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                      Processing
                    </span>
                  )}
                  {order.status === "Cancelled" && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-bold text-rose-700 border border-rose-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                      Cancelled
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                {/* Thumbnails Row */}
                <div>
                  <div className="flex items-center gap-2">
                    {order.images.map((img, i) => (
                      <div
                        key={i}
                        className="relative h-12 w-12 overflow-hidden rounded border border-border bg-surface-soft"
                      >
                        <Image
                          src={img}
                          alt="Ordered component"
                          fill
                          className="object-contain p-1"
                        />
                      </div>
                    ))}
                    {order.extraCount && (
                      <div className="flex h-12 w-12 items-center justify-center rounded border border-border bg-surface-soft text-[12px] font-bold text-text-muted">
                        +{order.extraCount}
                      </div>
                    )}
                  </div>
                  <p className="mt-2 text-[11px] text-text-secondary">{order.statusDescription}</p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-end">
                  {order.status === "In Transit" ? (
                    <button
                      type="button"
                      onClick={() => setSelectedOrder(order)}
                      className="w-full sm:w-36 rounded bg-graphite px-4 py-2 text-center text-[12px] font-bold text-white transition-colors hover:bg-graphite-soft"
                    >
                      Track Order
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setSelectedOrder(order)}
                      className="w-full sm:w-36 rounded bg-graphite px-4 py-2 text-center text-[12px] font-bold text-white transition-colors hover:bg-graphite-soft"
                    >
                      View Details
                    </button>
                  )}

                  {order.status === "Delivered" && (
                    <button
                      type="button"
                      onClick={() => setShowInvoiceAlert(order.orderNumber)}
                      className="inline-flex w-full sm:w-36 items-center justify-center gap-1.5 rounded border border-border bg-white px-3 py-1.5 text-[12px] font-bold text-graphite transition-colors hover:bg-surface-soft"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download Invoice
                    </button>
                  )}

                  {order.status === "Processing" && (
                    <button
                      type="button"
                      onClick={() => alert(`Cancel request received for ${order.orderNumber}. Support team notified.`)}
                      className="w-full sm:w-36 rounded border border-border bg-white px-3 py-1.5 text-center text-[12px] font-bold text-rose-600 transition-colors hover:bg-rose-50"
                    >
                      Cancel Order
                    </button>
                  )}

                  {order.status === "In Transit" && (
                    <button
                      type="button"
                      onClick={() => setSelectedOrder(order)}
                      className="w-full sm:w-36 rounded border border-border bg-white px-3 py-1.5 text-center text-[12px] font-bold text-graphite transition-colors hover:bg-surface-soft"
                    >
                      View Details
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {filteredOrders.length === 0 && (
            <div className="rounded-lg border border-border bg-white p-8 text-center text-[13px] text-text-muted">
              No orders found matching this status filter.
            </div>
          )}
        </div>
      </section>

      {/* 3. RIGHT SIDEBAR: ACCOUNT OVERVIEW & QUICK ACTIONS (3 cols) */}
      <aside className="space-y-6 lg:col-span-3">
        {/* Card 1: Account Overview */}
        <div className="rounded-lg border border-border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-[14px] font-bold text-graphite">Account Overview</h3>
            <Link
              href="/account"
              className="text-[11px] font-bold text-[#84cc16] hover:underline"
            >
              Edit Profile
            </Link>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-soft text-[14px] font-bold text-graphite border border-border">
              SM
            </div>
            <div>
              <p className="text-[13px] font-bold text-graphite">Sachin Mallick</p>
              <p className="text-[11px] text-text-muted">sachin@example.com</p>
            </div>
          </div>

          <div className="mt-4 space-y-2 border-t border-border pt-3 text-[12px]">
            <div className="flex justify-between">
              <span className="text-text-muted">Member since</span>
              <span className="font-semibold text-graphite">Aug 2024</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Phone</span>
              <span className="font-semibold text-graphite">+91 98765 43210</span>
            </div>
            <div className="pt-1">
              <div className="flex justify-between">
                <span className="text-text-muted">Default Address</span>
                <Link href="/account" className="text-[11px] font-medium text-[#84cc16] hover:underline">
                  Manage
                </Link>
              </div>
              <p className="mt-1 font-semibold text-graphite">Rourkela, Odisha, India</p>
            </div>
          </div>
        </div>

        {/* Card 2: Quick Actions */}
        <div className="rounded-lg border border-border bg-white p-5 shadow-sm">
          <h3 className="text-[14px] font-bold text-graphite">Quick Actions</h3>
          <div className="mt-3 space-y-2.5">
            <Link
              href="/support"
              className="flex items-center gap-3 rounded-md border border-border p-2.5 transition-colors hover:bg-surface-soft"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded bg-surface-soft text-graphite">
                <Search className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[12px] font-bold text-graphite">Track an Order</p>
                <p className="text-[10px] text-text-muted">Enter order ID</p>
              </div>
            </Link>

            <Link
              href="/bulk-orders/request"
              className="flex items-center gap-3 rounded-md border border-border p-2.5 transition-colors hover:bg-surface-soft"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded bg-surface-soft text-graphite">
                <Boxes className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[12px] font-bold text-graphite">Bulk Order Request</p>
                <p className="text-[10px] text-text-muted">Request quote for multiple units</p>
              </div>
            </Link>

            <Link
              href="/build"
              className="flex items-center gap-3 rounded-md border border-border p-2.5 transition-colors hover:bg-surface-soft"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded bg-surface-soft text-graphite">
                <Sliders className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[12px] font-bold text-graphite">Build New UAV</p>
                <p className="text-[10px] text-text-muted">Configure and save</p>
              </div>
            </Link>

            <Link
              href="/account"
              className="flex items-center gap-3 rounded-md border border-border p-2.5 transition-colors hover:bg-surface-soft"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded bg-surface-soft text-graphite">
                <MapPin className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[12px] font-bold text-graphite">Manage Addresses</p>
                <p className="text-[10px] text-text-muted">View and edit addresses</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Card 3: Need Help? */}
        <div className="rounded-lg border border-border bg-white p-5 shadow-sm">
          <h3 className="text-[14px] font-bold text-graphite">Need Help?</h3>
          <div className="mt-3 space-y-2.5">
            <Link
              href="/support"
              className="flex items-center gap-3 rounded-md border border-border p-2.5 transition-colors hover:bg-surface-soft"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded bg-surface-soft text-graphite">
                <RotateCcw className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[12px] font-bold text-graphite">Return or Replace</p>
                <p className="text-[10px] text-text-muted">Request a return</p>
              </div>
            </Link>

            <Link
              href="/support"
              className="flex items-center gap-3 rounded-md border border-border p-2.5 transition-colors hover:bg-surface-soft"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded bg-surface-soft text-graphite">
                <Headphones className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[12px] font-bold text-graphite">Order Support</p>
                <p className="text-[10px] text-text-muted">Get help with your order</p>
              </div>
            </Link>
          </div>
        </div>
      </aside>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-xl rounded-lg border border-border bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-[16px] font-bold text-graphite">
                  Order Details {selectedOrder.orderNumber}
                </h3>
                <p className="text-[12px] text-text-muted">Placed on {selectedOrder.date}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="text-text-muted hover:text-graphite"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-[13px]">
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-text-muted">Shipment Status:</span>
                <span className="font-bold text-graphite">{selectedOrder.status}</span>
              </div>
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-text-muted">Carrier &amp; Tracking:</span>
                <span className="font-bold text-graphite">{selectedOrder.statusDescription}</span>
              </div>
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-text-muted">Total Amount (Incl. 18% GST):</span>
                <span className="font-bold text-graphite">{formatINR(selectedOrder.total)}</span>
              </div>
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-text-muted">Delivery Address:</span>
                <span className="font-semibold text-graphite">Sector 4, Rourkela, Odisha 769004</span>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowInvoiceAlert(selectedOrder.orderNumber);
                  setSelectedOrder(null);
                }}
                className="rounded border border-border px-4 py-2 text-[12px] font-bold text-graphite hover:bg-surface-soft"
              >
                Download Invoice
              </button>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="rounded bg-graphite px-5 py-2 text-[12px] font-bold text-white hover:bg-graphite-soft"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
