import { model } from "@medusajs/framework/utils";

export const FlightTest = model.define("flight_test", {
  id: model.id().primaryKey(),
  manufacturing_job_id: model.text(),
  test_type: model.text(),
  pilot_id: model.text().nullable(),
  location: model.text().nullable(),
  result: model.enum(["PASS", "FAIL", "REQUIRES_REWORK"]),
  telemetry_reference: model.text().nullable(),
  notes: model.text().nullable(),
  tested_at: model.dateTime().nullable(),
});
