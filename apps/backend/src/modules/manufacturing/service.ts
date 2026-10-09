import { MedusaService } from "@medusajs/framework/utils";
import { ManufacturingJob } from "./models/manufacturing-job";
import { ManufacturingEvent } from "./models/manufacturing-event";

class ManufacturingModuleService extends MedusaService({
  ManufacturingJob,
  ManufacturingEvent,
}) {}

export default ManufacturingModuleService;
