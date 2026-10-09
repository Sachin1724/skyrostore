import { MedusaService } from "@medusajs/framework/utils";
import { CompatibilityRule } from "./models/compatibility-rule";

class CompatibilityModuleService extends MedusaService({ CompatibilityRule }) {}

export default CompatibilityModuleService;
