import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261008181208 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "uav_configuration" ("id" text not null, "customer_id" text null, "name" text null, "status" text check ("status" in ('DRAFT', 'VALID', 'INVALID', 'ORDERED')) not null default 'DRAFT', "estimated_weight_g" integer null, "estimated_flight_time_min" integer null, "estimated_payload_g" integer null, "estimated_cost" numeric null, "raw_estimated_cost" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "uav_configuration_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_uav_configuration_deleted_at" ON "uav_configuration" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "uav_configuration_item" ("id" text not null, "configuration_id" text not null, "product_variant_id" text not null, "component_type" text not null, "quantity" integer not null default 1, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "uav_configuration_item_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_uav_configuration_item_deleted_at" ON "uav_configuration_item" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "uav_configuration" cascade;`);

    this.addSql(`drop table if exists "uav_configuration_item" cascade;`);
  }

}
