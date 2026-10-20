import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261015120000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`ALTER TABLE "uav_configuration_snapshot" ADD COLUMN IF NOT EXISTS "order_id" text NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_uav_configuration_snapshot_order" ON "uav_configuration_snapshot" ("order_id") WHERE order_id IS NOT NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`DROP INDEX IF EXISTS "IDX_uav_configuration_snapshot_order";`);
    this.addSql(`ALTER TABLE "uav_configuration_snapshot" DROP COLUMN IF EXISTS "order_id";`);
  }

}
