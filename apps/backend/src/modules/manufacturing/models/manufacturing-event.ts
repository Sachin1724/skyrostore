import { model } from "@medusajs/framework/utils";

export const ManufacturingEvent = model.define("manufacturing_event", {
  id: model.id().primaryKey(),
  manufacturing_job_id: model.text(),
  stage: model.text(),
  status: model.text(),
  actor_id: model.text().nullable(),
  notes: model.text().nullable(),
});
