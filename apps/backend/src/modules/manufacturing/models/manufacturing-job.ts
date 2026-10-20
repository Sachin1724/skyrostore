import { model } from "@medusajs/framework/utils";

export const MANUFACTURING_STATUSES = [
  "planned",
  "components_reserved",
  "assembling",
  "assembled",
  "qa_pending",
  "qa_passed",
  "blocked",
  "qa_failed",
  "cancelled",
] as const;

export type ManufacturingStatus = (typeof MANUFACTURING_STATUSES)[number];

export const VALID_TRANSITIONS: Record<string, string[]> = {
  planned: ["components_reserved", "blocked", "cancelled"],
  components_reserved: ["assembling", "blocked", "cancelled"],
  assembling: ["assembled", "blocked", "cancelled"],
  assembled: ["qa_pending", "blocked", "cancelled"],
  qa_pending: ["qa_passed", "qa_failed", "blocked"],
  qa_failed: ["assembling", "blocked", "cancelled"],
  blocked: ["planned", "components_reserved", "assembling", "assembled", "qa_pending", "cancelled"],
  qa_passed: [],
  cancelled: [],
};

export const ManufacturingJob = model.define("manufacturing_job", {
  id: model.id().primaryKey(),
  order_id: model.text(),
  uav_configuration_id: model.text().nullable(),
  snapshot_id: model.text().nullable(),
  bom_id: model.text().nullable(),
  bom_revision: model.number().nullable(),
  product_id: model.text(),
  planned_quantity: model.number().default(1),
  current_stage: model.text().default("planned"),
  assigned_operator_id: model.text().nullable(),
  started_at: model.dateTime().nullable(),
  completed_at: model.dateTime().nullable(),
  cancelled_at: model.dateTime().nullable(),
  notes: model.text().nullable(),
});
