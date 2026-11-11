import type { MedusaRequest } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

export type ProductSummary = { title: string; handle: string; thumbnail: string | null };

/** Product title/handle/thumbnail for a set of ids, for turning a raw product_id into something a human reads. */
export async function lookupProducts(req: MedusaRequest, productIds: string[]): Promise<Map<string, ProductSummary>> {
  if (!productIds.length) return new Map();
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "title", "handle", "thumbnail"],
    filters: { id: productIds },
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new Map((products as any[]).map((p) => [p.id, { title: (p.title as string)?.replace("[DEV] ", ""), handle: p.handle, thumbnail: p.thumbnail }]));
}
