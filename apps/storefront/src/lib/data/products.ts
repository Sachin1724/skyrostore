import { medusa } from "@/lib/medusa";

const REGION_ID = process.env.NEXT_PUBLIC_REGION_ID || "reg_01M4EBVQ7AW00SGW5JEMPAABK3";

const INTERNAL_METADATA_KEYS = new Set([
  "internal_batch_code",
  "qa_test_result",
]);

function stripInternalMetadata<T extends { metadata?: Record<string, unknown> | null }>(product: T): T {
  if (!product.metadata) return product;
  const filtered: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(product.metadata)) {
    if (!INTERNAL_METADATA_KEYS.has(k)) filtered[k] = v;
  }
  return { ...product, metadata: filtered };
}

export async function getProducts(params?: {
  limit?: number;
  offset?: number;
  category_id?: string[];
  collection_id?: string[];
  q?: string;
}) {
  const { products, count, offset, limit } = await medusa.store.product.list({
    limit: params?.limit ?? 20,
    offset: params?.offset ?? 0,
    category_id: params?.category_id,
    collection_id: params?.collection_id,
    q: params?.q,
    region_id: REGION_ID,
    fields: "+metadata,+categories,+collection,+variants.calculated_price,+variants.inventory_quantity",
  });
  return { products: products.map(stripInternalMetadata), count, offset, limit };
}

export async function getProduct(id: string) {
  const { product } = await medusa.store.product.retrieve(id, {
    region_id: REGION_ID,
    fields: "+metadata,+variants.calculated_price,+variants.inventory_quantity",
  });
  return stripInternalMetadata(product);
}

export async function getProductByHandle(handle: string) {
  const { products } = await medusa.store.product.list({
    handle,
    limit: 1,
    region_id: REGION_ID,
    fields: "+metadata,+categories,+collection,+variants.calculated_price,+variants.inventory_quantity",
  });
  const p = products[0] ?? null;
  return p ? stripInternalMetadata(p) : null;
}

export async function getCategories() {
  const { product_categories } = await medusa.store.category.list({
    include_descendants_tree: true,
  });
  return product_categories;
}

export async function getCollections() {
  const { collections } = await medusa.store.collection.list();
  return collections;
}
