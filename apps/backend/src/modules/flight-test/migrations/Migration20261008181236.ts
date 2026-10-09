import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261008181236 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "flight_test" ("id" text not null, "manufacturing_job_id" text not null, "test_type" text not null, "pilot_id" text null, "location" text null, "result" text check ("result" in ('PASS', 'FAIL', 'REQUIRES_REWORK')) not null, "telemetry_reference" text null, "notes" text null, "tested_at" timestamptz null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "flight_test_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_flight_test_deleted_at" ON "flight_test" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "flight_test" cascade;`);
  }

}
