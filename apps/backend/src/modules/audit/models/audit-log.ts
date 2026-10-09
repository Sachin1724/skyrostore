import { model } from "@medusajs/framework/utils";

export const AuditLog = model.define("audit_log", {
  id: model.id().primaryKey(),
  actor_id: model.text().nullable(),
  action: model.text(),
  entity_type: model.text(),
  entity_id: model.text(),
  before_json: model.text().nullable(),
  after_json: model.text().nullable(),
  ip: model.text().nullable(),
  user_agent: model.text().nullable(),
});
