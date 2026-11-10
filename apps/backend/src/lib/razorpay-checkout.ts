import crypto from "crypto";
import Razorpay from "razorpay";
import type { MedusaContainer } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { completeCartWorkflow } from "@medusajs/medusa/core-flows";
import { releaseCheckoutHold } from "./inventory-hold";

let client: InstanceType<typeof Razorpay> | null = null;
export function razorpay() {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error("Razorpay is not configured");
  }
  client ??= new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
  return client;
}

export function validCheckoutSignature(orderId: string, paymentId: string, signature: string): boolean {
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
    .update(`${orderId}|${paymentId}`)
    .digest();
  const given = Buffer.from(String(signature || ""), "hex");
  return given.length === expected.length && crypto.timingSafeEqual(given, expected);
}

/** Magic Checkout's customer_details address → Medusa address. */
export function toMedusaAddress(addr: any, details: any) {
  if (!addr) return null;
  const name = String(addr.name || details?.name || "").trim();
  const [first, ...rest] = name.split(/\s+/);
  return {
    first_name: first || "",
    last_name: rest.join(" "),
    address_1: addr.line1 || "",
    address_2: addr.line2 || "",
    city: addr.city || "",
    province: addr.state || "",
    postal_code: String(addr.zipcode || ""),
    country_code: String(addr.country || "in").toLowerCase(),
    phone: String(addr.contact || details?.contact || ""),
  };
}

async function existingOrderId(container: MedusaContainer, cartId: string): Promise<string | null> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY) as any;
  const { data } = await query.graph({ entity: "order_cart", fields: ["order_id"], filters: { cart_id: cartId } });
  return data?.[0]?.order_id ?? null;
}

/**
 * Turns a paid Razorpay order into a Medusa order. Called by the browser after
 * the checkout modal and by the payment.captured webhook, whichever arrives
 * first; the second caller gets the same order back.
 *
 * The address comes from Razorpay (Magic Checkout collected it), never from the
 * browser, and the payment itself is re-checked by the provider on completion.
 */
export async function confirmRazorpayCart(
  container: MedusaContainer,
  input: { cart_id: string; razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature?: string }
): Promise<{ order_id: string }> {
  const { cart_id, razorpay_order_id, razorpay_payment_id } = input;

  const already = await existingOrderId(container, cart_id);
  if (already) return { order_id: already };

  const query = container.resolve(ContainerRegistrationKeys.QUERY) as any;
  const { data: carts } = await query.graph({
    entity: "cart",
    fields: [
      "id",
      "email",
      "completed_at",
      "payment_collection.payment_sessions.id",
      "payment_collection.payment_sessions.provider_id",
      "payment_collection.payment_sessions.amount",
      "payment_collection.payment_sessions.currency_code",
      "payment_collection.payment_sessions.data",
    ],
    filters: { id: cart_id },
  });
  const cart = carts?.[0];
  if (!cart) throw new Error("Cart not found");

  const session = (cart.payment_collection?.payment_sessions || []).find(
    (s: any) => s.provider_id === "pp_razorpay" && s.data?.razorpay_order_id === razorpay_order_id
  );
  if (!session) throw new Error("This payment does not belong to this cart");

  const rzpOrder: any = await razorpay().orders.fetch(razorpay_order_id);
  const details = rzpOrder.customer_details || {};
  const shipping = toMedusaAddress(details.shipping_address, details);
  const billing = toMedusaAddress(details.billing_address, details) || shipping;

  // Module-level update on purpose: the cart workflow would refresh the payment
  // collection and delete the session that was just paid.
  const cartModule = container.resolve(Modules.CART) as any;
  await cartModule.updateCarts(cart_id, {
    ...(details.email && !cart.email ? { email: details.email } : {}),
    ...(shipping ? { shipping_address: shipping } : {}),
    ...(billing ? { billing_address: billing } : {}),
  });
  if (!cart.email && !details.email) throw new Error("Razorpay returned no customer email");

  const paymentModule = container.resolve(Modules.PAYMENT) as any;
  await paymentModule.updatePaymentSession({
    id: session.id,
    amount: session.amount,
    currency_code: session.currency_code,
    // The signature is re-derived by the provider; a webhook-confirmed payment
    // has no browser signature, so one is computed from the verified ids.
    data: {
      ...session.data,
      razorpay_payment_id,
      razorpay_signature:
        input.razorpay_signature ||
        crypto
          .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
          .update(`${razorpay_order_id}|${razorpay_payment_id}`)
          .digest("hex"),
    },
  });

  try {
    const { result } = await completeCartWorkflow(container).run({ input: { id: cart_id } });
    return { order_id: (result as any).id };
  } catch (err) {
    // The other confirmer (browser vs webhook) may have won the race.
    const order = await existingOrderId(container, cart_id);
    if (order) return { order_id: order };
    throw err;
  } finally {
    // The order now holds its own reservation (on success) or none is needed (on failure).
    await releaseCheckoutHold(container, cart_id).catch(() => null);
  }
}
