import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { parseSpec, validate } from "../../../../lib/compatibility/engine";
import type { FrameSpec, ESCSpec, MotorSpec, PropellerSpec, BatterySpec, ComponentSpec } from "../../../../lib/compatibility/types";

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { order_ids } = req.body as { order_ids?: string[] };

  if (!order_ids?.length) {
    return res.status(400).json({ error: "order_ids array required" });
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const configuratorService = req.scope.resolve("configurator") as {
    listUavConfigurationSnapshots: (filters?: Record<string, unknown>) => Promise<unknown>;
    createUavConfigurationSnapshots: (data: Record<string, unknown>) => Promise<{ id: string }>;
  };

  const results: Array<{ order_id: string; status: string; snapshot_id?: string }> = [];

  for (const orderId of order_ids) {
    try {
      // Check existing snapshot
      const existingResult = await configuratorService.listUavConfigurationSnapshots({ order_id: orderId });
      const existing = Array.isArray(existingResult)
        ? (Array.isArray(existingResult[0]) ? existingResult[0] : existingResult)
        : existingResult ? [existingResult] : [];

      if (existing.length > 0) {
        results.push({ order_id: orderId, status: "already_exists", snapshot_id: (existing[0] as any).id });
        continue;
      }

      // Fetch order line items
      const { data: orders } = await query.graph({
        entity: "order",
        fields: ["id", "items.variant_id", "items.quantity"],
        filters: { id: orderId },
      });

      const order = (orders as any[])?.[0];
      if (!order?.items?.length) {
        results.push({ order_id: orderId, status: "no_items" });
        continue;
      }

      const variantIds = order.items.map((i: any) => i.variant_id).filter(Boolean);
      const { data: variants } = await query.graph({
        entity: "product_variant",
        fields: ["id", "sku", "product.id", "product.title", "product.metadata"],
        filters: { id: variantIds },
      });

      const variantMap = new Map((variants as any[]).map((v) => [v.id, v]));
      const components: Record<string, ComponentSpec> = {};
      const snapshotItems: any[] = [];

      for (const item of order.items) {
        const v = variantMap.get(item.variant_id);
        if (!v) continue;
        const metadata = v.product?.metadata || {};
        const componentType = metadata.component_type as string;
        if (!componentType) continue;

        const spec = parseSpec(metadata);
        if (spec) components[componentType.toLowerCase()] = spec;

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
        results.push({ order_id: orderId, status: "no_uav_components" });
        continue;
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

      const snapshot = await configuratorService.createUavConfigurationSnapshots({
        configuration_id: `order_${orderId}`,
        customer_id: "reconciled",
        order_id: orderId,
        snapshot_data: {
          order_id: orderId,
          items: snapshotItems,
          validation: validationResult,
          captured_at: new Date().toISOString(),
          reconciled: true,
        },
      });

      results.push({ order_id: orderId, status: "created", snapshot_id: snapshot.id });
    } catch (err: any) {
      results.push({ order_id: orderId, status: `error: ${err.message || err}` });
    }
  }

  res.json({ results });
}
