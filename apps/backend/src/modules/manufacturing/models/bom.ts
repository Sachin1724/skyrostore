import { model } from "@medusajs/framework/utils";

export const BOM_STATUSES = ["draft", "active", "retired"] as const;

export const Bom = model.define("bom", {
  id: model.id().primaryKey(),
  name: model.text(),
  uav_model: model.text().nullable(),
  revision: model.number().default(1),
  status: model.text().default("draft"),
  notes: model.text().nullable(),
});

export const BomItem = model.define("bom_item", {
  id: model.id().primaryKey(),
  bom_id: model.text(),
  product_id: model.text(),
  product_variant_id: model.text(),
  component_type: model.text(),
  quantity: model.number().default(1),
  required: model.boolean().default(true),
});
