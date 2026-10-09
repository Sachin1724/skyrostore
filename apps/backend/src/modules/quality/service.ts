import { MedusaService } from "@medusajs/framework/utils";
import { QualityCheck } from "./models/quality-check";

class QualityModuleService extends MedusaService({ QualityCheck }) {}

export default QualityModuleService;
