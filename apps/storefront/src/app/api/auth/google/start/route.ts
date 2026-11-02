import { NextRequest, NextResponse } from "next/server";

const BASE = process.env.NEXT_PUBLIC_MEDUSA_URL || "http://localhost:9000";
const PK = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "";

function siteUrl(request: NextRequest): string {
  return process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;
}

/**
 * Begins the Google sign-in flow.
 *
 * Medusa generates and stores the OAuth `state` server-side and returns the
 * consent URL; the client secret and the code exchange never leave the backend.
 */
export async function POST(request: NextRequest) {
  try {
    const callbackUrl = `${siteUrl(request)}/auth/google/callback`;

    const res = await fetch(`${BASE}/auth/customer/google`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-publishable-api-key": PK,
      },
      body: JSON.stringify({ callback_url: callbackUrl }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || !data.location) {
      return NextResponse.json(
        {
          error:
            "Google sign-in is not available. The backend has no Google provider configured.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json({ location: data.location });
  } catch {
    return NextResponse.json(
      { error: "Could not start Google sign-in." },
      { status: 503 }
    );
  }
}
