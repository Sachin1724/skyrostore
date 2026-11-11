import Medusa from "@medusajs/js-sdk";

export const medusa = new Medusa({
  baseUrl: process.env.NEXT_PUBLIC_MEDUSA_URL || "http://localhost:9000",
  debug: process.env.NODE_ENV === "development",
  publishableKey: process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY,
});

/** Medusa 2.21 omits per-line totals from the store cart by default; every cart response the UI reads must ask for them. */
export const CART_QUERY = { fields: "+items.total,+items.subtotal" };
