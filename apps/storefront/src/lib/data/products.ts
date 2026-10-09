import { medusa } from "@/lib/medusa";

const REGION_ID = process.env.NEXT_PUBLIC_REGION_ID || "reg_01M4EBVQ7AW00SGW5JEMPAABK3";

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
    fields: "+variants.calculated_price,+variants.inventory_quantity",
  });
  return { products, count, offset, limit };
}

export async function getProduct(id: string) {
  const { product } = await medusa.store.product.retrieve(id, {
    region_id: REGION_ID,
    fields: "+variants.calculated_price,+variants.inventory_quantity",
  });
  return product;
}

export async function getProductByHandle(handle: string) {
  const { products } = await medusa.store.product.list({
    handle,
    limit: 1,
    region_id: REGION_ID,
    fields: "+variants.calculated_price,+variants.inventory_quantity",
  });
  return products[0] ?? null;
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
