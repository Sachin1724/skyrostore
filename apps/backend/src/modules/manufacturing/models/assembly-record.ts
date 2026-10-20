import { model } from "@medusajs/framework/utils";

export const ASSEMBLY_STATUSES = [
  "pending",
  "in_progress",
  "assembled",
  "qa_pending",
  "qa_passed",
  "qa_failed",
  "rework",
  "scrapped",
] as const;

export const AssemblyRecord = model.define("assembly_record", {
  id: model.id().primaryKey(),
  manufacturing_order_id: model.text(),
  serial_number: model.text(),
  status: model.text().default("pending"),
  firmware_version: model.text().nullable(),
  operator_id: model.text().nullable(),
  installed_components: model.json(),
  started_at: model.dateTime().nullable(),
  completed_at: model.dateTime().nullable(),
  notes: model.text().nullable(),
});
