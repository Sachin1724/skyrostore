import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { VALID_TRANSITIONS } from "../../../modules/manufacturing/models/manufacturing-job";

type ManufacturingService = {
  createManufacturingJobs: (data: Record<string, unknown>) => Promise<any>;
  listManufacturingJobs: (filters?: Record<string, unknown>, config?: Record<string, unknown>) => Promise<any>;
  createManufacturingEvents: (data: Record<string, unknown>) => Promise<any>;
  listComponentAllocations: (filters?: Record<string, unknown>) => Promise<any>;
  listAssemblyRecords: (filters?: Record<string, unknown>) => Promise<any>;
  retrieveBom: (id: string) => Promise<any>;
  listBomItems: (filters?: Record<string, unknown>) => Promise<any>;
};

type ConfiguratorService = {
  listUavConfigurationSnapshots: (filters?: Record<string, unknown>) => Promise<any>;
};

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve("manufacturing") as ManufacturingService;
  const { order_id, status } = req.query as { order_id?: string; status?: string };

  const filters: Record<string, unknown> = {};
  if (order_id) filters.order_id = order_id;
  if (status) filters.current_stage = status;

  const result = await service.listManufacturingJobs(filters, { order: { created_at: "DESC" } });
  const orders = Array.isArray(result) ? (Array.isArray(result[0]) ? result[0] : result) : result ? [result] : [];

  res.json({ manufacturing_orders: orders, count: orders.length });
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve("manufacturing") as ManufacturingService;
  const configuratorService = req.scope.resolve("configurator") as ConfiguratorService;

  const { order_id, snapshot_id, bom_id, product_id, planned_quantity, notes } = req.body as {
    order_id: string;
    snapshot_id?: string;
    bom_id?: string;
    product_id?: string;
    planned_quantity?: number;
    notes?: string;
  };

  if (!order_id) {
    return res.status(400).json({ error: "order_id is required" });
  }

  // Idempotency: check if manufacturing order already exists for this order
  const existing = await service.listManufacturingJobs({ order_id });
  const existingList = Array.isArray(existing) ? (Array.isArray(existing[0]) ? existing[0] : existing) : existing ? [existing] : [];
  if (existingList.length > 0) {
    return res.json({ manufacturing_order: existingList[0], already_exists: true });
  }

  // Resolve snapshot if not provided
  let resolvedSnapshotId = snapshot_id;
  if (!resolvedSnapshotId) {
    const snapshots = await configuratorService.listUavConfigurationSnapshots({ order_id });
    const snapList = Array.isArray(snapshots) ? (Array.isArray(snapshots[0]) ? snapshots[0] : snapshots) : snapshots ? [snapshots] : [];
    if (snapList.length > 0) {
      resolvedSnapshotId = snapList[0].id;
    }
  }

  // Resolve BOM revision
  let bomRevision: number | null = null;
  if (bom_id) {
    try {
      const bom = await service.retrieveBom(bom_id);
      if (bom.status !== "active") {
        return res.status(400).json({ error: "BOM must be active to create manufacturing order" });
      }
      bomRevision = bom.revision;
    } catch {
      return res.status(404).json({ error: "BOM not found" });
    }
  }

  const order = await service.createManufacturingJobs({
    order_id,
    uav_configuration_id: resolvedSnapshotId ? `snapshot_${resolvedSnapshotId}` : null,
    snapshot_id: resolvedSnapshotId || null,
    bom_id: bom_id || null,
    bom_revision: bomRevision,
    product_id: product_id || order_id,
    planned_quantity: planned_quantity || 1,
    notes: notes || null,
  });

  await service.createManufacturingEvents({
    manufacturing_job_id: order.id,
    stage: "planned",
    status: "created",
    actor_id: (req as any).auth_context?.actor_id || null,
    notes: "Manufacturing order created",
  });

  res.json({ manufacturing_order: order });
}
