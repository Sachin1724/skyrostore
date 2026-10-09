import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { status, q, limit = "50", offset = "0" } = req.query as {
      status?: string;
      q?: string;
      limit?: string;
      offset?: string;
    };

    const db = req.scope.resolve(ContainerRegistrationKeys.PG_CONNECTION) as any;

    let query = db("bulk_order_request");

    if (status) {
      query = query.where({ status });
    }

    if (q) {
      query = query.where((builder: any) => {
        builder
          .whereILike("reference_no", `%${q}%`)
          .orWhereILike("contact_name", `%${q}%`)
          .orWhereILike("email", `%${q}%`)
          .orWhereILike("company_name", `%${q}%`);
      });
    }

    const countQuery = query.clone();
    const [{ count }] = await countQuery.count("id as count");

    const requests = await query
      .orderBy("created_at", "desc")
      .limit(parseInt(limit, 10))
      .offset(parseInt(offset, 10));

    // Attach line item counts or items
    const requestIds = requests.map((r: any) => r.id);
    const lineItems = requestIds.length > 0
      ? await db("bulk_order_line_item").whereIn("request_id", requestIds)
      : [];

    const itemsByReq = lineItems.reduce((acc: Record<string, any[]>, item: any) => {
      if (!acc[item.request_id]) acc[item.request_id] = [];
      acc[item.request_id].push(item);
      return acc;
    }, {});

    const enriched = requests.map((r: any) => ({
      ...r,
      items: itemsByReq[r.id] || [],
    }));

    return res.json({
      requests: enriched,
      count: parseInt(count, 10),
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: errorMsg });
  }
}
