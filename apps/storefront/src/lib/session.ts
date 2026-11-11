import { cache } from "react";
import { cookies } from "next/headers";

const BASE = process.env.NEXT_PUBLIC_MEDUSA_URL || "http://localhost:9000";
const PK = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "";

/**
 * True when this browser holds a session the backend still accepts. A cookie alone is not enough: the
 * token inside can expire before the cookie does, and then the page and the header would disagree.
 * The token itself stays httpOnly. Checked once per request.
 */
export const isSignedIn = cache(async () => {
  const token = (await cookies()).get("customer_token")?.value;
  if (!token) return false;
  try {
    const res = await fetch(`${BASE}/store/customers/me?fields=id`, {
      headers: { "x-publishable-api-key": PK, Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    // Only a definite rejection signs the visitor out; a backend outage keeps the session.
    return res.status !== 401;
  } catch {
    return true;
  }
});
