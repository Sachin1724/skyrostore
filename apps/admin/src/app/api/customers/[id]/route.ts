import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BASE_URL = process.env.NEXT_PUBLIC_MEDUSA_URL || "http://localhost:9000";

const EDITABLE_FIELDS = ["first_name", "last_name", "email", "phone", "company_name"] as const;

async function adminToken() {
  return (await cookies()).get("admin_token")?.value;
}

/** Full customer record, with their orders and addresses. */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await adminToken();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  try {
    const [customerRes, ordersRes] = await Promise.all([
      fetch(
        `${BASE_URL}/admin/customers/${id}?fields=id,email,first_name,last_name,phone,company_name,has_account,created_at,updated_at,groups.id,groups.name,addresses.*`,
        { headers, cache: "no-store" }
      ),
      fetch(
        `${BASE_URL}/admin/orders?customer_id=${id}&limit=50&fields=id,display_id,status,total,currency_code,created_at,payment_status,fulfillment_status`,
        { headers, cache: "no-store" }
      ),
    ]);

    if (!customerRes.ok) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: customerRes.status }
      );
    }

    const { customer } = await customerRes.json();
    const orders = ordersRes.ok ? (await ordersRes.json()).orders : [];

    return NextResponse.json({ customer, orders });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** Updates the editable profile fields. Anything else in the body is ignored. */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await adminToken();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const body = await request.json();
    const payload: Record<string, unknown> = {};

    for (const field of EDITABLE_FIELDS) {
      if (body[field] !== undefined) {
        const value = typeof body[field] === "string" ? body[field].trim() : body[field];
        payload[field] = value === "" ? null : value;
      }
    }

    if (typeof payload.email === "string" && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(payload.email)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }
    if (!Object.keys(payload).length) {
      return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
    }

    const res = await fetch(`${BASE_URL}/admin/customers/${id}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        { error: data?.message || "The customer could not be updated." },
        { status: res.status }
      );
    }

    return NextResponse.json({ ok: true, customer: data.customer });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * Deletes a customer.
 *
 * Refused while the customer still has orders: deleting them would detach the
 * order history the fulfilment and finance views depend on.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const token = await adminToken();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  try {
    const ordersRes = await fetch(
      `${BASE_URL}/admin/orders?customer_id=${id}&limit=1&fields=id`,
      { headers, cache: "no-store" }
    );
    const orderCount = ordersRes.ok ? (await ordersRes.json()).count ?? 0 : 0;

    if (orderCount > 0) {
      return NextResponse.json(
        {
          error: `This customer has ${orderCount} order${orderCount === 1 ? "" : "s"}. Deleting them would orphan that order history.`,
          order_count: orderCount,
        },
        { status: 409 }
      );
    }

    const res = await fetch(`${BASE_URL}/admin/customers/${id}`, {
      method: "DELETE",
      headers,
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: data?.message || "The customer could not be deleted." },
        { status: res.status }
      );
    }

    return NextResponse.json({ ok: true, deleted: id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
