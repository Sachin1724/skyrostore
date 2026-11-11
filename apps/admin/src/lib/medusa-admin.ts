import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const BASE_URL = process.env.NEXT_PUBLIC_MEDUSA_URL || "http://localhost:9000";

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Calls the Medusa Admin API as the logged-in admin and returns { ok, status, data }. */
export async function adminCall(method: string, path: string, body?: unknown) {
  const token = (await cookies()).get("admin_token")?.value;
  if (!token) return { ok: false, status: 401, data: { message: "Unauthorized" } as Record<string, any> };

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, any>;
  return { ok: res.ok, status: res.status, data };
}

/**
 * The sales channel the storefront's publishable key reads from. A product outside it is
 * invisible to customers no matter its status, so every create/publish must land in it.
 */
export async function storefrontChannelId(): Promise<string | null> {
  if (process.env.NEXT_PUBLIC_SALES_CHANNEL_ID) return process.env.NEXT_PUBLIC_SALES_CHANNEL_ID;
  const res = await adminCall("GET", "/admin/sales-channels?limit=1&fields=id");
  return res.data?.sales_channels?.[0]?.id ?? null;
}

/** Turns an adminCall result into a NextResponse, passing Medusa's message through on failure. */
export function respond(result: { ok: boolean; status: number; data: Record<string, any> }) {
  if (!result.ok) {
    return NextResponse.json(
      { error: result.data?.message || `Request failed (${result.status})` },
      { status: result.status }
    );
  }
  return NextResponse.json({ ok: true, ...result.data });
}

/**
 * The store's metadata holds small admin-owned documents (homepage copy, media index).
 * Writes send the whole object so other keys survive whether Medusa merges or replaces.
 * ponytail: read-modify-write without a lock; two admins saving the same second can lose one
 * write. Move to a module with its own table if more than a couple of people edit at once.
 */
export async function getStoreMetadata() {
  const res = await adminCall("GET", "/admin/stores?fields=id,metadata");
  const store = res.data?.stores?.[0] as { id: string; metadata: Record<string, any> | null } | undefined;
  if (!store) throw new Error(res.data?.message || "Store not found");
  return { id: store.id, metadata: store.metadata ?? {} };
}

export async function setStoreMetadata(patch: Record<string, unknown>) {
  const { id, metadata } = await getStoreMetadata();
  const res = await adminCall("POST", `/admin/stores/${id}`, { metadata: { ...metadata, ...patch } });
  if (!res.ok) throw new Error(res.data?.message || "Could not save");
}
