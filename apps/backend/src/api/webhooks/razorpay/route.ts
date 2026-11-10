import crypto from "crypto";
import * as Sentry from "@sentry/node";
import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { recordEvent, safeErrorCategory } from "../../../lib/analytics";
import { confirmRazorpayCart, razorpay } from "../../../lib/razorpay-checkout";

const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || "";

function verifyWebhookSignature(body: string, signature: string, secret: string): boolean {
  if (!secret || !signature) return false;
  try {
    const expectedBuf = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest();
    const sigBuf = Buffer.from(signature, "hex");
    if (expectedBuf.length !== sigBuf.length) return false;
    return crypto.timingSafeEqual(expectedBuf, sigBuf);
  } catch {
    return false;
  }
}


/**
 * Reconciles the observability record for a payment attempt against the signed
 * webhook. Payment truth stays with the payment module; this only annotates the
 * attempt row and writes the matching analytics event.
 */
async function reconcilePaymentAttempt(
  db: any,
  payment: any,
  outcome: "succeeded" | "failed",
  eventType: "payment_succeeded" | "payment_failed"
) {
  const reference = payment?.order_id || payment?.id;
  if (!reference) return;

  const attempt = await db("payment_attempt")
    .where({ provider_reference: reference })
    .orWhere({ provider_reference: payment?.id })
    .orderBy("attempted_at", "desc")
    .first()
    .catch(() => null);

  const errorCategory =
    outcome === "failed"
      ? safeErrorCategory(payment?.error_description || payment?.error_reason || payment?.error_code)
      : null;

  if (attempt) {
    await db("payment_attempt")
      .where({ id: attempt.id })
      .update({
        status: outcome,
        error_category: errorCategory,
        webhook_outcome: outcome === "succeeded" ? "captured" : "failed",
        resolved_at: new Date(),
        updated_at: new Date(),
      })
      .catch(() => null);
  }

  await recordEvent(db, {
    event_type: eventType,
    event_key: `rzp:${eventType}:${payment?.id || reference}`,
    session_id: attempt?.session_id || `webhook:${reference}`,
    visitor_id: attempt?.visitor_id || null,
    cart_id: attempt?.cart_id || payment?.notes?.cart_id || null,
    order_id: attempt?.order_id || null,
    value: typeof payment?.amount === "number" ? payment.amount : null,
    currency_code: payment?.currency || attempt?.currency_code || null,
    checkout_step: "payment",
    source: "razorpay_webhook",
    metadata: { provider_reference: reference, error_category: errorCategory },
  });
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const signature = req.headers["x-razorpay-signature"] as string;
  const rawBody = (req as any).rawBody as Buffer | undefined;

  if (!rawBody) {
    return res.status(400).json({ error: "Missing request body" });
  }

  if (!verifyWebhookSignature(rawBody.toString("utf-8"), signature, WEBHOOK_SECRET)) {
    return res.status(401).json({ error: "Invalid webhook signature" });
  }

  const event = req.body as {
    event: string;
    payload: {
      payment?: { entity: any };
      refund?: { entity: any };
      order?: { entity: any };
    };
  };

  const db = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION) as any;

  // Ensure webhook log table exists
  await db.raw(`CREATE TABLE IF NOT EXISTS "razorpay_webhook_log" (
    "id" text NOT NULL PRIMARY KEY,
    "event_id" text NOT NULL UNIQUE,
    "event_type" text NOT NULL,
    "payload" jsonb NOT NULL,
    "processed" boolean NOT NULL DEFAULT false,
    "processed_at" timestamptz NULL,
    "created_at" timestamptz NOT NULL DEFAULT now()
  )`).catch(() => {});

  // Idempotency: check if we've processed this event
  const eventId = (req.body as any)?.event_id || `${event.event}_${Date.now()}`;
  const existing = await db("razorpay_webhook_log")
    .where({ event_id: eventId })
    .first()
    .catch(() => null);

  // A failed attempt stays unprocessed so Razorpay's retry runs it again.
  if (existing?.processed) {
    return res.json({ ok: true, message: "Already processed" });
  }

  // Log the webhook event
  await db("razorpay_webhook_log").insert({
    id: `wh_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    event_id: eventId,
    event_type: event.event,
    payload: JSON.stringify(req.body),
    processed: false,
    created_at: new Date(),
  }).catch(() => {});

  try {
    switch (event.event) {
      case "payment.captured": {
        const payment = event.payload?.payment?.entity;
        if (payment) {
          await reconcilePaymentAttempt(db, payment, "succeeded", "payment_succeeded");
          // Customer closed the tab after paying: the order is still created.
          // Throws (→ 500, Razorpay retries) only if confirmation genuinely fails.
          const cartId =
            payment.notes?.cart_id ||
            (payment.order_id ? ((await razorpay().orders.fetch(payment.order_id)) as any).notes?.cart_id : null);
          if (cartId && payment.order_id) {
            await confirmRazorpayCart(req.scope, {
              cart_id: cartId,
              razorpay_order_id: payment.order_id,
              razorpay_payment_id: payment.id,
            });
          }
          // Mark webhook as processed
          await db("razorpay_webhook_log")
            .where({ event_id: eventId })
            .update({ processed: true, processed_at: new Date() })
            .catch(() => {});
        }
        break;
      }

      case "payment.failed": {
        const payment = event.payload?.payment?.entity;
        if (payment) {
          await reconcilePaymentAttempt(db, payment, "failed", "payment_failed");
          await db("razorpay_webhook_log")
            .where({ event_id: eventId })
            .update({ processed: true, processed_at: new Date() })
            .catch(() => {});
        }
        break;
      }

      case "refund.created":
      case "refund.processed": {
        await db("razorpay_webhook_log")
          .where({ event_id: eventId })
          .update({ processed: true, processed_at: new Date() })
          .catch(() => {});
        break;
      }

      default:
        break;
    }

    return res.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Razorpay webhook error:", msg);
    Sentry.captureException(err);
    return res.status(500).json({ error: msg });
  }
}
