import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { parseSpec, validate } from "../../../../../../lib/compatibility/engine";
import type { FrameSpec, ESCSpec, MotorSpec, PropellerSpec, BatterySpec, ComponentSpec } from "../../../../../../lib/compatibility/types";

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const customerId = (req as any).auth_context?.actor_id;
  if (!customerId) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const configId = req.params.id;
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const configuratorService = req.scope.resolve("configurator") as {
    retrieveUavConfiguration: (id: string) => Promise<Record<string, unknown> | null>;
    listUavConfigurationItems: (filters?: Record<string, unknown>) => Promise<unknown>;
    createUavConfigurationSnapshots: (data: Record<string, unknown>) => Promise<{ id: string }>;
  };

  try {
    const config = await configuratorService.retrieveUavConfiguration(configId);
    if (!config || config.customer_id !== customerId) {
      return res.status(404).json({ error: "Configuration not found" });
    }

    const itemsResult = await configuratorService.listUavConfigurationItems({ configuration_id: configId });
    const items: any[] = Array.isArray(itemsResult)
      ? (Array.isArray(itemsResult[0]) ? itemsResult[0] : itemsResult)
      : itemsResult ? [itemsResult] : [];

    if (items.length === 0) {
      return res.status(400).json({ error: "Configuration has no components" });
    }

    const variantIds = items.map((i: any) => i.product_variant_id);
    const { data: variants } = await query.graph({
      entity: "product_variant",
      fields: ["id", "sku", "product.title", "product.metadata"],
      filters: { id: variantIds },
    });

    const variantMap = new Map((variants as any[]).map((v) => [v.id, v]));

    const components: Record<string, ComponentSpec> = {};
    const snapshotItems: any[] = [];

    for (const item of items) {
      const v = variantMap.get(item.product_variant_id);
      if (!v) {
        return res.status(400).json({ error: `Component no longer available: ${item.component_type}` });
      }

      const metadata = v.product?.metadata || {};
      const spec = parseSpec(metadata);
      const slotKey = item.component_type.toLowerCase();
      if (spec) components[slotKey] = spec;

      snapshotItems.push({
        component_type: item.component_type,
        product_variant_id: item.product_variant_id,
        product_title: v.product?.title || "",
        sku: v.sku || "",
        quantity: item.quantity,
        specs: metadata,
      });
    }

    const validationResult = validate({
      frame: components.frame as FrameSpec | undefined,
      flight_controller: components.flight_controller,
      esc: components.esc as ESCSpec | undefined,
      motor: components.motor as MotorSpec | undefined,
      propeller: components.propeller as PropellerSpec | undefined,
      battery: components.battery as BatterySpec | undefined,
      gps: components.gps,
    });

    if (!validationResult.valid) {
      return res.status(400).json({
        error: "Configuration failed re-validation",
        ...validationResult,
      });
    }

    const snapshot = await configuratorService.createUavConfigurationSnapshots({
      configuration_id: configId,
      customer_id: customerId,
      snapshot_data: {
        configuration_name: config.name,
        items: snapshotItems,
        validation: validationResult,
        captured_at: new Date().toISOString(),
      },
    });

    res.json({ snapshot_id: snapshot.id, validation: validationResult });
  } catch (err) {
    console.error("Snapshot creation error:", err);
    return res.status(500).json({ error: "Failed to create snapshot" });
  }
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const customerId = (req as any).auth_context?.actor_id;
  if (!customerId) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const configId = req.params.id;
  const configuratorService = req.scope.resolve("configurator") as {
    listUavConfigurationSnapshots: (filters?: Record<string, unknown>, config?: Record<string, unknown>) => Promise<unknown>;
  };

  try {
    const result = await configuratorService.listUavConfigurationSnapshots(
      { configuration_id: configId, customer_id: customerId },
      { order: { created_at: "DESC" }, take: 10 }
    );

    const snapshots = Array.isArray(result)
      ? (Array.isArray(result[0]) ? result[0] : result)
      : result ? [result] : [];

    res.json({ snapshots });
  } catch (err) {
    console.error("Snapshot list error:", err);
    return res.status(500).json({ error: "Failed to list snapshots" });
  }
}
