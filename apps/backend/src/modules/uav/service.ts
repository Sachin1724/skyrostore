import { MedusaService } from "@medusajs/framework/utils";
import { UavModel } from "./models/uav-model";

class UavModuleService extends MedusaService({ UavModel }) {}

export default UavModuleService;
