import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { getOrderDetailWorkflow } from "@medusajs/medusa/core-flows";
import { getLabel } from "../../../../../../lib/shipmozo";

/** The courier label PNG for the order's booked shipment, ready to print. */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params;
  try {
    const { result: order } = await getOrderDetailWorkflow(req.scope).run({
      input: { order_id: id, fields: ["id", "fulfillments.canceled_at", "fulfillments.metadata"] },
    });
    const awb = ((order as any)?.fulfillments || []).find((f: any) => !f.canceled_at && f.metadata?.shipmozo_awb)
      ?.metadata.shipmozo_awb;
    if (!awb) return res.status(404).json({ error: "No courier booked for this order yet" });

    const dataUrl = await getLabel(awb);
    const png = Buffer.from(dataUrl.replace(/^data:image\/\w+;base64,/, ""), "base64");
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Content-Disposition", `inline; filename="label-${awb}.png"`);
    return res.send(png);
  } catch (err: unknown) {
    return res.status(400).json({ error: err instanceof Error ? err.message : String(err) });
  }
}
