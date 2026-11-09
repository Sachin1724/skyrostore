import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

// Business settings the admin edits (store metadata, same mechanism as site-content).
// Payment keys are never stored here — they stay in backend env vars.
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const { data } = await query.graph({ entity: "store", fields: ["metadata"] });
  const settings = (data[0]?.metadata as Record<string, unknown> | null)?.site_settings as
    | { gstin?: string; freeShippingThreshold?: number }
    | undefined;
  res.json({
    gstin: settings?.gstin || null,
    freeShippingThreshold: typeof settings?.freeShippingThreshold === "number" ? settings.freeShippingThreshold : null,
  });
}
