import { model } from "@medusajs/framework/utils";

/**
 * First-party customer-journey event. Append-only.
 * `event_key` is the client-supplied idempotency key (unique) so retried
 * beacons do not double-count.
 */
export const AnalyticsEvent = model.define("analytics_event", {
  id: model.id().primaryKey(),
  event_key: model.text().unique(),
  event_type: model.text(),
  occurred_at: model.dateTime(),
  session_id: model.text(),
  visitor_id: model.text().nullable(),
  customer_id: model.text().nullable(),
  cart_id: model.text().nullable(),
  order_id: model.text().nullable(),
  product_id: model.text().nullable(),
  variant_id: model.text().nullable(),
  line_item_id: model.text().nullable(),
  quantity: model.number().nullable(),
  search_query: model.text().nullable(),
  checkout_step: model.text().nullable(),
  page_path: model.text().nullable(),
  referrer: model.text().nullable(),
  utm_source: model.text().nullable(),
  utm_medium: model.text().nullable(),
  utm_campaign: model.text().nullable(),
  utm_term: model.text().nullable(),
  utm_content: model.text().nullable(),
  value: model.number().nullable(),
  currency_code: model.text().nullable(),
  source: model.text().nullable(),
  metadata: model.json().nullable(),
});
