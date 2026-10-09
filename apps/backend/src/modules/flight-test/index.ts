import { Module } from "@medusajs/framework/utils";
import FlightTestModuleService from "./service";

export const FLIGHT_TEST_MODULE = "flightTest";

export default Module(FLIGHT_TEST_MODULE, { service: FlightTestModuleService });
