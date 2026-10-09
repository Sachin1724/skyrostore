import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { parseSpec, validate } from "../../../../../lib/compatibility/engine";
import type { ValidateRequest, ComponentSpec, FrameSpec, ESCSpec, MotorSpec, PropellerSpec, BatterySpec } from "../../../../../lib/compatibility/types";

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = req.body as ValidateRequest;
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  const variantIds: string[] = [];
  const slotMap: Record<string, string> = {};

  const slots = [
    ["frame", body.frame_variant_id],
    ["flight_controller", body.flight_controller_variant_id],
    ["esc", body.esc_variant_id],
    ["motor", body.motor_variant_id],
    ["propeller", body.propeller_variant_id],
    ["battery", body.battery_variant_id],
    ["gps", body.gps_variant_id],
  ] as const;

  for (const [slot, vid] of slots) {
    if (vid) {
      variantIds.push(vid);
      slotMap[vid] = slot;
    }
  }

  if (variantIds.length === 0) {
    return res.status(400).json({ error: "No components provided" });
  }

  let variants: Array<{
    id: string;
    product: { metadata: Record<string, unknown> };
    calculated_price?: { calculated_amount: number; currency_code: string };
  }>;

  try {
    const { data } = await query.graph({
      entity: "product_variant",
      fields: ["id", "product.metadata", "product.weight"],
      filters: { id: variantIds },
    });
    variants = data as typeof variants;
  } catch {
    return res.status(500).json({ error: "Failed to fetch product data" });
  }

  const foundIds = new Set(variants.map((v) => v.id));
  const missing = variantIds.filter((id) => !foundIds.has(id));
  if (missing.length > 0) {
    return res.status(400).json({
      error: "Products not found",
      missing_variant_ids: missing,
    });
  }

  const components: Record<string, ComponentSpec> = {};
  const prices: Record<string, number> = {};

  for (const v of variants) {
    const slot = slotMap[v.id];
    const metadata = v.product?.metadata as Record<string, unknown> | null;
    if (!metadata) {
      return res.status(400).json({
        error: `Product for variant ${v.id} has no metadata`,
      });
    }

    const spec = parseSpec(metadata);
    if (!spec) {
      return res.status(400).json({
        error: `Product for variant ${v.id} is not a UAV component (missing component_type in metadata)`,
      });
    }

    components[slot] = spec;

    if (v.calculated_price) {
      prices[slot] = v.calculated_price.calculated_amount;
    }
  }

  const result = validate({
    frame: components.frame as FrameSpec | undefined,
    flight_controller: components.flight_controller,
    esc: components.esc as ESCSpec | undefined,
    motor: components.motor as MotorSpec | undefined,
    propeller: components.propeller as PropellerSpec | undefined,
    battery: components.battery as BatterySpec | undefined,
    gps: components.gps,
    payload_grams: body.payload_grams ?? 0,
    prices: Object.keys(prices).length > 0 ? prices : undefined,
  });

  res.json(result);
}
