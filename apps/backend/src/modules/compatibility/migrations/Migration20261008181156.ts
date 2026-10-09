import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261008181156 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "compatibility_rule" ("id" text not null, "source_type" text not null, "source_id" text not null, "target_type" text not null, "target_id" text not null, "rule_type" text check ("rule_type" in ('COMPATIBLE', 'WARNING', 'INCOMPATIBLE', 'REQUIRED')) not null, "severity" text null, "condition_json" text null, "message" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "compatibility_rule_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_compatibility_rule_deleted_at" ON "compatibility_rule" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "compatibility_rule" cascade;`);
  }

}
