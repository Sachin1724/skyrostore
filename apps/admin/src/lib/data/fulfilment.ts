const BASE_URL = process.env.NEXT_PUBLIC_MEDUSA_URL || "http://localhost:9000";

export const FULFILMENT_STATES = [
  "awaiting_payment",
  "payment_failed",
  "paid_processing",
  "packed",
  "shipped",
  "delivered",
  "cancelled",
] as const;

export const STATE_LABELS: Record<string, string> = {
  awaiting_payment: "Awaiting payment",
  payment_failed: "Payment failed",
  paid_processing: "Paid — to pack",
  packed: "Packed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

async function adminGet<T>(token: string, path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

export type FulfilmentOrder = {
  id: string;
  display_id?: number;
  email?: string;
  created_at: string;
  total: number;
  currency_code: string;
  payment_status: string;
  fulfillment_status: string;
  fulfilment_state: string;
  item_count: number;
  is_bulk_order: boolean;
  shipping_address?: { city?: string; province?: string } | null;
};

export function getFulfilmentOrders(
  token: string,
  params: { state?: string; payment_status?: string; q?: string; limit?: number; offset?: number } = {}
) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  return adminGet<{
    orders: FulfilmentOrder[];
    count: number;
    counts_by_state: Record<string, number>;
  }>(token, `/admin/fulfilment/orders?${search.toString()}`);
}

export function getFulfilmentOrder(token: string, id: string) {
  return adminGet<{
    order: Record<string, any>;
    packing_list: Array<Record<string, any>>;
    fulfilments: Array<Record<string, any>>;
    payment_attempts: Array<Record<string, any>>;
    bulk_order_request: Record<string, any> | null;
    history: Array<{ at: string; event: string; detail?: string | null }>;
  }>(token, `/admin/fulfilment/orders/${id}`);
}

export function getAnalyticsOverview(token: string, days = 30) {
  return adminGet<{
    window_days: number;
    event_collection: { active: boolean; first_event_at: string | null; note?: string };
    fulfilment: Record<string, number>;
    payments_needing_attention: Record<string, number>;
    abandoned_carts: number;
    abandoned_after_minutes: number;
    checkout_dropoff_by_step: Record<string, number>;
    journey: Record<string, number>;
    bulk_orders: { total: number; by_status: Record<string, number>; outstanding_quotations: number };
  }>(token, `/admin/analytics/overview?days=${days}`);
}

export function getAbandonedCarts(token: string, params: { state?: string; limit?: number } = {}) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  return adminGet<{
    carts: Array<Record<string, any>>;
    count: number;
    counts_by_state: Record<string, number>;
    threshold_minutes: number;
  }>(token, `/admin/analytics/abandoned-carts?${search.toString()}`);
}

export function getPaymentAttempts(token: string, params: { status?: string; limit?: number } = {}) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  return adminGet<{
    attempts: Array<Record<string, any>>;
    count: number;
    failures_by_category: Record<string, number>;
  }>(token, `/admin/analytics/payment-attempts?${search.toString()}`);
}

export function getJourneyEvents(token: string, params: { event_type?: string; limit?: number } = {}) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  return adminGet<{ events: Array<Record<string, any>>; count: number }>(
    token,
    `/admin/analytics/events?${search.toString()}`
  );
}
