import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { razorpay } from "../../../lib/razorpay-checkout";
import { checkServiceable } from "../../../lib/shipmozo";

/**
 * Magic Checkout "Shipping Info" URL (set it in the Razorpay dashboard).
 * Razorpay sends the addresses the customer picks; we answer whether each PIN
 * is deliverable and the shipping fee, which is the part of the cart total not
 * already in line_items_total.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = (req.body || {}) as { razorpay_order_id?: string; addresses?: any[] };
  let shippingFee = 0;
  try {
    if (body.razorpay_order_id) {
      const order: any = await razorpay().orders.fetch(body.razorpay_order_id);
      shippingFee = Math.max(0, Number(order.notes?.shipping_fee || 0));
    }
  } catch (err) {
    console.warn("shipping-info: could not read order", err instanceof Error ? err.message : err);
  }

  const addresses = await Promise.all(
    (body.addresses || []).map(async (addr) => ({
      id: addr.id,
      zipcode: addr.zipcode,
      country: addr.country,
      shipping_methods: [
        {
          id: "standard",
          name: "Standard delivery",
          description: "Tracked courier delivery across India",
          serviceable: String(addr.country || "in").toLowerCase() === "in" && (await checkServiceable(addr.zipcode)),
          shipping_fee: shippingFee,
          cod: false,
          cod_fee: 0,
        },
      ],
    }))
  );

  return res.json({ addresses });
}
