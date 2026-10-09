import { model } from "@medusajs/framework/utils";

export const UavConfiguration = model.define("uav_configuration", {
  id: model.id().primaryKey(),
  customer_id: model.text().nullable(),
  name: model.text().nullable(),
  status: model.enum(["DRAFT", "VALID", "INVALID", "ORDERED"]).default("DRAFT"),
  estimated_weight_g: model.number().nullable(),
  estimated_flight_time_min: model.number().nullable(),
  estimated_payload_g: model.number().nullable(),
  estimated_cost: model.bigNumber().nullable(),
});

export const UavConfigurationItem = model.define("uav_configuration_item", {
  id: model.id().primaryKey(),
  configuration_id: model.text(),
  product_variant_id: model.text(),
  component_type: model.text(),
  quantity: model.number().default(1),
});

export const UavConfigurationSnapshot = model.define("uav_configuration_snapshot", {
  id: model.id().primaryKey(),
  configuration_id: model.text(),
  customer_id: model.text(),
  snapshot_data: model.json(),
});
