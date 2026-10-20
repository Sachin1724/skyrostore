import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { VALID_TRANSITIONS } from "../../../../modules/manufacturing/models/manufacturing-job";
import crypto from "crypto";

type ManufacturingService = {
  retrieveManufacturingJob: (id: string) => Promise<any>;
  updateManufacturingJobs: (data: Record<string, unknown>) => Promise<any>;
  createManufacturingEvents: (data: Record<string, unknown>) => Promise<any>;
  listManufacturingEvents: (filters?: Record<string, unknown>, config?: Record<string, unknown>) => Promise<any>;
  listComponentAllocations: (filters?: Record<string, unknown>) => Promise<any>;
  createComponentAllocations: (data: Record<string, unknown>) => Promise<any>;
  updateComponentAllocations: (data: Record<string, unknown>) => Promise<any>;
  listAssemblyRecords: (filters?: Record<string, unknown>) => Promise<any>;
  createAssemblyRecords: (data: Record<string, unknown>) => Promise<any>;
  updateAssemblyRecords: (data: Record<string, unknown>) => Promise<any>;
  retrieveBom: (id: string) => Promise<any>;
  listBomItems: (filters?: Record<string, unknown>) => Promise<any>;
};

type QualityService = {
  createQualityChecks: (data: Record<string, unknown>) => Promise<any>;
  listQualityChecks: (filters?: Record<string, unknown>, config?: Record<string, unknown>) => Promise<any>;
};

type ConfiguratorService = {
  listUavConfigurationSnapshots: (filters?: Record<string, unknown>) => Promise<any>;
};

function normalizeList(result: any): any[] {
  if (!result) return [];
  if (Array.isArray(result)) return Array.isArray(result[0]) ? result[0] : result;
  return [result];
}

function generateSerial(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `SKY-${timestamp}-${random}`;
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve("manufacturing") as ManufacturingService;
  const qualityService = req.scope.resolve("quality") as QualityService;
  const configuratorService = req.scope.resolve("configurator") as ConfiguratorService;
  const { id } = req.params;

  try {
    const order = await service.retrieveManufacturingJob(id);

    const [allocations, assemblies, events, qaChecks] = await Promise.all([
      service.listComponentAllocations({ manufacturing_order_id: id }),
      service.listAssemblyRecords({ manufacturing_order_id: id }),
      service.listManufacturingEvents({ manufacturing_job_id: id }, { order: { created_at: "DESC" } }),
      qualityService.listQualityChecks({ manufacturing_job_id: id }, { order: { created_at: "DESC" } }),
    ]);

    let snapshot = null;
    if (order.snapshot_id) {
      const snapResult = await configuratorService.listUavConfigurationSnapshots({ id: order.snapshot_id }).catch(() => null);
      const snapList = normalizeList(snapResult);
      snapshot = snapList[0] || null;
    }

    res.json({
      manufacturing_order: order,
      allocations: normalizeList(allocations),
      assemblies: normalizeList(assemblies),
      events: normalizeList(events),
      qa_checks: normalizeList(qaChecks),
      snapshot,
      valid_transitions: VALID_TRANSITIONS[order.current_stage] || [],
    });
  } catch {
    res.status(404).json({ error: "Manufacturing order not found" });
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const service = req.scope.resolve("manufacturing") as ManufacturingService;
  const qualityService = req.scope.resolve("quality") as QualityService;
  const { id } = req.params;
  const { action, ...payload } = req.body as { action: string; [key: string]: any };
  const actorId = (req as any).auth_context?.actor_id || null;

  try {
    const order = await service.retrieveManufacturingJob(id);

    switch (action) {
      case "transition": {
        const { to, notes } = payload as { to: string; notes?: string };
        const allowed = VALID_TRANSITIONS[order.current_stage] || [];
        if (!allowed.includes(to)) {
          return res.status(400).json({
            error: `Invalid transition: ${order.current_stage} → ${to}`,
            allowed_transitions: allowed,
          });
        }

        const updateData: Record<string, unknown> = { id, current_stage: to };
        if (to === "cancelled") updateData.cancelled_at = new Date();
        if (to === "assembling" && !order.started_at) updateData.started_at = new Date();
        if (to === "qa_passed") updateData.completed_at = new Date();

        const updated = await service.updateManufacturingJobs(updateData);
        await service.createManufacturingEvents({
          manufacturing_job_id: id,
          stage: to,
          status: "transitioned",
          actor_id: actorId,
          notes: notes || `Transitioned to ${to}`,
        });

        // Release allocations on cancel
        if (to === "cancelled") {
          const allocs = normalizeList(await service.listComponentAllocations({ manufacturing_order_id: id }));
          for (const alloc of allocs) {
            if (alloc.allocated_quantity > alloc.consumed_quantity) {
              await service.updateComponentAllocations({
                id: alloc.id,
                released_quantity: alloc.allocated_quantity - alloc.consumed_quantity,
                allocated_quantity: alloc.consumed_quantity,
                status: "released",
              });
            }
          }
        }

        return res.json({ manufacturing_order: updated });
      }

      case "reserve_components": {
        if (order.current_stage !== "planned") {
          return res.status(400).json({ error: "Components can only be reserved in 'planned' stage" });
        }

        // Check existing allocations (idempotency)
        const existingAllocs = normalizeList(await service.listComponentAllocations({ manufacturing_order_id: id }));
        if (existingAllocs.length > 0) {
          return res.json({ allocations: existingAllocs, already_reserved: true });
        }

        // Get component requirements from BOM or snapshot
        let requirements: Array<{ product_variant_id: string; component_type: string; quantity: number }> = [];

        if (order.bom_id) {
          const bomItems = normalizeList(await service.listBomItems({ bom_id: order.bom_id }));
          requirements = bomItems.filter((i: any) => i.required).map((i: any) => ({
            product_variant_id: i.product_variant_id,
            component_type: i.component_type,
            quantity: i.quantity * (order.planned_quantity || 1),
          }));
        } else if (order.snapshot_id) {
          const configuratorService = req.scope.resolve("configurator") as ConfiguratorService;
          const snapResult = normalizeList(await configuratorService.listUavConfigurationSnapshots({ id: order.snapshot_id }).catch(() => []));
          const snap = snapResult[0];
          if (snap?.snapshot_data?.items) {
            requirements = snap.snapshot_data.items.map((i: any) => ({
              product_variant_id: i.product_variant_id,
              component_type: i.component_type,
              quantity: (i.quantity || 1) * (order.planned_quantity || 1),
            }));
          }
        }

        if (requirements.length === 0) {
          return res.status(400).json({ error: "No component requirements found. Attach a BOM or configuration snapshot." });
        }

        // Check stock via Medusa inventory
        const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
        const insufficientStock: string[] = [];

        for (const req_item of requirements) {
          try {
            const { data: variants } = await query.graph({
              entity: "product_variant",
              fields: ["id", "inventory_quantity"],
              filters: { id: req_item.product_variant_id },
            });
            const variant = (variants as any[])[0];
            const available = variant?.inventory_quantity;
            // null/undefined = unmanaged inventory, allow allocation
            if (available != null && available < req_item.quantity) {
              insufficientStock.push(`${req_item.component_type}: need ${req_item.quantity}, have ${available}`);
            }
          } catch {
            insufficientStock.push(`${req_item.component_type}: variant lookup failed`);
          }
        }

        if (insufficientStock.length > 0) {
          return res.status(409).json({ error: "Insufficient stock", details: insufficientStock });
        }

        // Create allocations
        const allocations = [];
        for (const req_item of requirements) {
          const alloc = await service.createComponentAllocations({
            manufacturing_order_id: id,
            product_variant_id: req_item.product_variant_id,
            component_type: req_item.component_type,
            required_quantity: req_item.quantity,
            allocated_quantity: req_item.quantity,
            status: "allocated",
          });
          allocations.push(alloc);
        }

        // Transition to components_reserved
        await service.updateManufacturingJobs({ id, current_stage: "components_reserved" });
        await service.createManufacturingEvents({
          manufacturing_job_id: id,
          stage: "components_reserved",
          status: "transitioned",
          actor_id: actorId,
          notes: `Reserved ${allocations.length} component types`,
        });

        return res.json({ allocations, manufacturing_order: await service.retrieveManufacturingJob(id) });
      }

      case "create_assembly": {
        if (!["assembling", "components_reserved"].includes(order.current_stage)) {
          return res.status(400).json({ error: "Assembly can only be created in 'components_reserved' or 'assembling' stage" });
        }

        // Check existing assembly count
        const existingAssemblies = normalizeList(await service.listAssemblyRecords({ manufacturing_order_id: id }));
        if (existingAssemblies.length >= (order.planned_quantity || 1)) {
          return res.status(400).json({ error: "All planned units already have assembly records" });
        }

        const serialNumber = generateSerial();
        const assembly = await service.createAssemblyRecords({
          manufacturing_order_id: id,
          serial_number: serialNumber,
          status: "pending",
          operator_id: payload.operator_id || actorId,
          firmware_version: payload.firmware_version || null,
          installed_components: payload.installed_components || [],
          notes: payload.notes || null,
        });

        // Auto-transition to assembling if not already
        if (order.current_stage === "components_reserved") {
          await service.updateManufacturingJobs({ id, current_stage: "assembling", started_at: new Date() });
          await service.createManufacturingEvents({
            manufacturing_job_id: id,
            stage: "assembling",
            status: "transitioned",
            actor_id: actorId,
            notes: "Assembly started",
          });
        }

        return res.json({ assembly });
      }

      case "update_assembly": {
        const { assembly_id, status: assemblyStatus, firmware_version, installed_components, notes } = payload;
        if (!assembly_id) return res.status(400).json({ error: "assembly_id required" });

        const updateData: Record<string, unknown> = { id: assembly_id };
        if (assemblyStatus) updateData.status = assemblyStatus;
        if (firmware_version) updateData.firmware_version = firmware_version;
        if (installed_components) updateData.installed_components = installed_components;
        if (notes !== undefined) updateData.notes = notes;
        if (assemblyStatus === "assembled") updateData.completed_at = new Date();
        if (assemblyStatus === "in_progress" && !payload.started_at) updateData.started_at = new Date();

        const updated = await service.updateAssemblyRecords(updateData);
        return res.json({ assembly: updated });
      }

      case "submit_qa": {
        if (!["assembled", "qa_pending"].includes(order.current_stage)) {
          return res.status(400).json({ error: "QA can only be submitted in 'assembled' or 'qa_pending' stage" });
        }

        const { assembly_id, result, checklist, remarks } = payload;
        if (!assembly_id || !result) {
          return res.status(400).json({ error: "assembly_id and result (PASS/FAIL) required" });
        }
        if (!["PASS", "FAIL"].includes(result)) {
          return res.status(400).json({ error: "result must be PASS or FAIL" });
        }

        const qaCheck = await qualityService.createQualityChecks({
          manufacturing_job_id: id,
          checklist_json: checklist ? JSON.stringify(checklist) : null,
          result,
          inspector_id: actorId,
          remarks: remarks || null,
          signed_at: new Date(),
        });

        // Update assembly status
        await service.updateAssemblyRecords({
          id: assembly_id,
          status: result === "PASS" ? "qa_passed" : "qa_failed",
        });

        // Transition manufacturing order
        const newStage = result === "PASS" ? "qa_passed" : "qa_failed";
        await service.updateManufacturingJobs({
          id,
          current_stage: newStage,
          ...(result === "PASS" ? { completed_at: new Date() } : {}),
        });

        await service.createManufacturingEvents({
          manufacturing_job_id: id,
          stage: newStage,
          status: "qa_" + result.toLowerCase(),
          actor_id: actorId,
          notes: remarks || `QA ${result}`,
        });

        return res.json({ qa_check: qaCheck });
      }

      case "consume_components": {
        const allocs = normalizeList(await service.listComponentAllocations({ manufacturing_order_id: id }));
        const consumed = [];
        for (const alloc of allocs) {
          if (alloc.status === "allocated" && alloc.consumed_quantity < alloc.allocated_quantity) {
            const updated = await service.updateComponentAllocations({
              id: alloc.id,
              consumed_quantity: alloc.allocated_quantity,
              status: "consumed",
            });
            consumed.push(updated);
          }
        }
        return res.json({ consumed });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (err: any) {
    if (err.message?.includes("not found")) {
      return res.status(404).json({ error: "Manufacturing order not found" });
    }
    console.error("Manufacturing action error:", err);
    return res.status(500).json({ error: "Internal error" });
  }
}
