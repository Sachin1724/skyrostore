import { model } from "@medusajs/framework/utils";

export const QualityCheck = model.define("quality_check", {
  id: model.id().primaryKey(),
  manufacturing_job_id: model.text(),
  checklist_json: model.text().nullable(),
  result: model.enum(["PASS", "FAIL", "PENDING"]),
  inspector_id: model.text().nullable(),
  remarks: model.text().nullable(),
  signed_at: model.dateTime().nullable(),
});
