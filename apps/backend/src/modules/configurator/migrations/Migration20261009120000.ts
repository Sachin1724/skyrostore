import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261009120000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "uav_configuration_snapshot" ("id" text not null, "configuration_id" text not null, "customer_id" text not null, "snapshot_data" jsonb not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "uav_configuration_snapshot_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_uav_configuration_snapshot_deleted_at" ON "uav_configuration_snapshot" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_uav_configuration_snapshot_config" ON "uav_configuration_snapshot" ("configuration_id");`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_uav_configuration_snapshot_customer" ON "uav_configuration_snapshot" ("customer_id");`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "uav_configuration_snapshot" cascade;`);
  }

}
