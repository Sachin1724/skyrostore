import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { safeErrorCategory } from "../../../../lib/analytics";

/**
 * Records a payment attempt for failure investigation.
 *
 * The caller cannot declare a payment successful: amount, currency, provider and
 * outcome are read from the payment session row owned by the payment module. A
 * caller-supplied outcome can only ever downgrade the record to "failed".
 */
const SUCCESS_STATES = ["authorized", "captured"];

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = (req.body || {}) as Record<string, any>;
  const cartId = typeof body.cart_id === "string" ? body.cart_id : null;
  const sessionId = typeof body.payment_session_id === "string" ? body.payment_session_id : null;

  if (!cartId && !sessionId) {
    return res.status(400).json({ error: "cart_id or payment_session_id is required" });
  }

  try {
    const db = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION) as any;

    const session = sessionId
      ? await db("payment_session").where({ id: sessionId }).first().catch(() => null)
      : null;

    let status = "attempted";
    if (session?.status && SUCCESS_STATES.includes(session.status)) {
      status = "succeeded";
    } else if (body.outcome === "failed" || session?.status === "error") {
      status = "failed";
    } else if (body.outcome === "pending") {
      status = "pending";
    }

    const errorCategory =
      status === "failed" ? safeErrorCategory(body.error_message || session?.status) : null;

    const providerReference =
      typeof body.provider_reference === "string" ? body.provider_reference.slice(0, 255) : null;

    // Idempotent per (cart, session, provider reference): re-posting the same
    // attempt updates its outcome instead of inflating the failure count.
    const existing = await db("payment_attempt")
      .where({ cart_id: cartId })
      .modify((qb: any) => {
        if (sessionId) qb.andWhere({ payment_session_id: sessionId });
        if (providerReference) qb.andWhere({ provider_reference: providerReference });
      })
      .orderBy("attempted_at", "desc")
      .first()
      .catch(() => null);

    const resolvedAt = status === "attempted" || status === "pending" ? null : new Date();

    if (existing) {
      await db("payment_attempt")
        .where({ id: existing.id })
        .update({
          status,
          error_category: errorCategory,
          provider_reference: providerReference || existing.provider_reference,
          order_id: body.order_id || existing.order_id || null,
          resolved_at: resolvedAt,
          updated_at: new Date(),
        });
      return res.status(202).json({ attempt_id: existing.id, status, updated: true });
    }

    const priorCount = cartId
      ? Number((await db("payment_attempt").where({ cart_id: cartId }).count("id as c").first())?.c || 0)
      : 0;

    const id = `pat_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await db("payment_attempt").insert({
      id,
      cart_id: cartId,
      order_id: body.order_id || null,
      session_id: typeof body.session_id === "string" ? body.session_id : null,
      visitor_id: typeof body.visitor_id === "string" ? body.visitor_id : null,
      provider_id: session?.provider_id || body.provider_id || "unknown",
      provider_reference: providerReference,
      payment_session_id: sessionId,
      amount: session?.amount ?? null,
      currency_code: session?.currency_code ?? null,
      status,
      error_category: errorCategory,
      attempt_no: priorCount + 1,
      is_retry: priorCount > 0,
      attempted_at: new Date(),
      resolved_at: resolvedAt,
      created_at: new Date(),
      updated_at: new Date(),
    });

    return res.status(202).json({ attempt_id: id, status, attempt_no: priorCount + 1 });
  } catch (err: unknown) {
    console.error("payment attempt write failed:", err instanceof Error ? err.message : err);
    return res.status(202).json({ recorded: false });
  }
}
