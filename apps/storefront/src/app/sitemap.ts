import type { MetadataRoute } from "next";
import { getProducts } from "@/lib/data/products";
import { getCategoryTree, getBrands, type CategoryNode } from "@/lib/data/catalog";

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
const POLICIES = ["terms", "privacy", "shipping", "refunds"];

const flatten = (nodes: CategoryNode[]): CategoryNode[] => nodes.flatMap((n) => [n, ...flatten(n.children)]);

/** Every page a shopper can reach. Account, cart and checkout are left out on purpose. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const fixed = ["", "/parts", "/uavs", "/brands", "/build", "/bulk-orders", "/bulk-orders/request", "/support"].map((path) => ({
    url: `${SITE}${path}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.8,
  }));

  // A sitemap must never take the build down, so every lookup degrades to nothing.
  const [{ products }, tree, brands] = await Promise.all([
    getProducts({ limit: 1000 }).catch(() => ({ products: [] as { handle?: string | null; updated_at?: string | null }[] })),
    getCategoryTree().catch(() => []),
    getBrands().catch(() => []),
  ]);

  return [
    ...fixed,
    ...POLICIES.map((slug) => ({ url: `${SITE}/policies/${slug}`, lastModified: now, changeFrequency: "yearly" as const, priority: 0.3 })),
    ...flatten(tree).map((c) => ({ url: `${SITE}/parts?category=${c.handle}`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.7 })),
    ...brands.map((b) => ({ url: `${SITE}/brands/${b.handle}`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.6 })),
    ...products
      .filter((p) => p.handle)
      .map((p) => ({
        url: `${SITE}/products/${p.handle}`,
        lastModified: p.updated_at ? new Date(p.updated_at) : now,
        changeFrequency: "weekly" as const,
        priority: 0.9,
      })),
  ];
}
