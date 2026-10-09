import { medusa } from "@/lib/medusa";

const REGION_ID = process.env.NEXT_PUBLIC_REGION_ID || "reg_01M4EBVQ7AW00SGW5JEMPAABK3";

export type UAVComponent = {
  id: string;
  title: string;
  handle: string;
  variant_id: string;
  component_type: string;
  price: number | null;
  currency_code: string;
  weight_g: number | null;
  metadata: Record<string, string>;
};

export async function getUAVComponents(): Promise<Record<string, UAVComponent[]>> {
  const { products } = await medusa.store.product.list({
    limit: 100,
    region_id: REGION_ID,
    fields: "+variants.calculated_price",
  });

  const grouped: Record<string, UAVComponent[]> = {};

  for (const p of products) {
    const meta = p.metadata as Record<string, string> | null;
    const componentType = meta?.component_type;
    if (!componentType) continue;

    const variant = p.variants?.[0];
    if (!variant) continue;

    const price = (variant as unknown as Record<string, unknown>).calculated_price as {
      calculated_amount?: number;
      currency_code?: string;
    } | null;

    const component: UAVComponent = {
      id: p.id,
      title: p.title,
      handle: p.handle ?? "",
      variant_id: variant.id,
      component_type: componentType,
      price: price?.calculated_amount ?? null,
      currency_code: price?.currency_code ?? "inr",
      weight_g: meta?.weight_g ? Number(meta.weight_g) : null,
      metadata: meta ?? {},
    };

    if (!grouped[componentType]) grouped[componentType] = [];
    grouped[componentType].push(component);
  }

  return grouped;
}
