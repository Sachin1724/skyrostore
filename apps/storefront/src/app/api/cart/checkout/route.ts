import { visitorHeaders } from "@/lib/visitor-headers";
import { NextRequest, NextResponse } from "next/server";

const BASE = process.env.NEXT_PUBLIC_MEDUSA_URL || "http://localhost:9000";
const PK = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "";

async function storeApi(path: string, method = "GET", body?: unknown) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "x-publishable-api-key": PK,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text);
  }
  return res.json();
}

type Journey = {
  session_id?: string;
  visitor_id?: string;
};

/** Fire-and-forget journey event. Never allowed to affect the checkout result. */
function recordStep(
  journey: Journey,
  eventType: string,
  payload: Record<string, unknown>
) {
  if (!journey?.session_id) return;
  void fetch(`${BASE}/store/analytics/events`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-publishable-api-key": PK },
    body: JSON.stringify({
      event_type: eventType,
      session_id: journey.session_id,
      visitor_id: journey.visitor_id || null,
      source: "checkout_server",
      ...payload,
    }),
  }).catch(() => undefined);
}

/**
 * Records a payment attempt. The backend derives amount, provider and outcome
 * from the payment session itself, so a wrong hint here cannot mark a payment
 * paid.
 */
function recordPaymentAttempt(body: Record<string, unknown>) {
  void fetch(`${BASE}/store/analytics/payment-attempts`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-publishable-api-key": PK },
    body: JSON.stringify(body),
  }).catch(() => undefined);
}

/** Razorpay Magic Checkout line items, in paise, from the server-side cart. */
function buildLineItems(cart: any) {
  return (cart.items || []).map((item: any) => {
    const quantity = Number(item.quantity || 1);
    const price = Math.round(Number(item.total ?? item.unit_price * quantity) / quantity);
    return {
      type: "e-commerce",
      sku: item.variant_sku || item.variant_id,
      variant_id: item.variant_id,
      price,
      offer_price: price,
      tax_amount: 0,
      quantity,
      name: item.title,
      description: item.variant_title || item.title,
      ...(item.thumbnail ? { image_url: item.thumbnail } : {}),
    };
  });
}

/** Order-linked UAV snapshot, retried; never blocks the order. */
async function saveSnapshot(orderId: string, cart: any) {
  if (!cart?.items?.length) return;
  const snapshotBody = JSON.stringify({
    order_id: orderId,
    items: cart.items.map((i: any) => ({ variant_id: i.variant_id, quantity: i.quantity })),
  });
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      if (attempt > 0) await new Promise((r) => setTimeout(r, 500 * attempt));
      const snapRes = await fetch(`${BASE}/store/uav/order-snapshot`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-publishable-api-key": PK },
        body: snapshotBody,
      });
      if (snapRes.ok) return;
    } catch {
      // retry
    }
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { cart_id, step } = body;
  const journey: Journey = {
    session_id: typeof body.session_id === "string" ? body.session_id : undefined,
    visitor_id: typeof body.visitor_id === "string" ? body.visitor_id : undefined,
  };

  if (!cart_id) {
    return NextResponse.json({ error: "Missing cart_id" }, { status: 400 });
  }

  try {
    switch (step) {
      case "customer": {
        // Razorpay Magic Checkout collects the name, phone and address; the
        // country alone is enough for shipping options and tax here.
        const { email } = body;
        const data = await storeApi(`/store/carts/${cart_id}`, "POST", {
          ...(typeof email === "string" && email ? { email } : {}),
          shipping_address: { country_code: "in" },
        });
        recordStep(journey, "checkout_step_completed", { cart_id, checkout_step: "customer" });
        return NextResponse.json({ cart: data.cart });
      }

      case "shipping": {
        const { shipping_options } = await storeApi(
          `/store/shipping-options?cart_id=${cart_id}`
        );

        if (!shipping_options?.length) {
          recordStep(journey, "checkout_step_failed", {
            cart_id,
            checkout_step: "shipping",
            metadata: { reason: "no_shipping_options" },
          });
          return NextResponse.json(
            { error: "No shipping options available" },
            { status: 400 }
          );
        }

        const option = shipping_options[0];
        const data = await storeApi(
          `/store/carts/${cart_id}/shipping-methods`,
          "POST",
          { option_id: option.id }
        );

        recordStep(journey, "checkout_step_completed", { cart_id, checkout_step: "shipping" });
        return NextResponse.json({
          cart: data.cart,
          shipping_options,
          selected_option: option,
        });
      }

      case "payment": {
        const { provider_id: requestedProvider } = body;

        // Create payment collection for this cart
        const pcData = await storeApi(
          `/store/payment-collections`,
          "POST",
          { cart_id }
        );
        const pcId = pcData.payment_collection.id;

        // List available payment providers for this cart
        let providerId = requestedProvider || "pp_system_default";
        try {
          const { payment_providers } = await storeApi(
            `/store/payment-providers?region_id=${(await storeApi(`/store/carts/${cart_id}`)).cart.region_id}`
          );
          const available = (payment_providers || []).map((p: any) => p.id);
          if (available.includes("pp_razorpay") && !requestedProvider) {
            providerId = "pp_razorpay";
          } else if (requestedProvider && !available.includes(requestedProvider)) {
            providerId = available[0] || "pp_system_default";
          }
        } catch {
          // Fall back to requested or default
        }

        // Magic Checkout needs the items; built here from the server-side cart,
        // and the provider re-checks the paid amount against the cart total.
        let data: Record<string, unknown> = { cart_id };
        if (providerId === "pp_razorpay") {
          const { cart } = await storeApi(`/store/carts/${cart_id}`);
          data = { cart_id, line_items: buildLineItems(cart) };
        }

        const session = await storeApi(
          `/store/payment-collections/${pcId}/payment-sessions`,
          "POST",
          { provider_id: providerId, data }
        );

        recordStep(journey, "checkout_step_completed", { cart_id, checkout_step: "payment" });
        recordStep(journey, "payment_attempted", {
          cart_id,
          checkout_step: "payment",
          metadata: { provider_id: providerId },
        });
        recordPaymentAttempt({
          cart_id,
          payment_session_id: session.payment_session?.id,
          provider_id: providerId,
          provider_reference: session.payment_session?.data?.razorpay_order_id || null,
          outcome: "pending",
          session_id: journey.session_id,
          visitor_id: journey.visitor_id,
        });

        const { cart } = await storeApi(`/store/carts/${cart_id}`);
        return NextResponse.json({
          cart,
          payment_collection_id: pcId,
          provider_id: providerId,
          payment_session: session.payment_session,
        });
      }

      case "confirm": {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
          return NextResponse.json({ error: "Missing Razorpay verification fields" }, { status: 400 });
        }
        const { cart: preCart } = await storeApi(`/store/carts/${cart_id}`);

        const res = await fetch(`${BASE}/store/razorpay/confirm`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-publishable-api-key": PK, ...visitorHeaders(request) },
          body: JSON.stringify({ cart_id, razorpay_order_id, razorpay_payment_id, razorpay_signature }),
        });
        const result = await res.json().catch(() => ({}));
        if (!res.ok || !result.order_id) {
          recordPaymentAttempt({
            cart_id,
            provider_reference: razorpay_payment_id,
            outcome: "failed",
            error_message: "verification_failed",
            session_id: journey.session_id,
            visitor_id: journey.visitor_id,
          });
          recordStep(journey, "checkout_step_failed", {
            cart_id,
            checkout_step: "verify-payment",
            metadata: { reason: "verification_failed" },
          });
          return NextResponse.json(
            { error: result.error || "Payment could not be confirmed. If money was debited, it will be confirmed automatically." },
            { status: 402 }
          );
        }

        await saveSnapshot(result.order_id, preCart);
        recordStep(journey, "checkout_step_completed", {
          cart_id,
          checkout_step: "complete",
          order_id: result.order_id,
        });
        return NextResponse.json({ order: { id: result.order_id } });
      }

      case "complete": {
        // Re-validate UAV components in cart before completing
        const { cart: preCart } = await storeApi(`/store/carts/${cart_id}`);
        if (preCart?.items?.length) {
          try {
            const variantIds = preCart.items.map((i: any) => i.variant_id).filter(Boolean);
            const productRes = await fetch(
              `${BASE}/store/products?variants.id=${variantIds.join(",")}&fields=variants.id,metadata`,
              { headers: { "x-publishable-api-key": PK } }
            );
            if (productRes.ok) {
              const { products } = await productRes.json();
              const validateBody: Record<string, string> = {};
              for (const product of products || []) {
                const ct = product.metadata?.component_type as string;
                if (!ct) continue;
                const variant = product.variants?.find((v: any) => variantIds.includes(v.id));
                if (variant) {
                  validateBody[`${ct.toLowerCase()}_variant_id`] = variant.id;
                }
              }
              if (Object.keys(validateBody).length >= 2) {
                const valRes = await fetch(`${BASE}/store/uav/configurations/validate`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json", "x-publishable-api-key": PK },
                  body: JSON.stringify(validateBody),
                });
                if (valRes.ok) {
                  const valData = await valRes.json();
                  if (!valData.valid) {
                    return NextResponse.json(
                      { error: "UAV configuration is no longer valid. Please review your build.", validation: valData },
                      { status: 400 }
                    );
                  }
                } else if (valRes.status === 400) {
                  const valData = await valRes.json();
                  if (valData.missing_variant_ids?.length) {
                    return NextResponse.json(
                      { error: "Some UAV components are no longer available. Please update your cart." },
                      { status: 400 }
                    );
                  }
                }
              }
            }
          } catch {
            // ponytail: validation service down shouldn't block checkout
          }
        }

        const result = await storeApi(
          `/store/carts/${cart_id}/complete`,
          "POST"
        );

        const orderId = result?.order?.id;
        if (orderId) await saveSnapshot(orderId, preCart);

        recordStep(journey, "checkout_step_completed", {
          cart_id,
          checkout_step: "complete",
          order_id: orderId || null,
        });
        return NextResponse.json(result);
      }

      default:
        return NextResponse.json(
          { error: "Invalid step" },
          { status: 400 }
        );
    }
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Checkout step failed";
    recordStep(journey, "checkout_step_failed", {
      cart_id,
      checkout_step: typeof step === "string" ? step : null,
      metadata: { reason: "step_error" },
    });
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
