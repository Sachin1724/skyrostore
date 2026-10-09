import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261008181247 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "quality_check" ("id" text not null, "manufacturing_job_id" text not null, "checklist_json" text null, "result" text check ("result" in ('PASS', 'FAIL', 'PENDING')) not null, "inspector_id" text null, "remarks" text null, "signed_at" timestamptz null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "quality_check_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_quality_check_deleted_at" ON "quality_check" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "quality_check" cascade;`);
  }

}
