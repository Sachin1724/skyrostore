import { Module } from "@medusajs/framework/utils";
import ConfiguratorModuleService from "./service";

export const CONFIGURATOR_MODULE = "configurator";

export default Module(CONFIGURATOR_MODULE, { service: ConfiguratorModuleService });
