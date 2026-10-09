import { MedusaService } from "@medusajs/framework/utils";
import { UavConfiguration, UavConfigurationItem, UavConfigurationSnapshot } from "./models/uav-configuration";

class ConfiguratorModuleService extends MedusaService({
  UavConfiguration,
  UavConfigurationItem,
  UavConfigurationSnapshot,
}) {}

export default ConfiguratorModuleService;
