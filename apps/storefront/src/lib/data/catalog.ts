import { medusa } from "@/lib/medusa";
import { getCategories, getCollections } from "@/lib/data/products";

export type CategoryNode = {
  id: string;
  name: string;
  handle: string;
  children: CategoryNode[];
};

export type BrandInfo = {
  id: string;
  title: string;
  handle: string;
  logo: string | null;
};

type RawCategory = {
  id: string;
  name: string;
  handle: string;
  category_children?: RawCategory[] | null;
};

/** Strips the seed marker so it never reaches customers. */
export const cleanName = (name: string) => name.replace("[DEV] ", "");

function toNode(raw: RawCategory): CategoryNode {
  return {
    id: raw.id,
    name: cleanName(raw.name),
    handle: raw.handle,
    children: (raw.category_children ?? []).map(toNode),
  };
}

/** Active, public category tree (Medusa hides inactive and internal categories from the store API). */
export async function getCategoryTree(): Promise<CategoryNode[]> {
  const all = (await getCategories()) as (RawCategory & { parent_category_id?: string | null })[];
  // The store list returns every level flat when descendants are included; keep only roots.
  return all.filter((c) => !c.parent_category_id).map(toNode);
}

export function findNode(tree: CategoryNode[], handle: string): CategoryNode | null {
  for (const node of tree) {
    if (node.handle === handle) return node;
    const hit = findNode(node.children, handle);
    if (hit) return hit;
  }
  return null;
}

/** Root-to-node chain, for breadcrumbs. */
export function pathTo(tree: CategoryNode[], handle: string, trail: CategoryNode[] = []): CategoryNode[] | null {
  for (const node of tree) {
    const next = [...trail, node];
    if (node.handle === handle) return next;
    const hit = pathTo(node.children, handle, next);
    if (hit) return hit;
  }
  return null;
}

export function descendantIds(node: CategoryNode): string[] {
  return [node.id, ...node.children.flatMap(descendantIds)];
}

export async function getBrands(): Promise<BrandInfo[]> {
  const collections = (await getCollections()) as {
    id: string;
    title: string;
    handle: string;
    metadata?: { logo?: string } | null;
  }[];
  return collections
    .map((c) => ({ id: c.id, title: c.title, handle: c.handle, logo: c.metadata?.logo ?? null }))
    .sort((a, b) => a.title.localeCompare(b.title));
}

export type CatalogIndex = {
  total: number;
  /** category id -> ids of products placed directly in it */
  byCategory: Map<string, Set<string>>;
  byBrand: Map<string, number>;
};

/** One pass over the published catalogue to produce real counts for filters. */
export async function getCatalogIndex(): Promise<CatalogIndex> {
  const { products } = await medusa.store.product.list({
    limit: 1000,
    // Relations need "*": Medusa 2.21 silently drops "categories.id" and "+categories".
    fields: "id,collection_id,*categories",
  });
  const byCategory = new Map<string, Set<string>>();
  const byBrand = new Map<string, number>();
  for (const p of products as { id: string; collection_id?: string | null; categories?: { id: string }[] | null }[]) {
    for (const c of p.categories ?? []) {
      if (!byCategory.has(c.id)) byCategory.set(c.id, new Set());
      byCategory.get(c.id)!.add(p.id);
    }
    if (p.collection_id) byBrand.set(p.collection_id, (byBrand.get(p.collection_id) ?? 0) + 1);
  }
  return { total: products.length, byCategory, byBrand };
}

/** Distinct products in a node or any descendant. */
export function countForNode(node: CategoryNode, index: CatalogIndex): number {
  const ids = new Set<string>();
  for (const id of descendantIds(node)) index.byCategory.get(id)?.forEach((p) => ids.add(p));
  return ids.size;
}
