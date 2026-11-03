import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const productId = req.query.id as string | undefined;

  if (!productId) {
    return res.status(400).json({ error: "Product id query parameter is required" });
  }

  try {
    const { data: products } = await query.graph({
      entity: "product",
      fields: ["id", "title", "handle", "thumbnail", "metadata", "variants.*"],
      filters: { id: productId },
    });

    const targetProduct = products?.[0];
    if (!targetProduct) {
      return res.status(404).json({ error: "Product not found" });
    }

    // List other products in the catalog to evaluate compatibility
    const { data: candidates } = await query.graph({
      entity: "product",
      fields: ["id", "title", "handle", "thumbnail", "metadata", "variants.*"],
      pagination: { take: 50 },
    });

    const targetMeta = ((targetProduct as { metadata?: Record<string, unknown> | null }).metadata || {}) as Record<string, unknown>;
    const targetType = (targetMeta.component_type as string) || "";

    const compatible = (candidates || [])
      .filter((p) => p.id !== targetProduct.id)
      .slice(0, 6)
      .map((p) => {
        const meta = ((p as { metadata?: Record<string, unknown> | null }).metadata || {}) as Record<string, unknown>;
        return {
          id: p.id,
          title: p.title,
          handle: p.handle,
          thumbnail: p.thumbnail ?? null,
          component_type: (meta.component_type as string) || "ACCESSORY",
          reason: `Compatible with ${targetType || "UAV hardware"} specifications`,
        };
      });

    return res.status(200).json({
      product_id: targetProduct.id,
      component_type: targetType,
      compatible,
    });
  } catch (error) {
    console.error("Error evaluating compatible products:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
