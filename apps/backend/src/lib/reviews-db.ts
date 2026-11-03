export interface ProductReview {
  id: string;
  product_id: string;
  customer_id: string | null;
  author_name: string;
  rating: number;
  title: string;
  content: string;
  verified_purchase: boolean;
  hardware_setup: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  created_at: Date;
}

export interface ProductQuestion {
  id: string;
  product_id: string;
  customer_id: string | null;
  author_name: string;
  question: string;
  answer: string | null;
  answered_by: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  created_at: Date;
  answered_at: Date | null;
}

export interface WishlistItem {
  id: string;
  customer_id: string;
  product_id: string;
  created_at: Date;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function ensureReviewsTables(db: any): Promise<void> {
  const hasReviews = await db.schema.hasTable("product_review");
  if (!hasReviews) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await db.schema.createTable("product_review", (t: any) => {
      t.string("id", 64).primary();
      t.string("product_id", 64).notNullable().index();
      t.string("customer_id", 64).nullable();
      t.string("author_name", 128).notNullable();
      t.integer("rating").notNullable();
      t.string("title", 255).notNullable();
      t.text("content").notNullable();
      t.boolean("verified_purchase").defaultTo(false);
      t.string("hardware_setup", 255).nullable();
      t.string("status", 32).defaultTo("PENDING").index();
      t.timestamp("created_at", { useTz: true }).defaultTo(db.fn.now());
    });
  }

  const hasQuestions = await db.schema.hasTable("product_question");
  if (!hasQuestions) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await db.schema.createTable("product_question", (t: any) => {
      t.string("id", 64).primary();
      t.string("product_id", 64).notNullable().index();
      t.string("customer_id", 64).nullable();
      t.string("author_name", 128).notNullable();
      t.text("question").notNullable();
      t.text("answer").nullable();
      t.string("answered_by", 128).nullable();
      t.string("status", 32).defaultTo("PENDING").index();
      t.timestamp("created_at", { useTz: true }).defaultTo(db.fn.now());
      t.timestamp("answered_at", { useTz: true }).nullable();
    });
  }

  const hasWishlist = await db.schema.hasTable("customer_wishlist");
  if (!hasWishlist) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await db.schema.createTable("customer_wishlist", (t: any) => {
      t.string("id", 64).primary();
      t.string("customer_id", 64).notNullable().index();
      t.string("product_id", 64).notNullable().index();
      t.timestamp("created_at", { useTz: true }).defaultTo(db.fn.now());
      t.unique(["customer_id", "product_id"]);
    });
  }
}
