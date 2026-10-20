import { model } from "@medusajs/framework/utils";

/**
 * Observability record for a payment attempt. NOT a source of payment truth —
 * the payment module owns that. `status` here is only ever written from a
 * server-verified payment session status or a signed provider webhook.
 */
export const PaymentAttempt = model.define("payment_attempt", {
  id: model.id().primaryKey(),
  cart_id: model.text().nullable(),
  order_id: model.text().nullable(),
  session_id: model.text().nullable(),
  visitor_id: model.text().nullable(),
  provider_id: model.text(),
  provider_reference: model.text().nullable(),
  payment_session_id: model.text().nullable(),
  amount: model.number().nullable(),
  currency_code: model.text().nullable(),
  status: model.text(),
  error_category: model.text().nullable(),
  attempt_no: model.number(),
  is_retry: model.boolean(),
  webhook_outcome: model.text().nullable(),
  attempted_at: model.dateTime(),
  resolved_at: model.dateTime().nullable(),
});
