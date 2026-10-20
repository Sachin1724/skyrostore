import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

type ManufacturingService = {
  createBoms: (data: Record<string, unknown>) => Promise<any>;
  listBoms: (filters?: Record<string, unknown>, config?: Record<string, unknown>) => Promise<any>;
  createBomItems: (data: Record<string, unknown>) => Promise<any>;
  listBomItems: (filters?: Record<string, unknown>, config?: Record<string, unknown>) => Promise<any>;
};

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve("manufacturing") as ManufacturingService;
  const { status } = req.query as { status?: string };

  const filters: Record<string, unknown> = {};
  if (status) filters.status = status;

  const result = await service.listBoms(filters, { order: { created_at: "DESC" } });
  const boms = Array.isArray(result) ? (Array.isArray(result[0]) ? result[0] : result) : result ? [result] : [];

  res.json({ boms, count: boms.length });
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve("manufacturing") as ManufacturingService;
  const { name, uav_model, items, notes } = req.body as {
    name: string;
    uav_model?: string;
    items?: Array<{
      product_id: string;
      product_variant_id: string;
      component_type: string;
      quantity?: number;
      required?: boolean;
    }>;
    notes?: string;
  };

  if (!name) {
    return res.status(400).json({ error: "name is required" });
  }

  const bom = await service.createBoms({ name, uav_model: uav_model || null, notes: notes || null });

  if (items?.length) {
    for (const item of items) {
      if (!item.product_id || !item.product_variant_id || !item.component_type) {
        return res.status(400).json({ error: "Each item needs product_id, product_variant_id, component_type" });
      }
      await service.createBomItems({
        bom_id: bom.id,
        product_id: item.product_id,
        product_variant_id: item.product_variant_id,
        component_type: item.component_type,
        quantity: item.quantity || 1,
        required: item.required !== false,
      });
    }
  }

  const bomItems = await service.listBomItems({ bom_id: bom.id });
  const itemsList = Array.isArray(bomItems) ? (Array.isArray(bomItems[0]) ? bomItems[0] : bomItems) : bomItems ? [bomItems] : [];

  res.json({ bom: { ...bom, items: itemsList } });
}
