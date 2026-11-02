import { visitorHeaders } from "@/lib/visitor-headers";
import { NextRequest, NextResponse } from "next/server";

const BASE = process.env.NEXT_PUBLIC_MEDUSA_URL || "http://localhost:9000";
const PK = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

type TokenClaims = { actor_id?: string; auth_identity_id?: string };

/** Reads the unverified claims of a token we just received over TLS from our own backend. */
function readClaims(token: string): TokenClaims {
  try {
    const [, payload] = token.split(".");
    return JSON.parse(Buffer.from(payload, "base64").toString("utf-8"));
  } catch {
    return {};
  }
}

function failure(request: NextRequest, reason: string) {
  const url = new URL("/account", process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin);
  url.searchParams.set("auth_error", reason);
  return NextResponse.redirect(url);
}

/**
 * Google redirects here with `code` and `state`.
 *
 * The code exchange and the state check both happen inside Medusa, which owns
 * the client secret and the stored state. This route only turns the resulting
 * token into an httpOnly session cookie, creating the customer record on a
 * first sign-in.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  // The customer dismissed Google's consent screen.
  if (params.get("error")) {
    return failure(request, params.get("error") === "access_denied" ? "cancelled" : "provider_error");
  }

  const code = params.get("code");
  const state = params.get("state");
  if (!code || !state) {
    return failure(request, "invalid_callback");
  }

  try {
    const callbackUrl = new URL(`${BASE}/auth/customer/google/callback`);
    callbackUrl.searchParams.set("code", code);
    callbackUrl.searchParams.set("state", state);

    const authRes = await fetch(callbackUrl.toString(), {
      headers: { "x-publishable-api-key": PK, ...visitorHeaders(request) },
      cache: "no-store",
    });

    if (!authRes.ok) {
      // Covers an expired or already-consumed state, and a failed exchange.
      return failure(request, "expired_or_used");
    }

    const { token } = await authRes.json();
    if (!token) {
      return failure(request, "no_token");
    }

    const claims = readClaims(token);

    // A first-time identity has no customer yet; create one from the verified
    // profile Google supplied. Identities are keyed by Google's `sub`, so this
    // never merges with an existing account on email alone.
    if (!claims.actor_id) {
      const profileRes = await fetch(`${BASE}/store/auth/pending-profile`, {
        headers: { Authorization: `Bearer ${token}`, "x-publishable-api-key": PK, ...visitorHeaders(request) },
        cache: "no-store",
      });

      if (!profileRes.ok) {
        return failure(request, "profile_unavailable");
      }

      const profile = await profileRes.json();

      const createRes = await fetch(`${BASE}/store/customers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "x-publishable-api-key": PK, ...visitorHeaders(request),
        },
        body: JSON.stringify({
          email: profile.email,
          first_name: profile.first_name || undefined,
          last_name: profile.last_name || undefined,
        }),
      });

      if (!createRes.ok) {
        const detail = await createRes.text();
        // An existing account already owns this email address. Linking it here
        // would hand over someone else's orders, so it is refused.
        if (/exists|duplicate|unique/i.test(detail)) {
          return failure(request, "email_taken");
        }
        return failure(request, "account_creation_failed");
      }
    }

    const redirectUrl = new URL("/account", process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin);
    const response = NextResponse.redirect(redirectUrl);
    response.cookies.set("customer_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE,
      path: "/",
    });
    return response;
  } catch {
    return failure(request, "unexpected");
  }
}
