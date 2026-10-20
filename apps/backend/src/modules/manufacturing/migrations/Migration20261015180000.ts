import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261015180000 extends Migration {
  override async up(): Promise<void> {
    // Alter manufacturing_job: add new columns, change default stage
    this.addSql(`ALTER TABLE "manufacturing_job" ADD COLUMN IF NOT EXISTS "snapshot_id" text NULL;`);
    this.addSql(`ALTER TABLE "manufacturing_job" ADD COLUMN IF NOT EXISTS "bom_id" text NULL;`);
    this.addSql(`ALTER TABLE "manufacturing_job" ADD COLUMN IF NOT EXISTS "bom_revision" integer NULL;`);
    this.addSql(`ALTER TABLE "manufacturing_job" ADD COLUMN IF NOT EXISTS "planned_quantity" integer NOT NULL DEFAULT 1;`);
    this.addSql(`ALTER TABLE "manufacturing_job" ADD COLUMN IF NOT EXISTS "cancelled_at" timestamptz NULL;`);
    this.addSql(`ALTER TABLE "manufacturing_job" ALTER COLUMN "current_stage" SET DEFAULT 'planned';`);

    // BOM table
    this.addSql(`CREATE TABLE IF NOT EXISTS "bom" (
      "id" text NOT NULL,
      "name" text NOT NULL,
      "uav_model" text NULL,
      "revision" integer NOT NULL DEFAULT 1,
      "status" text NOT NULL DEFAULT 'draft',
      "notes" text NULL,
      "created_at" timestamptz NOT NULL DEFAULT now(),
      "updated_at" timestamptz NOT NULL DEFAULT now(),
      "deleted_at" timestamptz NULL,
      CONSTRAINT "bom_pkey" PRIMARY KEY ("id")
    );`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_bom_deleted_at" ON "bom" ("deleted_at") WHERE deleted_at IS NULL;`);

    // BOM item table
    this.addSql(`CREATE TABLE IF NOT EXISTS "bom_item" (
      "id" text NOT NULL,
      "bom_id" text NOT NULL,
      "product_id" text NOT NULL,
      "product_variant_id" text NOT NULL,
      "component_type" text NOT NULL,
      "quantity" integer NOT NULL DEFAULT 1,
      "required" boolean NOT NULL DEFAULT true,
      "created_at" timestamptz NOT NULL DEFAULT now(),
      "updated_at" timestamptz NOT NULL DEFAULT now(),
      "deleted_at" timestamptz NULL,
      CONSTRAINT "bom_item_pkey" PRIMARY KEY ("id")
    );`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_bom_item_bom_id" ON "bom_item" ("bom_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_bom_item_deleted_at" ON "bom_item" ("deleted_at") WHERE deleted_at IS NULL;`);

    // Component allocation table
    this.addSql(`CREATE TABLE IF NOT EXISTS "component_allocation" (
      "id" text NOT NULL,
      "manufacturing_order_id" text NOT NULL,
      "product_variant_id" text NOT NULL,
      "component_type" text NOT NULL,
      "required_quantity" integer NOT NULL,
      "allocated_quantity" integer NOT NULL DEFAULT 0,
      "consumed_quantity" integer NOT NULL DEFAULT 0,
      "released_quantity" integer NOT NULL DEFAULT 0,
      "status" text NOT NULL DEFAULT 'pending',
      "created_at" timestamptz NOT NULL DEFAULT now(),
      "updated_at" timestamptz NOT NULL DEFAULT now(),
      "deleted_at" timestamptz NULL,
      CONSTRAINT "component_allocation_pkey" PRIMARY KEY ("id")
    );`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_component_allocation_order" ON "component_allocation" ("manufacturing_order_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_component_allocation_unique" ON "component_allocation" ("manufacturing_order_id", "product_variant_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_component_allocation_deleted_at" ON "component_allocation" ("deleted_at") WHERE deleted_at IS NULL;`);

    // Assembly record table
    this.addSql(`CREATE TABLE IF NOT EXISTS "assembly_record" (
      "id" text NOT NULL,
      "manufacturing_order_id" text NOT NULL,
      "serial_number" text NOT NULL,
      "status" text NOT NULL DEFAULT 'pending',
      "firmware_version" text NULL,
      "operator_id" text NULL,
      "installed_components" jsonb NOT NULL DEFAULT '[]',
      "started_at" timestamptz NULL,
      "completed_at" timestamptz NULL,
      "notes" text NULL,
      "created_at" timestamptz NOT NULL DEFAULT now(),
      "updated_at" timestamptz NOT NULL DEFAULT now(),
      "deleted_at" timestamptz NULL,
      CONSTRAINT "assembly_record_pkey" PRIMARY KEY ("id")
    );`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_assembly_record_serial" ON "assembly_record" ("serial_number") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_assembly_record_order" ON "assembly_record" ("manufacturing_order_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_assembly_record_deleted_at" ON "assembly_record" ("deleted_at") WHERE deleted_at IS NULL;`);

    // Add index on manufacturing_job.order_id for lookups
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_manufacturing_job_order_id" ON "manufacturing_job" ("order_id") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`DROP TABLE IF EXISTS "assembly_record" CASCADE;`);
    this.addSql(`DROP TABLE IF EXISTS "component_allocation" CASCADE;`);
    this.addSql(`DROP TABLE IF EXISTS "bom_item" CASCADE;`);
    this.addSql(`DROP TABLE IF EXISTS "bom" CASCADE;`);
    this.addSql(`DROP INDEX IF EXISTS "IDX_manufacturing_job_order_id";`);
    this.addSql(`ALTER TABLE "manufacturing_job" DROP COLUMN IF EXISTS "snapshot_id";`);
    this.addSql(`ALTER TABLE "manufacturing_job" DROP COLUMN IF EXISTS "bom_id";`);
    this.addSql(`ALTER TABLE "manufacturing_job" DROP COLUMN IF EXISTS "bom_revision";`);
    this.addSql(`ALTER TABLE "manufacturing_job" DROP COLUMN IF EXISTS "planned_quantity";`);
    this.addSql(`ALTER TABLE "manufacturing_job" DROP COLUMN IF EXISTS "cancelled_at";`);
    this.addSql(`ALTER TABLE "manufacturing_job" ALTER COLUMN "current_stage" SET DEFAULT 'CONFIGURATION_CONFIRMED';`);
  }
}
