"use client";

import { useEffect, useState } from "react";
import type { HttpTypes } from "@medusajs/types";
import { ProductRail } from "@/components/home/product-rail";

const STORAGE_KEY = "skyro_recently_viewed_v1";

/** "Because you viewed": more from the categories this browser has looked at. Empty until something is viewed. */
export function RecommendedForYou({ title = "Recommended for you", excludeId }: { title?: string; excludeId?: string }) {
  const [products, setProducts] = useState<HttpTypes.StoreProduct[]>([]);

  useEffect(() => {
    let viewed: { id: string; categoryId?: string }[] = [];
    try {
      viewed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    } catch {}
    const cats = [...new Set(viewed.map((v) => v.categoryId).filter(Boolean))] as string[];
    if (cats.length === 0) return;
    const seen = [...viewed.map((v) => v.id), ...(excludeId ? [excludeId] : [])];
    fetch(`/api/recommendations?c=${cats.join(",")}&x=${seen.join(",")}`)
      .then((r) => (r.ok ? r.json() : { products: [] }))
      .then((d) => setProducts(d.products || []))
      .catch(() => {});
  }, [excludeId]);

  return <ProductRail title={title} href="/parts" products={products} />;
}
