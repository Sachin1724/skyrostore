import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

type Offer = { code: string; label: string };

// Business settings the admin edits (store metadata, same mechanism as site-content).
// Payment keys are never stored here — they stay in backend env vars.
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const { data } = await query.graph({ entity: "store", fields: ["metadata"] });
  const metadata = (data[0]?.metadata as Record<string, unknown> | null) ?? {};
  const settings = metadata.site_settings as { gstin?: string; freeShippingThreshold?: number } | undefined;

  // Codes the admin chose to show shoppers ("Show on product pages"), only while active.
  const publicIds = Array.isArray(metadata.public_offers) ? (metadata.public_offers as string[]) : [];
  let offers: Offer[] = [];
  if (publicIds.length) {
    const { data: promos } = await query.graph({
      entity: "promotion",
      fields: ["id", "code", "status", "application_method.type", "application_method.value", "application_method.target_type"],
      filters: { id: publicIds },
    });
    offers = promos
      .filter((p: any) => p.status === "active" && p.application_method)
      .map((p: any) => {
        const am = p.application_method;
        const amount = am.type === "percentage" ? `${am.value}% off` : `₹${Number(am.value).toLocaleString("en-IN")} off`;
        return { code: p.code, label: `${amount} ${am.target_type === "order" ? "your order" : "eligible items"}` };
      });
  }

  // What delivery costs today: the cheapest flat shipping price. 0 means every order ships free,
  // so the storefront must not promise "free delivery above ₹x".
  const { data: options } = await query.graph({ entity: "shipping_option", fields: ["price_type", "prices.amount"] });
  const flat = options
    .filter((o: any) => o.price_type === "flat")
    .flatMap((o: any) => (o.prices ?? []).map((p: any) => Number(p.amount)))
    .filter((n: number) => Number.isFinite(n));

  res.json({
    gstin: settings?.gstin || null,
    freeShippingThreshold: typeof settings?.freeShippingThreshold === "number" ? settings.freeShippingThreshold : null,
    deliveryCharge: flat.length ? Math.min(...flat) : null,
    offers,
  });
}
