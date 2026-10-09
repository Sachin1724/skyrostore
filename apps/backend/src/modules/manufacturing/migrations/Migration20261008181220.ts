import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261008181220 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "manufacturing_event" ("id" text not null, "manufacturing_job_id" text not null, "stage" text not null, "status" text not null, "actor_id" text null, "notes" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "manufacturing_event_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_manufacturing_event_deleted_at" ON "manufacturing_event" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "manufacturing_job" ("id" text not null, "order_id" text not null, "uav_configuration_id" text null, "product_id" text not null, "current_stage" text not null default 'CONFIGURATION_CONFIRMED', "assigned_operator_id" text null, "started_at" timestamptz null, "completed_at" timestamptz null, "notes" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "manufacturing_job_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_manufacturing_job_deleted_at" ON "manufacturing_job" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "manufacturing_event" cascade;`);

    this.addSql(`drop table if exists "manufacturing_job" cascade;`);
  }

}
