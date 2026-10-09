import { model } from "@medusajs/framework/utils";

export const MANUFACTURING_STAGES = [
  "NOT_REQUIRED",
  "CONFIGURATION_CONFIRMED",
  "COMPONENTS_ALLOCATED",
  "ASSEMBLY",
  "WIRING",
  "FIRMWARE",
  "CALIBRATION",
  "MOTOR_TEST",
  "GPS_TEST",
  "FLIGHT_TEST",
  "QC",
  "PACKED",
  "READY_FOR_SHIPMENT",
] as const;

export const ManufacturingJob = model.define("manufacturing_job", {
  id: model.id().primaryKey(),
  order_id: model.text(),
  uav_configuration_id: model.text().nullable(),
  product_id: model.text(),
  current_stage: model.text().default("CONFIGURATION_CONFIRMED"),
  assigned_operator_id: model.text().nullable(),
  started_at: model.dateTime().nullable(),
  completed_at: model.dateTime().nullable(),
  notes: model.text().nullable(),
});
