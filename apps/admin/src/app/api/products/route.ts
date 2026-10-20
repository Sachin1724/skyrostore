import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { storefrontChannelId } from "@/lib/medusa-admin";

const BASE_URL = process.env.NEXT_PUBLIC_MEDUSA_URL || "http://localhost:9000";

type CreateBody = {
  title?: string;
  handle?: string;
  description?: string;
  category_id?: string;
  collection_id?: string;
  component_type?: string;
  sku?: string;
  thumbnail?: string;
  price?: number;
  status?: "draft" | "published";
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/**
 * Creates a product through the Medusa Admin API.
 *
 * The three things that silently hide a new product from the storefront are
 * handled here rather than left to the operator: a price in the store's own
 * currency, membership of the default sales channel, and an explicit status.
 */
export async function POST(request: NextRequest) {
  const token = (await cookies()).get("admin_token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  try {
    const body = (await request.json()) as CreateBody;

    const title = (body.title || "").trim();
    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const price = Number(body.price);
    if (!Number.isFinite(price) || price <= 0) {
      return NextResponse.json(
        { error: "A price greater than zero is required, otherwise the storefront cannot show the product." },
        { status: 400 }
      );
    }

    const handle = slugify(body.handle || title);

    // Currency comes from the configured region; sales channel from the default.
    const [regionRes, channelId] = await Promise.all([
      fetch(`${BASE_URL}/admin/regions?limit=1&fields=id,currency_code`, { headers, cache: "no-store" }),
      storefrontChannelId(),
    ]);

    const region = (await regionRes.json().catch(() => ({})))?.regions?.[0];
    const salesChannel = channelId ? { id: channelId } : null;

    if (!region?.currency_code) {
      return NextResponse.json(
        { error: "No region is configured, so a price cannot be set." },
        { status: 400 }
      );
    }

    const sku = (body.sku || "").trim() || handle.toUpperCase().replace(/-/g, "-").slice(0, 40);

    const payload: Record<string, unknown> = {
      title,
      handle,
      description: body.description || "",
      status: body.status === "published" ? "published" : "draft",
      options: [{ title: "Default", values: ["Standard"] }],
      variants: [
        {
          title: "Standard",
          sku,
          manage_inventory: false,
          options: { Default: "Standard" },
          prices: [
            {
              // Medusa stores minor units; the form collects whole rupees.
              amount: Math.round(price * 100),
              currency_code: region.currency_code,
            },
          ],
        },
      ],
      metadata: body.component_type ? { component_type: body.component_type, sku } : { sku },
    };

    if (body.thumbnail) {
      payload.thumbnail = body.thumbnail;
      payload.images = [{ url: body.thumbnail }];
    }
    if (body.collection_id) payload.collection_id = body.collection_id;
    if (body.category_id) {
      payload.categories = [{ id: body.category_id }];
    }
    if (salesChannel?.id) {
      payload.sales_channels = [{ id: salesChannel.id }];
    }

    const res = await fetch(`${BASE_URL}/admin/products`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        { error: data?.message || `Medusa rejected the product (${res.status})` },
        { status: res.status }
      );
    }

    return NextResponse.json({ ok: true, product: data.product });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
