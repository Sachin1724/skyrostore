import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { COMPONENT_SPEC_FIELDS, validateSpecs } from "../../../../../lib/compatibility/spec-fields";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const productId = req.params.id;
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  const { data } = await query.graph({
    entity: "product",
    fields: ["id", "title", "metadata"],
    filters: { id: productId },
  });

  const product = (data as any[])[0];
  if (!product) {
    return res.status(404).json({ error: "Product not found" });
  }

  const metadata = (product.metadata || {}) as Record<string, string>;
  const componentType = metadata.component_type || null;
  const fields = componentType ? COMPONENT_SPEC_FIELDS[componentType] || [] : [];

  const specs: Record<string, string | null> = {};
  const customSpecs: Record<string, string> = {};

  const knownKeys = new Set(fields.map((f) => f.key));
  knownKeys.add("component_type");

  for (const [key, value] of Object.entries(metadata)) {
    if (key === "component_type") continue;
    if (knownKeys.has(key)) {
      specs[key] = String(value);
    } else {
      customSpecs[key] = String(value);
    }
  }

  res.json({
    product_id: productId,
    product_title: product.title,
    component_type: componentType,
    fields,
    specs,
    custom_specs: customSpecs,
    available_types: Object.keys(COMPONENT_SPEC_FIELDS),
  });
}

export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  const productId = req.params.id;
  const body = req.body as {
    component_type?: string;
    specs?: Record<string, string>;
    custom_specs?: Record<string, string>;
  };

  const productService = req.scope.resolve(Modules.PRODUCT) as any;

  const existing = await productService.retrieveProduct(productId);
  if (!existing) {
    return res.status(404).json({ error: "Product not found" });
  }

  const componentType = body.component_type || (existing.metadata?.component_type as string);
  if (!componentType) {
    return res.status(400).json({ error: "component_type is required" });
  }

  if (!COMPONENT_SPEC_FIELDS[componentType]) {
    return res.status(400).json({
      error: `Unknown component type: ${componentType}`,
      available_types: Object.keys(COMPONENT_SPEC_FIELDS),
    });
  }

  const specs = body.specs || {};
  const validation = validateSpecs(componentType, specs);
  if (!validation.valid) {
    return res.status(400).json({
      error: "Specification validation failed",
      field_errors: validation.errors,
    });
  }

  // Build new metadata: component_type + validated specs + custom specs
  const newMetadata: Record<string, string> = {
    component_type: componentType,
  };

  const fields = COMPONENT_SPEC_FIELDS[componentType];
  const canonicalKeys = new Set(fields.map((f) => f.key));

  for (const field of fields) {
    if (specs[field.key] !== undefined && specs[field.key] !== "") {
      newMetadata[field.key] = String(specs[field.key]);
    }
  }

  // Custom specs: only allow non-canonical keys, reject anything that looks like a canonical field
  if (body.custom_specs) {
    for (const [key, value] of Object.entries(body.custom_specs)) {
      if (canonicalKeys.has(key)) {
        return res.status(400).json({
          error: `Custom spec key "${key}" conflicts with canonical field. Use specs.${key} instead.`,
        });
      }
      if (key === "component_type") {
        return res.status(400).json({
          error: "Cannot set component_type as custom spec",
        });
      }
      newMetadata[key] = String(value);
    }
  }

  await productService.updateProducts(productId, { metadata: newMetadata });

  res.json({
    product_id: productId,
    component_type: componentType,
    metadata: newMetadata,
  });
}
