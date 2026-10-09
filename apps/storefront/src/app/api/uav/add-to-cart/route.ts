import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { medusa } from "@/lib/medusa";

const BASE = process.env.NEXT_PUBLIC_MEDUSA_URL || "http://localhost:9000";
const PK = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("customer_token")?.value;

  const body = await request.json();
  const { selections, cart_id, configuration_id } = body as {
    selections: Record<string, string>;
    cart_id?: string;
    configuration_id?: string;
  };

  if (!selections || Object.keys(selections).length === 0) {
    return NextResponse.json({ error: "No components selected" }, { status: 400 });
  }

  const validateBody: Record<string, string> = {};
  for (const [slot, variantId] of Object.entries(selections)) {
    if (variantId) validateBody[`${slot}_variant_id`] = variantId;
  }

  const validateRes = await fetch(`${BASE}/store/uav/configurations/validate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-publishable-api-key": PK },
    body: JSON.stringify(validateBody),
  });

  const validation = await validateRes.json();
  if (!validation.valid) {
    return NextResponse.json(
      { error: "Configuration failed re-validation", validation },
      { status: 400 }
    );
  }

  if (configuration_id && token) {
    try {
      await fetch(`${BASE}/store/uav/configurations/${configuration_id}/snapshot`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-publishable-api-key": PK,
          Authorization: `Bearer ${token}`,
        },
      });
    } catch {
      // ponytail: snapshot failure non-blocking for cart add
    }
  }

  let cartId = cart_id;
  if (!cartId) {
    const regions = await medusa.store.region.list();
    const region = regions.regions[0];
    if (!region) {
      return NextResponse.json({ error: "No region configured" }, { status: 500 });
    }
    const { cart } = await medusa.store.cart.create({
      region_id: region.id,
      sales_channel_id: process.env.NEXT_PUBLIC_SALES_CHANNEL_ID || undefined,
    });
    cartId = cart.id;
  }

  const motorCount = validation.estimates?.motor_count ?? 4;
  const slotQuantities: Record<string, number> = {
    frame: 1,
    flight_controller: 1,
    esc: 1,
    motor: motorCount,
    propeller: Math.ceil(motorCount / 2),
    battery: 1,
    gps: 1,
    receiver: 1,
    telemetry: 1,
    camera: 1,
    payload: 1,
    power_module: 1,
  };

  for (const [slot, variantId] of Object.entries(selections)) {
    if (!variantId) continue;
    const quantity = slotQuantities[slot] ?? 1;
    await medusa.store.cart.createLineItem(cartId, {
      variant_id: variantId,
      quantity,
    });
  }

  return NextResponse.json({ cart_id: cartId, validation });
}
