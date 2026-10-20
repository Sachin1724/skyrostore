import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { COMPONENT_SPEC_FIELDS } from "../../../../lib/compatibility/spec-fields";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  const { data } = await query.graph({
    entity: "product",
    fields: ["id", "title", "status", "metadata", "variants.id", "variants.sku"],
  });

  const products = (data as any[]).map((p) => ({
    id: p.id,
    title: p.title,
    status: p.status,
    component_type: p.metadata?.component_type || null,
    has_specs: !!(p.metadata?.component_type && p.metadata?.weight_g),
    variant_count: p.variants?.length || 0,
    first_sku: p.variants?.[0]?.sku || null,
  }));

  res.json({
    products,
    available_types: Object.keys(COMPONENT_SPEC_FIELDS),
    field_definitions: COMPONENT_SPEC_FIELDS,
  });
}
