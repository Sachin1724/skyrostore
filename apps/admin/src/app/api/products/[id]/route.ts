import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { serializeMetadataWithSpecs, ProductTechnicalSpecifications } from "@/lib/technical-specs";

const BASE_URL = process.env.NEXT_PUBLIC_MEDUSA_URL || "http://localhost:9000";

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
    const { title, handle, description, technicalSpecs, customFields, existingMetadata } = body;

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
