import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { parseSpec, validate } from "../../../../lib/compatibility/engine";
import type { FrameSpec, ESCSpec, MotorSpec, PropellerSpec, BatterySpec, ComponentSpec } from "../../../../lib/compatibility/types";

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { order_id, items } = req.body as {
    order_id: string;
    items: Array<{ variant_id: string; quantity: number }>;
  };

  if (!order_id || !items?.length) {
    return res.status(400).json({ error: "order_id and items required" });
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const configuratorService = req.scope.resolve("configurator") as {
    listUavConfigurationSnapshots: (filters?: Record<string, unknown>) => Promise<unknown>;
    createUavConfigurationSnapshots: (data: Record<string, unknown>) => Promise<{ id: string }>;
  };

  try {
    // Idempotency: check if snapshot already exists for this order
    const existingResult = await configuratorService.listUavConfigurationSnapshots({ order_id });
    const existing = Array.isArray(existingResult)
      ? (Array.isArray(existingResult[0]) ? existingResult[0] : existingResult)
      : existingResult ? [existingResult] : [];

    if (existing.length > 0) {
      return res.json({ snapshot_ids: existing.map((s: any) => s.id), already_exists: true });
    }

    // Fetch variant + product metadata for all items
    const variantIds = items.map((i) => i.variant_id);
    const { data: variants } = await query.graph({
      entity: "product_variant",
      fields: ["id", "sku", "product.id", "product.title", "product.metadata"],
      filters: { id: variantIds },
    });

    const variantMap = new Map((variants as any[]).map((v) => [v.id, v]));

    // Group items by UAV component type for validation
    const components: Record<string, ComponentSpec> = {};
    const snapshotItems: any[] = [];

    for (const item of items) {
      const v = variantMap.get(item.variant_id);
      if (!v) continue;

      const metadata = v.product?.metadata || {};
      const componentType = metadata.component_type as string;
      if (!componentType) continue;

      const spec = parseSpec(metadata);
      const slotKey = componentType.toLowerCase();
      if (spec) components[slotKey] = spec;

      snapshotItems.push({
        component_type: componentType,
        product_id: v.product?.id,
        product_variant_id: item.variant_id,
        product_title: v.product?.title || "",
        sku: v.sku || "",
        quantity: item.quantity,
        specs: metadata,
      });
    }

    if (snapshotItems.length === 0) {
      return res.json({ snapshot_ids: [], message: "No UAV components in order" });
    }

    // Validate the configuration
    const validationResult = validate({
      frame: components.frame as FrameSpec | undefined,
      flight_controller: components.flight_controller,
      esc: components.esc as ESCSpec | undefined,
      motor: components.motor as MotorSpec | undefined,
      propeller: components.propeller as PropellerSpec | undefined,
      battery: components.battery as BatterySpec | undefined,
      gps: components.gps,
    });

    // Create with retry: if unique constraint fails, re-query
    let lastErr: any;
    for (let attempt = 0; attempt < 2; attempt++) {
      if (attempt > 0) {
        // Re-check after failed create (race loser)
        const retryResult = await configuratorService.listUavConfigurationSnapshots({ order_id }).catch(() => null);
        const retryExisting = Array.isArray(retryResult)
          ? (Array.isArray(retryResult[0]) ? retryResult[0] : retryResult)
          : retryResult ? [retryResult] : [];
        if (retryExisting.length > 0) {
          return res.json({ snapshot_ids: retryExisting.map((s: any) => s.id), already_exists: true });
        }
      }
      try {
        const snapshot = await configuratorService.createUavConfigurationSnapshots({
          configuration_id: `order_${order_id}`,
          customer_id: (req as any).auth_context?.actor_id || "anonymous",
          order_id,
          snapshot_data: {
            order_id,
            items: snapshotItems,
            validation: validationResult,
            captured_at: new Date().toISOString(),
          },
        });
        return res.json({ snapshot_ids: [snapshot.id], validation: validationResult });
      } catch (createErr: any) {
        lastErr = createErr;
      }
    }
    throw lastErr;
  } catch (err) {
    console.error("Order snapshot error:", err);
    return res.status(500).json({ error: "Failed to create order snapshot" });
  }
}
