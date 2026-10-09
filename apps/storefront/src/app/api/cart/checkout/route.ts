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

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { cart_id, step } = body;

  if (!cart_id) {
    return NextResponse.json({ error: "Missing cart_id" }, { status: 400 });
  }

  try {
    switch (step) {
      case "customer": {
        const { email, shipping_address } = body;
        if (!email || !shipping_address) {
          return NextResponse.json(
            { error: "Missing email or address" },
            { status: 400 }
          );
        }
        const data = await storeApi(`/store/carts/${cart_id}`, "POST", {
          email,
          shipping_address,
          billing_address: shipping_address,
        });
        return NextResponse.json({ cart: data.cart });
      }

      case "shipping": {
        const { shipping_options } = await storeApi(
          `/store/shipping-options?cart_id=${cart_id}`
        );

        if (!shipping_options?.length) {
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

        return NextResponse.json({
          cart: data.cart,
          shipping_options,
          selected_option: option,
        });
      }

      case "payment": {
        // Create payment collection for this cart
        const pcData = await storeApi(
          `/store/payment-collections`,
          "POST",
          { cart_id }
        );
        const pcId = pcData.payment_collection.id;

        // Initialize payment session with system provider
        await storeApi(
          `/store/payment-collections/${pcId}/payment-sessions`,
          "POST",
          { provider_id: "pp_system_default" }
        );

        const { cart } = await storeApi(`/store/carts/${cart_id}`);
        return NextResponse.json({ cart, payment_collection_id: pcId });
      }

      case "complete": {
        const result = await storeApi(
          `/store/carts/${cart_id}/complete`,
          "POST"
        );
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
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
