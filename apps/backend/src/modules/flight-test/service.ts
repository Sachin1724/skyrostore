import { MedusaService } from "@medusajs/framework/utils";
import { FlightTest } from "./models/flight-test";

class FlightTestModuleService extends MedusaService({ FlightTest }) {}

export default FlightTestModuleService;
