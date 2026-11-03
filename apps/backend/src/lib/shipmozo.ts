/**
 * Shipmozo shipping aggregator (books Delhivery and other couriers).
 * Docs: "API Setup Guide.pdf" — base https://shipping-api.com/app/api/v1,
 * auth via `public-key` / `private-key` headers, every reply is
 * `{ result: "1" | "0", message, data }`.
 */

// No trailing slash: Shipmozo documents that it breaks requests.
const BASE_URL = (process.env.SHIPMOZO_BASE_URL || "https://shipping-api.com/app/api/v1").replace(/\/+$/, "");

export function shipmozoConfigured(): boolean {
  return Boolean(process.env.SHIPMOZO_PUBLIC_KEY && process.env.SHIPMOZO_PRIVATE_KEY);
}

export class ShipmozoError extends Error {}

async function call<T = any>(path: string, body?: unknown): Promise<T> {
  if (!shipmozoConfigured()) throw new ShipmozoError("Shipmozo is not configured");
  const res = await fetch(`${BASE_URL}${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      "Content-Type": "application/json",
      "public-key": process.env.SHIPMOZO_PUBLIC_KEY!,
      "private-key": process.env.SHIPMOZO_PRIVATE_KEY!,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(20000),
  });
  const json: any = await res.json().catch(() => null);
  if (!res.ok || !json || String(json.result) !== "1") {
    const detail = json?.data?.error || json?.message || `HTTP ${res.status}`;
    throw new ShipmozoError(`Shipmozo ${path}: ${typeof detail === "string" ? detail : JSON.stringify(detail)}`);
  }
  return json.data as T;
}

export type PackageDetails = { weight_g: number; length_cm: number; width_cm: number; height_cm: number };

/** Validates the box the packer actually weighed and measured. */
export function validatePackage(input: Record<string, unknown>): { pkg: PackageDetails } | { error: string } {
  const out: Record<string, number> = {};
  for (const key of ["weight_g", "length_cm", "width_cm", "height_cm"]) {
    const n = Number(input[key]);
    if (!Number.isFinite(n) || n <= 0) return { error: `${key} must be a positive number` };
    out[key] = Math.round(n);
  }
  if (out.weight_g > 100000) return { error: "weight_g looks wrong (over 100 kg)" };
  return { pkg: out as PackageDetails };
}

/** Indian mobile: last 10 digits, dropping +91 / leading 0. */
export function normalisePhone(raw: unknown): number | null {
  const digits = String(raw ?? "").replace(/\D/g, "").slice(-10);
  return /^[6-9]\d{9}$/.test(digits) ? Number(digits) : null;
}

/** Maps a Medusa order (with shipping_address and items) to the push-order body. */
export function buildPushOrder(order: any, pkg: PackageDetails, warehouseId: string) {
  const a = order.shipping_address || {};
  const phone = normalisePhone(a.phone);
  const pin = String(a.postal_code || "").replace(/\s/g, "");
  if (!phone) throw new ShipmozoError("Shipping address needs a valid 10-digit Indian mobile number");
  if (!/^\d{6}$/.test(pin)) throw new ShipmozoError("Shipping address needs a 6-digit PIN code");
  if (!a.address_1 || !a.city || !a.province) {
    throw new ShipmozoError("Shipping address is missing street, city or state");
  }

  return {
    // Shipmozo keys everything on this; the Medusa order id is unique and stable.
    order_id: order.id,
    order_date: new Date(order.created_at || Date.now()).toISOString().slice(0, 10),
    order_type: "NON ESSENTIALS",
    consignee_name: [a.first_name, a.last_name].filter(Boolean).join(" ").trim() || order.email,
    consignee_phone: phone,
    consignee_email: order.email || "",
    consignee_address_line_one: [a.company, a.address_1].filter(Boolean).join(", "),
    consignee_address_line_two: a.address_2 || "",
    consignee_pin_code: Number(pin),
    consignee_city: a.city,
    consignee_state: a.province,
    product_detail: (order.items || []).map((item: any) => ({
      name: [item.title, item.variant_title].filter(Boolean).join(" - "),
      sku_number: item.variant_sku || item.id,
      quantity: Number(item.quantity ?? item.detail?.quantity ?? 1),
      discount: "",
      hsn: item.metadata?.hsn || "",
      unit_price: Number(item.unit_price || 0),
      product_category: "Other",
    })),
    // Checkout only takes Razorpay, so every order is prepaid.
    payment_type: "PREPAID",
    cod_amount: "",
    weight: pkg.weight_g,
    length: pkg.length_cm,
    width: pkg.width_cm,
    height: pkg.height_cm,
    warehouse_id: warehouseId,
    gst_ewaybill_number: "",
    gstin_number: process.env.SHIPMOZO_GSTIN || "",
  };
}

let cachedWarehouse = process.env.SHIPMOZO_WAREHOUSE_ID || "";

/** SHIPMOZO_WAREHOUSE_ID, else the panel's default active warehouse. */
export async function warehouseId(): Promise<string> {
  if (cachedWarehouse) return cachedWarehouse;
  const list = await call<any[]>("/get-warehouses");
  const active = (list || []).filter((w) => w.status === "ACTIVE");
  const pick = active.find((w) => w.default === "YES") || active[0];
  if (!pick) throw new ShipmozoError("No active pickup warehouse in Shipmozo; add one in the panel");
  cachedWarehouse = String(pick.id);
  return cachedWarehouse;
}

export const pushOrder = (body: unknown) => call("/push-order", body);

/** Uses the courier rule set in Shipmozo panel → Settings → Auto assign (Delhivery). */
export const autoAssign = (orderId: string) =>
  call<{ awb_number: string; courier_company: string; courier_company_service?: string }>(
    "/auto-assign-order",
    { order_id: orderId }
  );

export const schedulePickup = (orderId: string) => call("/schedule-pickup", { order_id: orderId });

export const orderDetail = (orderId: string) => call<any>(`/get-order-detail/${encodeURIComponent(orderId)}`);

export async function getLabel(awb: string): Promise<string> {
  const data = await call<Array<{ label: string }>>(`/get-order-label/${encodeURIComponent(awb)}`);
  const label = data?.[0]?.label;
  if (!label) throw new ShipmozoError("Shipmozo returned no label for this AWB");
  return label; // data:image/png;base64,...
}

export const trackOrder = (awb: string) =>
  call<{ current_status: string; expected_delivery_date: string | null; status_time: string | null; scan_detail: any[] }>(
    `/track-order?awb_number=${encodeURIComponent(awb)}`
  );

export const cancelOrder = (orderId: string, awb: string) =>
  call("/cancel-order", { order_id: orderId, awb_number: awb });

/**
 * Whether couriers deliver to this PIN from our pickup PIN. Fails open when
 * Shipmozo is unconfigured or unreachable: a lost sale costs more than the rare
 * order support has to re-route by hand.
 */
export async function checkServiceable(pin: unknown): Promise<boolean> {
  return (await serviceability(pin)) ?? true;
}

/** Strict answer for showing to a shopper: null when Shipmozo cannot tell (unconfigured or unreachable). */
export async function serviceability(pin: unknown): Promise<boolean | null> {
  const delivery = String(pin ?? "").replace(/\s/g, "");
  if (!/^\d{6}$/.test(delivery)) return false;
  const pickup = process.env.SHIPMOZO_PICKUP_PINCODE;
  if (!shipmozoConfigured() || !pickup) return null;
  try {
    const data = await call<{ serviceable: boolean }>("/pincode-serviceability", {
      pickup_pincode: Number(pickup),
      delivery_pincode: Number(delivery),
    });
    return data?.serviceable !== false;
  } catch (err) {
    console.warn("shipmozo serviceability:", err instanceof Error ? err.message : err);
    return null;
  }
}

export function isDeliveredStatus(status: unknown): boolean {
  // "Delivered" but not "Undelivered" / "RTO Delivered" (returned to us).
  return /^delivered\b/i.test(String(status || "").trim());
}
