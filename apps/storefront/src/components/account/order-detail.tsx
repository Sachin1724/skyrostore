"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";

type OrderItem = {
  id: string;
  title: string;
  quantity: number;
  unit_price: number;
  total: number;
};

type Order = {
  id: string;
  display_id: number;
  status: string;
  total: number;
  subtotal: number;
  shipping_total: number;
  currency_code: string;
  email: string;
  created_at: string;
  items: OrderItem[];
  shipping_address?: {
    first_name: string;
    last_name: string;
    address_1: string;
    city: string;
    province: string;
    postal_code: string;
    country_code: string;
  };
};

export function OrderDetail({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/account/orders/${orderId}`)
      .then((r) => {
        if (r.status === 401) {
          setError("Sign in to view this order.");
          return null;
        }
        if (r.status === 404) {
          setError("Order not found.");
          return null;
        }
        if (!r.ok) throw new Error("Failed");
        return r.json();
      })
      .then((data) => {
        if (data?.order) setOrder(data.order);
      })
      .catch(() => setError("Unable to load order."))
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) return <p className="text-[13px] text-text-muted">Loading...</p>;

  if (error) {
    return (
      <div>
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

  if (!order) return <p className="text-[14px] text-text-secondary">Order not found.</p>;

  const currency = order.currency_code || "inr";

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-[28px] font-bold tracking-[-0.025em] text-graphite">
          Order #{order.display_id}
        </h1>
        <span
          className="text-[12px] font-medium text-text-secondary"
          style={{
            borderRadius: "var(--radius-sm)",
            background: "var(--color-surface-soft)",
            padding: "4px 12px",
          }}
        >
          {order.status}
        </span>
      </div>

      <p className="mt-1 text-[13px] text-text-muted">
        Placed{" "}
        {new Date(order.created_at).toLocaleDateString("en-IN", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </p>

      {/* Items */}
      <div className="mt-6">
        <h2 className="text-[14px] font-semibold text-graphite">Items</h2>
        <div className="mt-2" style={{ borderTop: "1px solid var(--color-border)" }}>
          {order.items.map((item) => (
            <div
              key={item.id}
              className="flex justify-between py-3 text-[13px]"
              style={{ borderBottom: "1px solid var(--color-border)" }}
            >
              <div>
                <p className="font-medium text-graphite">{item.title?.replace("[DEV] ", "")}</p>
                <p className="text-[11px] text-text-muted">Qty: {item.quantity}</p>
              </div>
              <p className="font-medium text-graphite">
                {formatPrice(item.total, currency)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Totals */}
      <div className="mt-4 pt-4 text-[13px]" style={{ borderTop: "1px solid var(--color-border)" }}>
        <div className="flex justify-between">
          <span className="text-text-muted">Subtotal</span>
          <span className="text-graphite">{formatPrice(order.subtotal, currency)}</span>
        </div>
        <div className="mt-1 flex justify-between">
          <span className="text-text-muted">Shipping</span>
          <span className="text-graphite">{formatPrice(order.shipping_total || 0, currency)}</span>
        </div>
        <div className="mt-3 flex justify-between pt-3" style={{ borderTop: "1px solid var(--color-border)" }}>
          <span className="text-[14px] font-medium text-graphite">Total</span>
          <span className="text-[20px] font-bold text-graphite">{formatPrice(order.total, currency)}</span>
        </div>
      </div>

      {/* Shipping address */}
      {order.shipping_address && (
        <div className="mt-6 pt-4" style={{ borderTop: "1px solid var(--color-border)" }}>
          <h2 className="text-[14px] font-semibold text-graphite">
            Shipping Address
          </h2>
          <p className="mt-1 text-[13px] text-text-secondary">
            {order.shipping_address.first_name}{" "}
            {order.shipping_address.last_name}
            <br />
            {order.shipping_address.address_1}
            <br />
            {order.shipping_address.city}, {order.shipping_address.province}{" "}
            {order.shipping_address.postal_code}
            <br />
            {order.shipping_address.country_code?.toUpperCase()}
          </p>
        </div>
      )}

      <div className="mt-6">
        <Link
          href="/account/orders"
          className="text-[13px] font-medium text-text-secondary hover:text-graphite"
        >
          Back to all orders
        </Link>
      </div>
    </div>
  );
}
