import { visitorHeaders } from "@/lib/visitor-headers";
import { NextRequest, NextResponse } from "next/server";

const BASE = process.env.NEXT_PUBLIC_MEDUSA_URL || "http://localhost:9000";
const PK = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Reads the unverified claims of a token we just received over TLS from our own backend. */
function readClaims(token: string): { actor_id?: string } {
  try {
    return JSON.parse(Buffer.from(token.split(".")[1], "base64").toString("utf-8"));
  } catch {
    return {};
  }
}

function withSession(token: string) {
  const response = NextResponse.json({ ok: true });
  response.cookies.set("customer_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
  return response;
}

/**
 * Firebase sign-in (phone OTP, Google, email link) → Medusa customer session.
 * The backend verifies the Firebase ID token; this route only creates the
 * customer on a first sign-in and sets the httpOnly cookie.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  if (typeof body.id_token !== "string" || !body.id_token) {
    return NextResponse.json({ error: "Missing sign-in token." }, { status: 400 });
  }

  try {
    const authRes = await fetch(`${BASE}/auth/customer/firebase`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-publishable-api-key": PK, ...visitorHeaders(request) },
      body: JSON.stringify({ id_token: body.id_token }),
      cache: "no-store",
    });
    const authData = await authRes.json().catch(() => ({}));
    if (!authRes.ok || !authData.token) {
      return NextResponse.json({ error: "Sign-in could not be verified. Please try again." }, { status: 401 });
    }
    const token: string = authData.token;
    if (readClaims(token).actor_id) return withSession(token);

    // First sign-in: create the customer from the verified identity.
    const profileRes = await fetch(`${BASE}/store/auth/pending-profile`, {
      headers: { Authorization: `Bearer ${token}`, "x-publishable-api-key": PK, ...visitorHeaders(request) },
      cache: "no-store",
    });
    if (!profileRes.ok) {
      return NextResponse.json({ error: "Your sign-in did not include a usable profile." }, { status: 422 });
    }
    const profile = await profileRes.json();

    // A phone sign-in has no email; order and shipping updates need one.
    const typedEmail = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const email = profile.email || typedEmail;
    if (!email) {
      return NextResponse.json({
        ok: false,
        needs_profile: true,
        phone: profile.phone,
        first_name: profile.first_name,
        last_name: profile.last_name,
      });
    }
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }

    const createRes = await fetch(`${BASE}/store/customers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "x-publishable-api-key": PK, ...visitorHeaders(request),
      },
      body: JSON.stringify({
        email,
        phone: profile.phone || undefined,
        first_name: (body.first_name || profile.first_name || "").trim() || undefined,
        last_name: (body.last_name || profile.last_name || "").trim() || undefined,
      }),
    });
    if (!createRes.ok) {
      const detail = await createRes.text();
      // Linking to an existing account by email would hand over its orders.
      if (/exists|duplicate|unique/i.test(detail)) {
        return NextResponse.json(
          { error: "An account already uses this email. Sign in the way you did before." },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: "We could not create your account. Please try again." }, { status: 400 });
    }

    // The registration token has no customer bound to it; sign in again to get one.
    const again = await fetch(`${BASE}/auth/customer/firebase`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-publishable-api-key": PK, ...visitorHeaders(request) },
      body: JSON.stringify({ id_token: body.id_token }),
      cache: "no-store",
    });
    const againData = await again.json().catch(() => ({}));
    return withSession(againData.token || token);
  } catch {
    return NextResponse.json({ error: "Sign-in service is unreachable. Please try again." }, { status: 502 });
  }
}
