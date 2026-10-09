import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BASE = process.env.NEXT_PUBLIC_MEDUSA_URL || "http://localhost:9000";
const PK = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "";

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("customer_token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = request.nextUrl.searchParams.get("limit") || "20";
  const offset = request.nextUrl.searchParams.get("offset") || "0";

  try {
    const res = await fetch(
      `${BASE}/store/orders?limit=${limit}&offset=${offset}`,
      {
        headers: {
          "x-publishable-api-key": PK,
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!res.ok) {
      if (res.status === 401) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      throw new Error(`${res.status}`);
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
