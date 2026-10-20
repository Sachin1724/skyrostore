import { model } from "@medusajs/framework/utils";

export const ComponentAllocation = model.define("component_allocation", {
  id: model.id().primaryKey(),
  manufacturing_order_id: model.text(),
  product_variant_id: model.text(),
  component_type: model.text(),
  required_quantity: model.number(),
  allocated_quantity: model.number().default(0),
  consumed_quantity: model.number().default(0),
  released_quantity: model.number().default(0),
  status: model.text().default("pending"),
});
