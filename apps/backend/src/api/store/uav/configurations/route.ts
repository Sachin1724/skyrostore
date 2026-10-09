import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { parseSpec, validate } from "../../../../lib/compatibility/engine";
import type { ValidateRequest, FrameSpec, ESCSpec, MotorSpec, PropellerSpec, BatterySpec, ComponentSpec } from "../../../../lib/compatibility/types";

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const customerId = (req as any).auth_context?.actor_id;
  if (!customerId) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const body = req.body as ValidateRequest & { name?: string };
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const configuratorService = req.scope.resolve("configurator") as {
    createUavConfigurations: (data: Record<string, unknown>) => Promise<{ id: string }>;
    createUavConfigurationItems: (data: Record<string, unknown>) => Promise<unknown>;
  };

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

  const { data: variants } = await query.graph({
    entity: "product_variant",
    fields: ["id", "product.metadata", "product.weight"],
    filters: { id: variantIds },
  });

  const foundIds = new Set((variants as { id: string }[]).map((v) => v.id));
  const missing = variantIds.filter((id) => !foundIds.has(id));
  if (missing.length > 0) {
    return res.status(400).json({
      error: "Products not found",
      missing_variant_ids: missing,
    });
  }

  const components: Record<string, ComponentSpec> = {};
  for (const v of variants as Array<{ id: string; product: { metadata: Record<string, unknown> } }>) {
    const slot = slotMap[v.id];
    const metadata = v.product?.metadata;
    if (!metadata) {
      return res.status(400).json({ error: `No metadata for variant ${v.id}` });
    }
    const spec = parseSpec(metadata);
    if (!spec) {
      return res.status(400).json({ error: `Not a UAV component: variant ${v.id}` });
    }
    components[slot] = spec;
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
  });

  if (!result.valid) {
    return res.status(400).json({
      error: "Configuration is invalid",
      ...result,
    });
  }

  const config = await configuratorService.createUavConfigurations({
    customer_id: customerId,
    name: body.name || "UAV Configuration",
    status: "VALID",
    estimated_weight_g: result.estimates.weight_g,
    estimated_flight_time_min: result.estimates.flight_time_min,
    estimated_payload_g: result.estimates.payload_capacity_g,
  });

  for (const [slot, vid] of slots) {
    if (vid) {
      const motorCount = (components.frame as FrameSpec | undefined)?.motor_count ?? 4;
      const quantity = slot === "motor" ? motorCount : slot === "propeller" ? Math.ceil(motorCount / 2) : 1;
      await configuratorService.createUavConfigurationItems({
        configuration_id: config.id,
        product_variant_id: vid,
        component_type: slot.toUpperCase(),
        quantity,
      });
    }
  }

  res.json({ configuration_id: config.id, ...result });
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const customerId = (req as any).auth_context?.actor_id;
  if (!customerId) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const configuratorService = req.scope.resolve("configurator") as {
    listUavConfigurations: (filters?: Record<string, unknown>, config?: Record<string, unknown>) => Promise<unknown>;
  };

  const result = await configuratorService.listUavConfigurations(
    { customer_id: customerId },
    { order: { created_at: "DESC" }, take: 50 }
  );

  const configs = Array.isArray(result)
    ? (Array.isArray(result[0]) ? result[0] : result)
    : result ? [result] : [];
  const count = Array.isArray(result) && typeof result[1] === "number" ? result[1] : (configs as unknown[]).length;

  res.json({ configurations: configs, count });
}
