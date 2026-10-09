"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";

type Order = {
  id: string;
  display_id: number;
  status: string;
  total: number;
  currency_code: string;
  created_at: string;
  items: { id: string; title: string; quantity: number; total: number }[];
};

export function OrderList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/account/orders")
      .then((r) => {
        if (r.status === 401) {
          setError("Sign in to view your orders.");
          return null;
        }
        if (!r.ok) throw new Error("Failed");
        return r.json();
      })
      .then((data) => {
        if (data) setOrders(data.orders || []);
      })
      .catch(() => setError("Unable to load orders."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="mt-6 text-[13px] text-text-muted">Loading...</p>;

  if (error) {
    return (
      <div className="mt-6">
        <p className="text-[14px] text-text-secondary">{error}</p>
        <Link
          href="/account"
          className="mt-2 inline-block text-[13px] font-medium text-graphite hover:underline"
        >
          Sign in
        </Link>
      </div>
    );
  }

  if (orders.length === 0) {
    return <p className="mt-6 text-[14px] text-text-secondary">No orders yet.</p>;
  }

  return (
    <div className="mt-6">
      {orders.map((order) => (
        <Link
          key={order.id}
          href={`/account/orders/${order.id}`}
          className="block py-4 transition-colors hover:bg-surface-soft"
          style={{ borderBottom: "1px solid var(--color-border)" }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[14px] font-medium text-graphite">
                Order #{order.display_id}
              </p>
              <p className="text-[11px] text-text-muted">
                {new Date(order.created_at).toLocaleDateString("en-IN", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[14px] font-semibold text-graphite">
                {formatPrice(order.total, order.currency_code)}
              </p>
              <span
                className="text-[11px] font-medium text-text-secondary"
                style={{
                  borderRadius: "var(--radius-sm)",
                  background: "var(--color-surface-soft)",
                  padding: "2px 8px",
                }}
              >
                {order.status}
              </span>
            </div>
          </div>
          {order.items?.length > 0 && (
            <p className="mt-1 text-[11px] text-text-muted">
              {order.items.map((i) => `${i.title?.replace("[DEV] ", "")} x${i.quantity}`).join(", ")}
            </p>
          )}
        </Link>
      ))}
    </div>
  );
}
