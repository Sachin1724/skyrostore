import { SkyroLogo } from "@/components/brand/logo";
import type { Seller } from "@/lib/data/site-settings";

// Indian GST state codes for the seller's own state, read from the first two digits of the GSTIN.
const STATES: Record<string, string> = { "21": "Odisha", "27": "Maharashtra", "29": "Karnataka", "07": "Delhi", "33": "Tamil Nadu", "36": "Telangana", "19": "West Bengal", "24": "Gujarat", "09": "Uttar Pradesh" };

/** The seller on a tax invoice. Every line comes from admin Settings; an empty field is left out. */
export function SellerBlock({ seller }: { seller: Seller }) {
  const code = seller.gstin.slice(0, 2);
  return (
    <div>
      <SkyroLogo variant="full" className="mb-3 !h-16" />
      <span className="text-[18px] font-extrabold tracking-tight text-navy">{seller.legalName || "Skyrostore"}</span>
      <p className="mt-1 whitespace-pre-line text-[13px] leading-relaxed text-text-secondary">
        {seller.address ? <>{seller.address}<br /></> : null}
        {seller.gstin ? (
          <>
            <strong>GSTIN:</strong> {seller.gstin}
            <br />
            {STATES[code] ? <><strong>State:</strong> {STATES[code]} (Code: {code})<br /></> : null}
          </>
        ) : null}
        {seller.email ? <>{seller.email}<br /></> : null}
        {seller.phone ? seller.phone : null}
      </p>
    </div>
  );
}
