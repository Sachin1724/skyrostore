import { Module } from "@medusajs/framework/utils";
import UavModuleService from "./service";

export const UAV_MODULE = "uav";

export default Module(UAV_MODULE, { service: UavModuleService });
