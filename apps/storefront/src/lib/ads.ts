/**
 * GA4 and Meta Pixel ecommerce events. Both are off unless their id is set at build time
 * (NEXT_PUBLIC_GA4_ID, NEXT_PUBLIC_META_PIXEL_ID), so nothing loads or fires by default.
 * Money arrives in paise and goes out in rupees.
 */
type W = typeof window & { gtag?: (...a: unknown[]) => void; fbq?: (...a: unknown[]) => void };

export const GA4_ID = process.env.NEXT_PUBLIC_GA4_ID || "";
export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || "";

type Item = { item_id: string; item_name?: string; quantity?: number; price?: number };

function fire(ga: string, meta: string | null, params: Record<string, unknown>, metaParams: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  const w = window as W;
  try {
    w.gtag?.("event", ga, params);
    if (meta) w.fbq?.("track", meta, metaParams);
  } catch {
    // Ad tags never break the page.
  }
}

const rupees = (paise?: number | null) => (paise == null ? undefined : Math.round(paise) / 100);

/** Maps our own analytics events (lib/analytics.ts `track`) to the ad platforms' names. */
export function adsFromTrack(
  eventType: string,
  p: { product_id?: string | null; variant_id?: string | null; quantity?: number | null; value?: number | null; currency_code?: string | null }
) {
  const currency = (p.currency_code || "inr").toUpperCase();
  const value = rupees(p.value);
  const items: Item[] = p.product_id ? [{ item_id: p.product_id, quantity: p.quantity ?? 1, price: value }] : [];
  const meta = { content_ids: items.map((i) => i.item_id), content_type: "product", value, currency };
  if (eventType === "product_viewed") fire("view_item", "ViewContent", { currency, value, items }, meta);
  else if (eventType === "product_added_to_cart") fire("add_to_cart", "AddToCart", { currency, value, items }, meta);
  else if (eventType === "checkout_started") fire("begin_checkout", "InitiateCheckout", { currency, value }, { value, currency });
}

/** One purchase per order, even if the confirmation page is reloaded. */
export function adsPurchase(order: { id: string; total?: number; currency_code?: string; items?: { id: string; title: string; quantity: number; total: number }[] }) {
  if (typeof window === "undefined") return;
  const key = `ads_purchase_${order.id}`;
  try {
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
  } catch {
    // Without storage a reload may double count; better than losing the sale.
  }
  const currency = (order.currency_code || "inr").toUpperCase();
  const value = rupees(order.total);
  const items: Item[] = (order.items ?? []).map((i) => ({ item_id: i.id, item_name: i.title, quantity: i.quantity, price: rupees(i.total / Math.max(i.quantity, 1)) }));
  fire("purchase", "Purchase", { transaction_id: order.id, currency, value, items }, { value, currency, content_type: "product", content_ids: items.map((i) => i.item_id) });
}
