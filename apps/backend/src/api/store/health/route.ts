import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    // Booleans only — never the keys themselves.
    configured: {
      razorpay: Boolean(process.env.RAZORPAY_KEY_ID),
      shipmozo: Boolean(process.env.SHIPMOZO_PUBLIC_KEY),
      email: Boolean(process.env.RESEND_API_KEY),
    },
  });
}
