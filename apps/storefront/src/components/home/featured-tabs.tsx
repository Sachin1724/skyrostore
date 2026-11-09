"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import type { HttpTypes } from "@medusajs/types";
import { ProductCard } from "@/components/product/product-card";

interface FeaturedTabsProps {
  products: HttpTypes.StoreProduct[];
}

type TabKey = "featured" | "best_sellers" | "new_in_stock" | "propulsion" | "avionics";

interface TabDef {
  key: TabKey;
  label: string;
}

const TABS: TabDef[] = [
  { key: "featured", label: "Featured" },
  { key: "best_sellers", label: "Best Sellers" },
  { key: "new_in_stock", label: "New in Stock" },
  { key: "propulsion", label: "Propulsion & Motors" },
  { key: "avionics", label: "Avionics & Controllers" },
];

export function FeaturedTabs({ products }: FeaturedTabsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("featured");

  const filteredProducts = useMemo(() => {
    switch (activeTab) {
      case "best_sellers":
        // Sort by variants inventory or highest rated/popular
        return [...products]
          .filter((p) => {
            const v = p.variants?.[0];
            return v?.manage_inventory === false || (v?.inventory_quantity ?? 0) > 0;
          })
          .sort((a, b) => (b.variants?.length ?? 1) - (a.variants?.length ?? 1))
          .slice(0, 8);

      case "new_in_stock":
        return [...products]
          .sort((a, b) => String(b.created_at ?? "").localeCompare(String(a.created_at ?? "")))
          .slice(0, 8);

      case "propulsion":
        return products
          .filter((p) => {
            const cat = p.categories?.map((c) => c.name.toLowerCase()).join(" ") ?? "";
            const title = p.title.toLowerCase();
            return (
              cat.includes("motor") ||
              cat.includes("prop") ||
              cat.includes("esc") ||
              title.includes("motor") ||
              title.includes("prop") ||
              title.includes("esc") ||
              p.metadata?.component_type === "MOTOR" ||
              p.metadata?.component_type === "PROPELLER" ||
              p.metadata?.component_type === "ESC"
            );
          })
          .slice(0, 8);

      case "avionics":
        return products
          .filter((p) => {
            const cat = p.categories?.map((c) => c.name.toLowerCase()).join(" ") ?? "";
            const title = p.title.toLowerCase();
            return (
              cat.includes("flight") ||
              cat.includes("gps") ||
              cat.includes("telemetry") ||
              title.includes("fc") ||
              title.includes("pixhawk") ||
              title.includes("gps") ||
              p.metadata?.component_type === "FLIGHT_CONTROLLER" ||
              p.metadata?.component_type === "GPS"
            );
          })
          .slice(0, 8);

      case "featured":
      default:
        return products.slice(0, 8);
    }
  }, [products, activeTab]);

  return (
    <section aria-labelledby="featured-hardware-heading">
      <div className="flex flex-col gap-4 border-b border-border pb-3.5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-brand">
            <Sparkles className="h-3 w-3" aria-hidden />
            Curated Inventory
          </div>
          <h2
            id="featured-hardware-heading"
            className="text-[clamp(1.4rem,1.1rem+1vw,1.75rem)] font-extrabold tracking-[-0.02em] text-navy"
          >
            Verified Drone Hardware
          </h2>
        </div>

        {/* Tab Controls */}
        <div className="flex flex-wrap gap-1.5 sm:justify-end">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-md px-3 py-1.5 text-[13px] font-bold transition-all ${
                  isActive
                    ? "bg-navy text-white shadow-sm"
                    : "bg-surface-soft text-text-secondary hover:bg-white hover:text-navy border border-border"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Product Grid */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
        {filteredProducts.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>

      {/* Bottom CTA bar */}
      <div className="mt-6 flex justify-center">
        <Link
          href="/parts"
          className="inline-flex h-11 items-center gap-2 rounded-md border border-border bg-white px-6 text-[14px] font-bold text-navy shadow-sm transition-all hover:border-brand hover:bg-brand-soft"
        >
          Explore All Components in Store
          <ArrowRight className="h-4 w-4 text-brand" aria-hidden />
        </Link>
      </div>
    </section>
  );
}
