import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

// Published homepage copy. The admin keeps it in the store's metadata: `site_content_draft`
// while editing, copied to `site_content` on publish. Only the published copy is public.
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const { data } = await query.graph({ entity: "store", fields: ["metadata"] });
  res.json({ content: (data[0]?.metadata as Record<string, unknown> | null)?.site_content ?? null });
}
