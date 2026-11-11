import type { MedusaContainer } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { ensureHoldTable } from "../lib/inventory-hold";

/** Frees stock held for an abandoned checkout (closed tab, payment never attempted). */
export default async function releaseExpiredCheckoutHolds(container: MedusaContainer) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = container.resolve(ContainerRegistrationKeys.PG_CONNECTION) as any;
  await ensureHoldTable(db);

  const expired = await db("checkout_inventory_hold").where("expires_at", "<=", new Date()).limit(500);
  if (!expired.length) return;

  const inventoryService = container.resolve(Modules.INVENTORY) as any;
  try {
    await inventoryService.deleteReservationItems(expired.map((r: any) => r.reservation_item_id));
  } catch (err: unknown) {
    console.error("release-expired-checkout-holds:", err instanceof Error ? err.message : err);
  }
  await db("checkout_inventory_hold")
    .whereIn(
      "id",
      expired.map((r: any) => r.id)
    )
    .delete();
}

export const config = { name: "release-expired-checkout-holds", schedule: "*/5 * * * *" };
