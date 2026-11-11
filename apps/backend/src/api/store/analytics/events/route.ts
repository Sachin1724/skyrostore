import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import {
  CLIENT_EVENT_TYPES,
  MAX_EVENTS_PER_BATCH,
  normaliseEvent,
} from "../../../../lib/analytics";
import { bufferEvents } from "../../../../lib/analytics-buffer";

/**
 * Collector for browser events. Accepts a single event or a small batch
 * (sendBeacon friendly). Writes are idempotent on `event_key`.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = req.body as any;
  const incoming: unknown[] = Array.isArray(body?.events) ? body.events : [body];

  if (!incoming.length) {
    return res.status(400).json({ error: "No events supplied" });
  }
  if (incoming.length > MAX_EVENTS_PER_BATCH) {
    return res.status(400).json({ error: `At most ${MAX_EVENTS_PER_BATCH} events per request` });
  }

  const customerId = (req as any).auth_context?.actor_id || null;
  const rows: Record<string, unknown>[] = [];
  const rejected: string[] = [];

  for (const raw of incoming) {
    const result = normaliseEvent(raw, CLIENT_EVENT_TYPES);
    if ("error" in result) {
      rejected.push(result.error);
      continue;
    }
    rows.push({
      id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      ...result.event,
      // The session owner is taken from auth, never from the payload.
      customer_id: customerId,
      metadata: result.event.metadata ? JSON.stringify(result.event.metadata) : null,
      created_at: new Date(),
      updated_at: new Date(),
    });
  }

  if (!rows.length) {
    return res.status(400).json({ error: "No valid events", details: rejected });
  }

  try {
    const db = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION) as any;
    // Queued, not written: the response does not wait on the database, and a
    // burst of beacons becomes a few batched inserts instead of hundreds.
    const { queued, dropped } = bufferEvents(db, rows);
    return res.status(202).json({ accepted: queued, rejected: rejected.length, dropped });
  } catch (err: unknown) {
    // Collection must never break the customer journey.
    console.error("analytics event write failed:", err instanceof Error ? err.message : err);
    return res.status(202).json({ accepted: 0, rejected: rejected.length });
  }
}
