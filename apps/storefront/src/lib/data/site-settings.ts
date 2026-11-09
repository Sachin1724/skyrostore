import { unstable_cache } from "next/cache";
import { medusa } from "@/lib/medusa";

export type SiteSettings = { gstin: string; freeShippingThreshold: number };

// Shown until the admin saves real values.
export const DEFAULT_SETTINGS: SiteSettings = {
  gstin: "21AAECS9821R1ZM",
  freeShippingThreshold: 500000, // Rs 5,000 in paise
};

async function fetchSettings(): Promise<SiteSettings> {
  const data = await medusa.client.fetch<{ gstin: string | null; freeShippingThreshold: number | null }>("/store/settings");
  return {
    gstin: data.gstin || DEFAULT_SETTINGS.gstin,
    freeShippingThreshold: data.freeShippingThreshold ?? DEFAULT_SETTINGS.freeShippingThreshold,
  };
}

const cached = unstable_cache(fetchSettings, ["site-settings"], { revalidate: 3600, tags: ["site-settings"] });

/** Published business settings; the admin's save clears the "site-settings" tag. A failed fetch is not cached. */
export const getSiteSettings = () => cached().catch(() => DEFAULT_SETTINGS);
