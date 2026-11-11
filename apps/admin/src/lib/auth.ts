import { cookies } from "next/headers";

export async function getAuthToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get("admin_token")?.value ?? null;
}

/** Email from the JWT payload, for display only — the token itself is what authorizes every call. */
export async function getOperatorEmail(): Promise<string | null> {
  const token = await getAuthToken();
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    const json = Buffer.from(payload, "base64url").toString("utf8");
    return JSON.parse(json).email ?? null;
  } catch {
    return null;
  }
}
