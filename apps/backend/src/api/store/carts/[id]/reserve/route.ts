import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { reserveCartForCheckout } from "../../../../../lib/inventory-hold";

/** Call before opening the payment gateway — see lib/inventory-hold.ts. */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params;
  const result = await reserveCartForCheckout(req.scope, id);
  if (!result.ok) return res.status(409).json({ error: result.error });
  return res.json({ ok: true });
}
