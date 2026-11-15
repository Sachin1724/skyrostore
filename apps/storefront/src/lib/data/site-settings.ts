import { unstable_cache } from "next/cache";
import { medusa } from "@/lib/medusa";

export type Offer = { code: string; label: string };

/** Who sells: printed on every tax invoice and in the footer. Every field comes from admin Settings. */
export type Seller = { legalName: string; address: string; gstin: string; phone: string; email: string };

export type SiteSettings = {
  /** Kept for callers that only need the GSTIN; same value as seller.gstin. */
  gstin: string;
  seller: Seller;
  freeShippingThreshold: number;
  /** Cheapest delivery price in paise; 0 means every order already ships free. null = unknown. */
  deliveryCharge: number | null;
  /** Active codes the admin chose to show on product pages. */
  offers: Offer[];
};

// Until the admin saves real values. Nothing here is invented: an empty field is simply not printed.
export const DEFAULT_SETTINGS: SiteSettings = {
  gstin: "",
  seller: { legalName: "", address: "", gstin: "", phone: "", email: "support@skyrostore.com" },
  freeShippingThreshold: 500000, // Rs 5,000 in paise
  deliveryCharge: null,
  offers: [],
};

type Raw = {
  gstin: string | null;
  legalName?: string | null;
  address?: string | null;
  phone?: string | null;
  supportEmail?: string | null;
  freeShippingThreshold: number | null;
  deliveryCharge?: number | null;
  offers?: Offer[];
};

async function fetchSettings(): Promise<SiteSettings> {
  const data = await medusa.client.fetch<Raw>("/store/settings");
  const seller: Seller = {
    legalName: data.legalName || "",
    address: data.address || "",
    gstin: data.gstin || "",
    phone: data.phone || "",
    email: data.supportEmail || DEFAULT_SETTINGS.seller.email,
  };
  return {
    gstin: seller.gstin,
    seller,
    freeShippingThreshold: data.freeShippingThreshold ?? DEFAULT_SETTINGS.freeShippingThreshold,
    deliveryCharge: data.deliveryCharge ?? null,
    offers: data.offers ?? [],
  };
}

const cached = unstable_cache(fetchSettings, ["site-settings"], { revalidate: 3600, tags: ["site-settings"] });

/** Published business settings; the admin's save clears the "site-settings" tag. A failed fetch is not cached. */
export const getSiteSettings = () => cached().catch(() => DEFAULT_SETTINGS);
