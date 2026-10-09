import { model } from "@medusajs/framework/utils";

export const UavModel = model.define("uav_model", {
  id: model.id().primaryKey(),
  product_id: model.text(),
  uav_class: model.text().nullable(),
  max_takeoff_weight_g: model.number().nullable(),
  payload_capacity_g: model.number().nullable(),
  min_flight_time_min: model.number().nullable(),
  max_flight_time_min: model.number().nullable(),
  firmware: model.text().nullable(),
  documentation_url: model.text().nullable(),
});
