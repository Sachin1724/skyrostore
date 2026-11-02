import { NextResponse } from "next/server";

const BASE = process.env.NEXT_PUBLIC_MEDUSA_URL || "http://localhost:9000";
const PK = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "";

/**
 * Which sign-in methods the backend actually has configured.
 *
 * The storefront uses this to decide whether to offer Google at all — a button
 * that cannot work is worse than an honest "not configured" state.
 */
export async function GET() {
  try {
    const res = await fetch(`${BASE}/auth/customer/providers`, {
      headers: { "x-publishable-api-key": PK },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json({ providers: [], google: false, firebase: false });
    }

    const data = await res.json();
    const providers: Array<{ id: string }> = data.providers || [];
    return NextResponse.json({
      providers: providers.map((p) => p.id),
      google: providers.some((p) => p.id === "google"),
      firebase: providers.some((p) => p.id === "firebase"),
    });
  } catch {
    return NextResponse.json({ providers: [], google: false, firebase: false });
  }
}
