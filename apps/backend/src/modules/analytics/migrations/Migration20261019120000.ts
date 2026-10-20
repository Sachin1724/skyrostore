import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261019120000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "analytics_event" ("id" text not null, "event_key" text not null, "event_type" text not null, "occurred_at" timestamptz not null, "session_id" text not null, "visitor_id" text null, "customer_id" text null, "cart_id" text null, "order_id" text null, "product_id" text null, "variant_id" text null, "line_item_id" text null, "quantity" integer null, "search_query" text null, "checkout_step" text null, "page_path" text null, "referrer" text null, "utm_source" text null, "utm_medium" text null, "utm_campaign" text null, "utm_term" text null, "utm_content" text null, "value" numeric null, "currency_code" text null, "source" text null, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "analytics_event_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_analytics_event_event_key" ON "analytics_event" ("event_key");`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_analytics_event_type_occurred" ON "analytics_event" ("event_type", "occurred_at" DESC);`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_analytics_event_session" ON "analytics_event" ("session_id", "occurred_at");`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_analytics_event_cart" ON "analytics_event" ("cart_id") WHERE cart_id IS NOT NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_analytics_event_product" ON "analytics_event" ("product_id") WHERE product_id IS NOT NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_analytics_event_order" ON "analytics_event" ("order_id") WHERE order_id IS NOT NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_analytics_event_deleted_at" ON "analytics_event" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "payment_attempt" ("id" text not null, "cart_id" text null, "order_id" text null, "session_id" text null, "visitor_id" text null, "provider_id" text not null, "provider_reference" text null, "payment_session_id" text null, "amount" numeric null, "currency_code" text null, "status" text not null, "error_category" text null, "attempt_no" integer not null default 1, "is_retry" boolean not null default false, "webhook_outcome" text null, "attempted_at" timestamptz not null, "resolved_at" timestamptz null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "payment_attempt_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_payment_attempt_cart" ON "payment_attempt" ("cart_id");`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_payment_attempt_status_attempted" ON "payment_attempt" ("status", "attempted_at" DESC);`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_payment_attempt_provider_reference" ON "payment_attempt" ("provider_reference") WHERE provider_reference IS NOT NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_payment_attempt_deleted_at" ON "payment_attempt" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "analytics_event" cascade;`);
    this.addSql(`drop table if exists "payment_attempt" cascade;`);
  }

}
