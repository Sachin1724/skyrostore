import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261008181139 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "uav_model" ("id" text not null, "product_id" text not null, "uav_class" text null, "max_takeoff_weight_g" integer null, "payload_capacity_g" integer null, "min_flight_time_min" integer null, "max_flight_time_min" integer null, "firmware" text null, "documentation_url" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "uav_model_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_uav_model_deleted_at" ON "uav_model" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "uav_model" cascade;`);
  }

}
