import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { serviceability } from "../../../lib/shipmozo";

/** Product page PIN check: { serviceable: true | false | null }, null meaning the courier API could not say. */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const pin = String(req.query.pin ?? "").trim();
  if (!/^\d{6}$/.test(pin)) return res.status(400).json({ message: "Enter a 6-digit PIN code" });
  res.json({ serviceable: await serviceability(pin) });
}
