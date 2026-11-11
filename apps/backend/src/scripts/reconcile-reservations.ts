import type { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

/**
 * Resets each inventory level's reserved_quantity to the sum of its live
 * reservation rows, which are the source of truth. A drifted counter shows
 * wrong availability and can oversell or block sales.
 *
 *   npx medusa exec ./src/scripts/reconcile-reservations.ts          (report only)
 *   RECONCILE_FIX=1 npx medusa exec ./src/scripts/reconcile-reservations.ts (apply)
 */
export default async function reconcileReservations({ container }: ExecArgs) {
  const db = container.resolve(ContainerRegistrationKeys.PG_CONNECTION) as any;
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER) as any;
  const fix = process.env.RECONCILE_FIX === "1";

  const { rows } = await db.raw(`
    select il.id, ii.sku, il.location_id, il.reserved_quantity as counter,
           coalesce(sum(ri.quantity) filter (where ri.deleted_at is null), 0) as actual
    from inventory_level il
    join inventory_item ii on ii.id = il.inventory_item_id
    left join reservation_item ri
      on ri.inventory_item_id = il.inventory_item_id and ri.location_id = il.location_id
    where il.deleted_at is null
    group by il.id, ii.sku, il.location_id, il.reserved_quantity
    having il.reserved_quantity <> coalesce(sum(ri.quantity) filter (where ri.deleted_at is null), 0)
  `);

  if (!rows.length) {
    logger.info("reserved_quantity matches reservations everywhere");
    return;
  }
  for (const r of rows) {
    logger.info(`${r.sku} @ ${r.location_id}: counter ${r.counter}, reservations ${r.actual}`);
  }
  if (!fix) {
    logger.info(`${rows.length} level(s) drifted; re-run with RECONCILE_FIX=1 to correct them`);
    return;
  }
  await db.transaction(async (trx: any) => {
    for (const r of rows) {
      await trx("inventory_level").where({ id: r.id }).update({ reserved_quantity: r.actual, updated_at: new Date() });
    }
  });
  logger.info(`corrected ${rows.length} level(s)`);
}
