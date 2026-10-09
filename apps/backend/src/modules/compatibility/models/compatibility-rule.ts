import { model } from "@medusajs/framework/utils";

export const CompatibilityRule = model.define("compatibility_rule", {
  id: model.id().primaryKey(),
  source_type: model.text(),
  source_id: model.text(),
  target_type: model.text(),
  target_id: model.text(),
  rule_type: model.enum(["COMPATIBLE", "WARNING", "INCOMPATIBLE", "REQUIRED"]),
  severity: model.text().nullable(),
  condition_json: model.text().nullable(),
  message: model.text().nullable(),
});
