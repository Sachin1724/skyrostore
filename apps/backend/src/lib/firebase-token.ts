import crypto from "crypto";

/**
 * Verifies a Firebase Authentication ID token the way firebase-admin does,
 * without the dependency: RS256 signature against Google's published
 * securetoken certificates, plus Firebase's documented claim rules.
 * https://firebase.google.com/docs/auth/admin/verify-id-tokens#verify_id_tokens_using_a_third-party_jwt_library
 */

const CERTS_URL =
  "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";
const CLOCK_SKEW_S = 60;

export type FirebaseClaims = {
  sub: string;
  email?: string;
  email_verified?: boolean;
  phone_number?: string;
  name?: string;
  firebase?: { sign_in_provider?: string };
};

type Certs = Record<string, string>;
let cache: { certs: Certs; expires: number } | null = null;

async function googleCerts(): Promise<Certs> {
  if (cache && cache.expires > Date.now()) return cache.certs;
  const res = await fetch(CERTS_URL, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`Could not fetch Firebase certificates (HTTP ${res.status})`);
  const maxAge = Number(/max-age=(\d+)/.exec(res.headers.get("cache-control") || "")?.[1] || 3600);
  cache = { certs: (await res.json()) as Certs, expires: Date.now() + maxAge * 1000 };
  return cache.certs;
}

const decode = (part: string) => JSON.parse(Buffer.from(part, "base64url").toString("utf8"));

export async function verifyFirebaseIdToken(
  token: string,
  projectId: string,
  getCerts: () => Promise<Certs> = googleCerts,
  nowS: number = Math.floor(Date.now() / 1000)
): Promise<FirebaseClaims> {
  const parts = String(token || "").split(".");
  if (parts.length !== 3) throw new Error("Malformed token");
  const [h, p, s] = parts;

  let header: any;
  let payload: any;
  try {
    header = decode(h);
    payload = decode(p);
  } catch {
    throw new Error("Malformed token");
  }

  if (header.alg !== "RS256") throw new Error("Unexpected token algorithm");
  const cert = (await getCerts())[header.kid];
  if (!cert) throw new Error("Unknown signing key");
  const valid = crypto.verify("RSA-SHA256", Buffer.from(`${h}.${p}`), cert, Buffer.from(s, "base64url"));
  if (!valid) throw new Error("Invalid token signature");

  if (payload.aud !== projectId) throw new Error("Token is for another project");
  if (payload.iss !== `https://securetoken.google.com/${projectId}`) throw new Error("Unexpected token issuer");
  if (typeof payload.exp !== "number" || payload.exp + CLOCK_SKEW_S < nowS) throw new Error("Token expired");
  if (typeof payload.iat !== "number" || payload.iat - CLOCK_SKEW_S > nowS) throw new Error("Token issued in the future");
  if (typeof payload.auth_time === "number" && payload.auth_time - CLOCK_SKEW_S > nowS) {
    throw new Error("Token authenticated in the future");
  }
  if (typeof payload.sub !== "string" || !payload.sub || payload.sub.length > 128) throw new Error("Missing subject");

  return payload as FirebaseClaims;
}
