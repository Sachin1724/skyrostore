import { MedusaService } from "@medusajs/framework/utils";
import { ManufacturingJob } from "./models/manufacturing-job";
import { ManufacturingEvent } from "./models/manufacturing-event";
import { Bom, BomItem } from "./models/bom";
import { ComponentAllocation } from "./models/component-allocation";
import { AssemblyRecord } from "./models/assembly-record";

class ManufacturingModuleService extends MedusaService({
  ManufacturingJob,
  ManufacturingEvent,
  Bom,
  BomItem,
  ComponentAllocation,
  AssemblyRecord,
}) {}

export default ManufacturingModuleService;
