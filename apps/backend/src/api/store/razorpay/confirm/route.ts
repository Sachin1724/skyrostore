import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { confirmRazorpayCart, validCheckoutSignature } from "../../../../lib/razorpay-checkout";

/** Browser-side confirmation after the Razorpay checkout modal succeeds. */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { cart_id, razorpay_order_id, razorpay_payment_id, razorpay_signature } = (req.body || {}) as Record<
    string,
    string
  >;
  if (!cart_id || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ error: "Missing Razorpay verification fields" });
  }
  if (!validCheckoutSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
    return res.status(402).json({ error: "Payment signature verification failed" });
  }

  try {
    const result = await confirmRazorpayCart(req.scope, {
      cart_id,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });
    return res.json(result);
  } catch (err: unknown) {
    return res.status(402).json({ error: err instanceof Error ? err.message : String(err) });
  }
}
