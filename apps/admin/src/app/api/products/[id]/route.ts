import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { storefrontChannelId } from "@/lib/medusa-admin";
import { serializeMetadataWithSpecs, ProductTechnicalSpecifications } from "@/lib/technical-specs";
import { parseListing } from "@/lib/listing";

const BASE_URL = process.env.NEXT_PUBLIC_MEDUSA_URL || "http://localhost:9000";

/** The product's metadata as stored now, so a save never writes back a stale copy. */
async function currentMetadata(id: string, token: string): Promise<Record<string, unknown> | null> {
  const res = await fetch(`${BASE_URL}/admin/products/${id}?fields=metadata`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const data = await res.json().catch(() => null);
  return (data?.product?.metadata as Record<string, unknown> | null) ?? {};
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const res = await fetch(`${BASE_URL}/admin/products/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Failed to fetch product" }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data);
}

/**
 * Immediate, single-purpose updates: visibility and images.
 * Kept apart from the specs POST so a toggle never rewrites metadata.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const token = (await cookies()).get("admin_token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    status?: string;
    thumbnail?: string | null;
    images?: string[];
    category_ids?: string[];
    collection_id?: string | null;
    listing?: unknown;
  };

  const update: Record<string, unknown> = {};
  if (body.category_ids !== undefined) {
    if (!Array.isArray(body.category_ids)) {
      return NextResponse.json({ error: "Invalid categories" }, { status: 400 });
    }
    update.categories = body.category_ids.map((id) => ({ id }));
  }
  if (body.collection_id !== undefined) update.collection_id = body.collection_id || null;
  if (body.status !== undefined) {
    if (body.status !== "published" && body.status !== "draft") {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    update.status = body.status;
    // Publishing also repairs channel membership, so products created before this fix appear.
    if (body.status === "published") {
      const channelId = await storefrontChannelId();
      if (channelId) update.sales_channels = [{ id: channelId }];
    }
  }
  if (body.images !== undefined) {
    if (!Array.isArray(body.images) || body.images.some((u) => typeof u !== "string" || !u)) {
      return NextResponse.json({ error: "Invalid images" }, { status: 400 });
    }
    update.images = body.images.map((url) => ({ url }));
  }
  if (body.thumbnail !== undefined) update.thumbnail = body.thumbnail;
  if (body.listing !== undefined) {
    const parsed = parseListing(body.listing);
    if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
    const metadata = await currentMetadata(id, token);
    if (!metadata) return NextResponse.json({ error: "Could not read the product" }, { status: 502 });
    update.metadata = { ...metadata, listing: parsed.listing };
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const res = await fetch(`${BASE_URL}/admin/products/${id}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(update),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return NextResponse.json(
      { error: data?.message || `Medusa rejected the update (${res.status})` },
      { status: res.status }
    );
  }
  return NextResponse.json({ ok: true, product: data.product });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, handle, description, technicalSpecs, customFields } = body;
    // Read the stored metadata rather than trusting the copy the editor loaded:
    // other sections (listing details) save independently in between.
    const existingMetadata = await currentMetadata(id, token);
    if (!existingMetadata) {
      return NextResponse.json({ error: "Could not read the product before saving" }, { status: 502 });
    }

    // Build authoritative technical specifications object
    const finalSpecs: ProductTechnicalSpecifications = {
      schemaVersion: technicalSpecs?.schemaVersion || 1,
      componentType: technicalSpecs?.componentType || "GENERIC",
      fields: technicalSpecs?.fields || {},
      additionalSpecifications: Array.isArray(customFields) ? customFields : [],
    };

    // Serialize metadata ensuring backward compatibility with compatibility engine
    const mergedMetadata = serializeMetadataWithSpecs(existingMetadata, finalSpecs);

    // Call Medusa Admin API to persist product updates
    const updatePayload: Record<string, unknown> = {
      metadata: mergedMetadata,
    };
    if (title) updatePayload.title = title;
    if (handle) updatePayload.handle = handle;
    if (description !== undefined) updatePayload.description = description;

    const res = await fetch(`${BASE_URL}/admin/products/${id}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updatePayload),
    });

    if (!res.ok) {
      const errData = await res.text();
      return NextResponse.json(
        { error: `Medusa error: ${errData}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json({ ok: true, product: data.product });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
