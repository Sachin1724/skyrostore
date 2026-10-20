import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

type ManufacturingService = {
  retrieveBom: (id: string) => Promise<any>;
  updateBoms: (data: Record<string, unknown>) => Promise<any>;
  listBomItems: (filters?: Record<string, unknown>) => Promise<any>;
  createBomItems: (data: Record<string, unknown>) => Promise<any>;
  deleteBomItems: (id: string) => Promise<void>;
  listManufacturingJobs: (filters?: Record<string, unknown>) => Promise<any>;
};

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve("manufacturing") as ManufacturingService;
  const { id } = req.params;

  try {
    const bom = await service.retrieveBom(id);
    const itemResult = await service.listBomItems({ bom_id: id });
    const items = Array.isArray(itemResult) ? (Array.isArray(itemResult[0]) ? itemResult[0] : itemResult) : itemResult ? [itemResult] : [];
    res.json({ bom: { ...bom, items } });
  } catch {
    res.status(404).json({ error: "BOM not found" });
  }
}

export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve("manufacturing") as ManufacturingService;
  const { id } = req.params;
  const { name, uav_model, status, items, notes } = req.body as {
    name?: string;
    uav_model?: string;
    status?: string;
    items?: Array<{
      id?: string;
      product_id: string;
      product_variant_id: string;
      component_type: string;
      quantity?: number;
      required?: boolean;
    }>;
    notes?: string;
  };

  try {
    const existing = await service.retrieveBom(id);

    if (status === "active" && existing.status === "active" && existing.revision) {
      // Activating already-active BOM: check no in-flight manufacturing orders reference it
      const jobs = await service.listManufacturingJobs({ bom_id: id });
      const jobList = Array.isArray(jobs) ? (Array.isArray(jobs[0]) ? jobs[0] : jobs) : jobs ? [jobs] : [];
      const inFlight = jobList.filter((j: any) => !["qa_passed", "cancelled"].includes(j.current_stage));
      if (inFlight.length > 0) {
        return res.status(409).json({ error: "Cannot modify active BOM with in-flight manufacturing orders. Create a new revision." });
      }
    }

    const updateData: Record<string, unknown> = { id };
    if (name) updateData.name = name;
    if (uav_model !== undefined) updateData.uav_model = uav_model;
    if (notes !== undefined) updateData.notes = notes;

    if (status) {
      const validStatuses = ["draft", "active", "retired"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: `Invalid status. Must be: ${validStatuses.join(", ")}` });
      }
      updateData.status = status;
      if (status === "active" && existing.status !== "active") {
        updateData.revision = (existing.revision || 0) + 1;
      }
    }

    const updated = await service.updateBoms(updateData);

    if (items) {
      // Remove old items and replace
      const oldItems = await service.listBomItems({ bom_id: id });
      const oldList = Array.isArray(oldItems) ? (Array.isArray(oldItems[0]) ? oldItems[0] : oldItems) : oldItems ? [oldItems] : [];
      for (const old of oldList) {
        await service.deleteBomItems(old.id);
      }
      for (const item of items) {
        await service.createBomItems({
          bom_id: id,
          product_id: item.product_id,
          product_variant_id: item.product_variant_id,
          component_type: item.component_type,
          quantity: item.quantity || 1,
          required: item.required !== false,
        });
      }
    }

    const newItems = await service.listBomItems({ bom_id: id });
    const itemsList = Array.isArray(newItems) ? (Array.isArray(newItems[0]) ? newItems[0] : newItems) : newItems ? [newItems] : [];

    res.json({ bom: { ...updated, items: itemsList } });
  } catch (err: any) {
    if (err.message?.includes("not found")) {
      return res.status(404).json({ error: "BOM not found" });
    }
    throw err;
  }
}
