import { NextRequest, NextResponse } from "next/server";
import { medusa } from "@/lib/medusa";

export async function GET(request: NextRequest) {
  const pin = request.nextUrl.searchParams.get("pin") ?? "";
  if (!/^\d{6}$/.test(pin)) return NextResponse.json({ error: "Enter a 6-digit PIN code" }, { status: 400 });
  try {
    const data = await medusa.client.fetch<{ serviceable: boolean | null }>("/store/delivery-check", { query: { pin } });
    return NextResponse.json({ serviceable: data.serviceable });
  } catch {
    return NextResponse.json({ serviceable: null });
  }
}
