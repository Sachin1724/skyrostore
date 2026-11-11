import { NextRequest, NextResponse } from "next/server";

const BASE = process.env.NEXT_PUBLIC_MEDUSA_URL || "http://localhost:9000";
const PK = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const res = await fetch(`${BASE}/store/products/${encodeURIComponent(id)}/alternatives`, {
      headers: { "x-publishable-api-key": PK },
      next: { revalidate: 60 },
    });
    if (!res.ok) return NextResponse.json({ alternatives: [] });
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json({ alternatives: [] });
  }
}
