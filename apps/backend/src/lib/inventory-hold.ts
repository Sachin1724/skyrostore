import type { MedusaContainer } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";

const HOLD_MINUTES = 15;

/**
 * Pre-payment inventory hold. Medusa only reserves stock when the order is
 * actually placed (completeCartWorkflow) — so two shoppers can both open
 * Razorpay for the last unit, both pay, and the second one's money is taken
 * with no order to show for it. This reserves stock the moment the payment
 * step starts, so the second shopper is declined before paying.
 *
 * Reservations made here are temporary and tracked separately from the order's
 * own reservation (created later by completeCartWorkflow against the new
 * order's line items, not the cart's) — released as soon as checkout finishes
 * one way or the other, or after 15 minutes if the shopper just vanishes.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function ensureHoldTable(db: any): Promise<void> {
  const has = await db.schema.hasTable("checkout_inventory_hold");
  if (!has) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await db.schema.createTable("checkout_inventory_hold", (t: any) => {
      t.string("id", 64).primary();
      t.string("cart_id", 64).notNullable().index();
      t.string("reservation_item_id", 64).notNullable();
      t.timestamp("created_at", { useTz: true }).defaultTo(db.fn.now());
      t.timestamp("expires_at", { useTz: true }).notNullable();
    });
  }
}

let cachedLocationId = "";
async function firstStockLocationId(container: MedusaContainer): Promise<string | null> {
  if (cachedLocationId) return cachedLocationId;
  const query = container.resolve(ContainerRegistrationKeys.QUERY) as any;
  const { data } = await query.graph({ entity: "stock_location", fields: ["id"], pagination: { take: 1, skip: 0 } });
  cachedLocationId = data?.[0]?.id ?? "";
  return cachedLocationId || null;
}

export type ReserveResult = { ok: true } | { ok: false; error: string };

/** Idempotent: a second call for the same cart (e.g. a retried checkout step) is a no-op. */
export async function reserveCartForCheckout(container: MedusaContainer, cartId: string): Promise<ReserveResult> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = container.resolve(ContainerRegistrationKeys.PG_CONNECTION) as any;
  await ensureHoldTable(db);

  const existing = await db("checkout_inventory_hold").where({ cart_id: cartId }).where("expires_at", ">", new Date()).first();
  if (existing) return { ok: true };
  await db("checkout_inventory_hold").where({ cart_id: cartId }).delete(); // stale/expired rows for this cart, if any

  const locationId = await firstStockLocationId(container);
  if (!locationId) return { ok: true }; // no stock location configured — nothing to reserve against

  const query = container.resolve(ContainerRegistrationKeys.QUERY) as any;
  const { data: carts } = await query.graph({
    entity: "cart",
    fields: [
      "id",
      "items.id",
      "items.quantity",
      "items.variant.manage_inventory",
      "items.variant.inventory_items.inventory_item_id",
      "items.variant.inventory_items.required_quantity",
    ],
    filters: { id: cartId },
  });
  const cart = carts?.[0];
  if (!cart) return { ok: false, error: "Cart not found" };

  const inventoryService = container.resolve(Modules.INVENTORY) as any;
  const created: { reservationId: string }[] = [];

  try {
    for (const item of cart.items || []) {
      if (!item.variant?.manage_inventory) continue;
      for (const invItem of item.variant.inventory_items || []) {
        const quantity = Number(invItem.required_quantity ?? 1) * Number(item.quantity ?? 1);
        const reservation = await inventoryService.createReservationItems({
          line_item_id: item.id,
          inventory_item_id: invItem.inventory_item_id,
          location_id: locationId,
          quantity,
          description: "checkout_hold",
        });
        created.push({ reservationId: reservation.id });
      }
    }

    if (created.length) {
      const expiresAt = new Date(Date.now() + HOLD_MINUTES * 60000);
      await db("checkout_inventory_hold").insert(
        created.map((c) => ({
          id: `hold_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          cart_id: cartId,
          reservation_item_id: c.reservationId,
          created_at: new Date(),
          expires_at: expiresAt,
        }))
      );
    }
    return { ok: true };
  } catch (err: unknown) {
    // Partial reservation: give back whatever this attempt already took before failing.
    if (created.length) {
      await inventoryService.deleteReservationItems(created.map((c) => c.reservationId)).catch(() => null);
    }
    return { ok: false, error: "That item was just purchased by another builder. Please update your cart." };
  }
}

/** Called once checkout finishes, successfully or not — the real order reservation (if any) now exists independently. */
export async function releaseCheckoutHold(container: MedusaContainer, cartId: string): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = container.resolve(ContainerRegistrationKeys.PG_CONNECTION) as any;
  await ensureHoldTable(db);
  const rows = await db("checkout_inventory_hold").where({ cart_id: cartId });
  if (!rows.length) return;
  const inventoryService = container.resolve(Modules.INVENTORY) as any;
  await inventoryService.deleteReservationItems(rows.map((r: any) => r.reservation_item_id)).catch(() => null);
  await db("checkout_inventory_hold").where({ cart_id: cartId }).delete();
}
