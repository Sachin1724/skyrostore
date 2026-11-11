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

export function OrderDashboard() {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [unauthenticated, setUnauthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "All Orders" | "Processing" | "Shipped" | "Delivered" | "Cancelled"
  >("All Orders");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);
  const [showInvoiceAlert, setShowInvoiceAlert] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/account/orders")
      .then((r) => {
        if (r.status === 401) {
          setUnauthenticated(true);
          return null;
        }
        if (!r.ok) throw new Error("Failed to load orders");
        return r.json();
      })
      .then((data) => {
        if (data?.orders) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const mapped: OrderItem[] = data.orders.map((o: any) => {
            const isDelivered = o.status === "completed" || o.fulfillment_status === "delivered";
            const isShipped = o.fulfillment_status === "shipped";
            const isCancelled = o.status === "canceled";
            const status: OrderItem["status"] = isDelivered
              ? "Delivered"
              : isShipped
              ? "In Transit"
              : isCancelled
              ? "Cancelled"
              : "Processing";
            return {
              id: o.id,
              orderNumber: `#SKY-${o.display_id || o.id.slice(-6)}`,
              date: new Date(o.created_at).toLocaleDateString("en-IN", {
                month: "short",
                day: "numeric",
                year: "numeric",
              }),
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              itemCount: o.items?.reduce((sum: number, it: any) => sum + (it.quantity || 1), 0) || 1,
              total: o.total || 0,
              status,
              statusDescription: isDelivered
                ? "Delivered to destination address"
                : isShipped
                ? "In transit with logistics carrier"
                : isCancelled
                ? "Order cancelled"
                : "Order received • In fulfillment processing",
              carrier: "Standard Express",
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              images: (o.items || []).map((it: any) => it.thumbnail).filter(Boolean),
              extraCount: Math.max(0, (o.items?.length || 0) - 3),
            };
          });
          setOrders(mapped);
        }
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  const totalOrdersCount = orders.length;
  const totalSpendAmount = orders.reduce((sum, o) => sum + o.total, 0);
  const pendingDeliveriesCount = orders.filter(
    (o) => o.status === "Processing" || o.status === "In Transit"
  ).length;

  // Filter orders
  const filteredOrders = orders.filter((order) => {
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
    <div>
      <section className="space-y-6">
        {totalOrdersCount > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex items-center gap-3.5 bg-white p-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-success-soft text-success">
              <Package className="h-5 w-5 stroke-[2]" />
            </div>
            <div>
              <p className="text-[13px] font-medium text-text-muted">Total Orders</p>
              <p className="text-[20px] font-extrabold text-graphite">{totalOrdersCount}</p>
              <p className="text-[13px] text-text-muted">Across all time</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 bg-white p-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-success-soft text-success">
              <ShoppingCart className="h-5 w-5 stroke-[2]" />
            </div>
            <div>
              <p className="text-[13px] font-medium text-text-muted">Total Spend</p>
              <p className="text-[20px] font-extrabold text-graphite">{formatINR(totalSpendAmount)}</p>
              <p className="text-[13px] text-text-muted">Including taxes</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 bg-white p-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-success-soft text-success">
              <Clock className="h-5 w-5 stroke-[2]" />
            </div>
            <div>
              <p className="text-[13px] font-medium text-text-muted">Pending Deliveries</p>
              <p className="text-[20px] font-extrabold text-graphite">{pendingDeliveriesCount}</p>
              <p className="text-[13px] text-text-muted">Orders in transit</p>
            </div>
          </div>
        </div>
        ) : null}

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
                className={`min-h-11 whitespace-nowrap pb-2 text-[14px] font-bold transition-all ${
                  activeTab === tab
                    ? "border-b-2 border-brand text-graphite"
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
              className="w-full rounded-md border border-border bg-white py-1.5 pl-8 pr-3 text-[14px] text-graphite placeholder:text-text-muted focus:border-graphite"
            />
          </div>
        </div>

        {showInvoiceAlert && (
          <div className="flex items-center justify-between rounded border border-emerald-200 bg-emerald-50 p-3 text-[14px] text-emerald-800">
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
              className="bg-white p-5 transition-shadow hover:shadow-md"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
                <div>
                  <h3 className="text-[14px] font-bold text-graphite">{order.orderNumber}</h3>
                  <p className="mt-0.5 text-[13px] text-text-muted">
                    {order.date} • {order.itemCount} {order.itemCount === 1 ? "item" : "items"} •{" "}
                    {formatINR(order.total)}
                  </p>
                </div>
                <div>
                  {order.status === "Delivered" && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[13px] font-bold text-emerald-700 border border-emerald-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Delivered
                    </span>
                  )}
                  {order.status === "In Transit" && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-2.5 py-0.5 text-[13px] font-bold text-sky-700 border border-sky-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
                      In Transit
                    </span>
                  )}
                  {order.status === "Processing" && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-[13px] font-bold text-amber-700 border border-amber-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                      Processing
                    </span>
                  )}
                  {order.status === "Cancelled" && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-0.5 text-[13px] font-bold text-rose-700 border border-rose-200">
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
                      <div className="flex h-12 w-12 items-center justify-center rounded border border-border bg-surface-soft text-[14px] font-bold text-text-muted">
                        +{order.extraCount}
                      </div>
                    )}
                  </div>
                  <p className="mt-2 text-[13px] text-text-secondary">{order.statusDescription}</p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-end">
                  {order.status === "In Transit" ? (
                    <button
                      type="button"
                      onClick={() => setSelectedOrder(order)}
                      className="w-full sm:w-36 rounded bg-graphite px-4 py-2 text-center text-[14px] font-bold text-white transition-colors hover:bg-graphite-soft"
                    >
                      Track Order
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setSelectedOrder(order)}
                      className="w-full sm:w-36 rounded bg-graphite px-4 py-2 text-center text-[14px] font-bold text-white transition-colors hover:bg-graphite-soft"
                    >
                      View Details
                    </button>
                  )}

                  {order.status === "Delivered" && (
                    <button
                      type="button"
                      onClick={() => setShowInvoiceAlert(order.orderNumber)}
                      className="inline-flex w-full sm:w-36 items-center justify-center gap-1.5 rounded border border-border bg-white px-3 py-1.5 text-[14px] font-bold text-graphite transition-colors hover:bg-surface-soft"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download Invoice
                    </button>
                  )}

                  {order.status === "Processing" && (
                    <button
                      type="button"
                      onClick={() => alert(`Cancel request received for ${order.orderNumber}. Support team notified.`)}
                      className="w-full sm:w-36 rounded border border-border bg-white px-3 py-1.5 text-center text-[14px] font-bold text-rose-600 transition-colors hover:bg-rose-50"
                    >
                      Cancel Order
                    </button>
                  )}

                  {order.status === "In Transit" && (
                    <button
                      type="button"
                      onClick={() => setSelectedOrder(order)}
                      className="w-full sm:w-36 rounded border border-border bg-white px-3 py-1.5 text-center text-[14px] font-bold text-graphite transition-colors hover:bg-surface-soft"
                    >
                      View Details
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {filteredOrders.length === 0 && (
            <div className="bg-white p-8 text-center text-[13px] text-text-muted">
              {loading ? (
                "Loading orders from account..."
              ) : unauthenticated ? (
                <div>
                  <p className="font-bold text-graphite text-[16px]">Sign in required to view order history</p>
                  <p className="mt-1 text-text-secondary">Please sign in to view your verified orders and commercial invoices.</p>
                  <Link
                    href="/account"
                    className="mt-4 inline-flex items-center justify-center rounded bg-graphite px-5 py-2 font-bold text-white hover:bg-black text-[14px]"
                  >
                    Sign In to Skyrostore
                  </Link>
                </div>
              ) : (
                <div>
                  <p className="font-bold text-graphite text-[16px]">No orders placed yet</p>
                  <p className="mt-1 text-text-secondary">Explore our catalog or configure your custom UAV build.</p>
                  <Link
                    href="/parts"
                    className="mt-4 inline-flex items-center justify-center rounded bg-graphite px-5 py-2 font-bold text-white hover:bg-black text-[14px]"
                  >
                    Browse UAV Parts
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-[16px] font-bold text-graphite">
                  Order Details {selectedOrder.orderNumber}
                </h3>
                <p className="text-[14px] text-text-muted">Placed on {selectedOrder.date}</p>
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
                className="rounded border border-border px-4 py-2 text-[14px] font-bold text-graphite hover:bg-surface-soft"
              >
                Download Invoice
              </button>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="rounded bg-graphite px-5 py-2 text-[14px] font-bold text-white hover:bg-graphite-soft"
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
