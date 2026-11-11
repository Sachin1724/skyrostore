import { unstable_cache } from "next/cache";
import { medusa } from "@/lib/medusa";

export type Offer = { code: string; label: string };

export type SiteSettings = {
  gstin: string;
  freeShippingThreshold: number;
  /** Cheapest delivery price in paise; 0 means every order already ships free. null = unknown. */
  deliveryCharge: number | null;
  /** Active codes the admin chose to show on product pages. */
  offers: Offer[];
};

// Shown until the admin saves real values.
export const DEFAULT_SETTINGS: SiteSettings = {
  gstin: "21AAECS9821R1ZM",
  freeShippingThreshold: 500000, // Rs 5,000 in paise
  deliveryCharge: null,
  offers: [],
};

async function fetchSettings(): Promise<SiteSettings> {
  const data = await medusa.client.fetch<{ gstin: string | null; freeShippingThreshold: number | null; deliveryCharge?: number | null; offers?: Offer[] }>("/store/settings");
  return {
    gstin: data.gstin || DEFAULT_SETTINGS.gstin,
    freeShippingThreshold: data.freeShippingThreshold ?? DEFAULT_SETTINGS.freeShippingThreshold,
    deliveryCharge: data.deliveryCharge ?? null,
    offers: data.offers ?? [],
  };
}

const cached = unstable_cache(fetchSettings, ["site-settings"], { revalidate: 3600, tags: ["site-settings"] });

/** Published business settings; the admin's save clears the "site-settings" tag. A failed fetch is not cached. */
export const getSiteSettings = () => cached().catch(() => DEFAULT_SETTINGS);
