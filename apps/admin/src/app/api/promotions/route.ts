import { NextRequest, NextResponse } from "next/server";
import { adminCall, respond } from "@/lib/medusa-admin";

const FIELDS = "id,code,status,type,application_method.type,application_method.value,application_method.currency_code,application_method.target_type,created_at";

export async function GET() {
  return respond(await adminCall("GET", `/admin/promotions?limit=100&fields=${FIELDS}`));
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    code?: string;
    method_type?: "percentage" | "fixed";
    value?: number;
    target_type?: "order" | "items";
    limit?: number | null;
  };

  const code = (body.code || "").trim().toUpperCase();
  if (!code) return NextResponse.json({ error: "Code is required" }, { status: 400 });
  if (!body.method_type) return NextResponse.json({ error: "Discount type is required" }, { status: 400 });
  if (!body.value || body.value <= 0) return NextResponse.json({ error: "Value must be greater than 0" }, { status: 400 });

  return respond(
    await adminCall("POST", "/admin/promotions", {
      code,
      type: "standard",
      is_automatic: false,
      status: "active",
      limit: body.limit ?? null,
      application_method: {
        type: body.method_type,
        value: body.value,
        currency_code: body.method_type === "fixed" ? "inr" : null,
        target_type: body.target_type || "order",
        allocation: "across",
      },
    })
  );
}
