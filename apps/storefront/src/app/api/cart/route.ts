import { NextRequest, NextResponse } from "next/server";
import { medusa } from "@/lib/medusa";

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  try {
    const { cart } = await medusa.store.cart.retrieve(id);
    return NextResponse.json({ cart });
  } catch {
    return NextResponse.json({ error: "Cart not found" }, { status: 404 });
  }
}
