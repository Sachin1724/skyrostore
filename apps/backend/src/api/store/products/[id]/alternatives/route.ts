import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { parseSpec } from "../../../../../lib/compatibility/engine";
import type { ComponentSpec, MotorSpec, ESCSpec, BatterySpec } from "../../../../../lib/compatibility/types";

const FIELDS = ["id", "title", "handle", "thumbnail", "metadata", "variants.inventory_quantity", "variants.manage_inventory"];

function inStock(product: any): boolean {
  return (product.variants ?? []).some((v: any) => !v.manage_inventory || Number(v.inventory_quantity ?? 0) > 0);
}

/**
 * Drop-in in-stock replacements for an out-of-stock component. Only the three
 * types with a defined tolerance rule (motor/ESC/battery) get real matching;
 * everything else falls back to "same component type, in stock" — no invented
 * tolerance for specs this engine doesn't actually model.
 */
function isCompatible(target: ComponentSpec, candidate: ComponentSpec): { ok: boolean; why: string } {
  if (target.component_type !== candidate.component_type) return { ok: false, why: "" };

  if (target.component_type === "MOTOR") {
    const t = target as MotorSpec;
    const c = candidate as MotorSpec;
    const kvDiffPct = Math.abs(c.kv - t.kv) / t.kv;
    const ok = kvDiffPct <= 0.1 && c.recommended_voltage_max_v >= t.recommended_voltage_max_v;
    const sign = c.kv >= t.kv ? "+" : "";
    return { ok, why: `${c.kv}KV (${sign}${c.kv - t.kv}KV)` };
  }

  if (target.component_type === "ESC") {
    const t = target as ESCSpec;
    const c = candidate as ESCSpec;
    const ok = c.continuous_current_a >= t.continuous_current_a && c.cell_count_max >= t.cell_count_max;
    return { ok, why: `${c.continuous_current_a}A · up to ${c.cell_count_max}S` };
  }

  if (target.component_type === "BATTERY") {
    const t = target as BatterySpec;
    const c = candidate as BatterySpec;
    const capacityDiffPct = Math.abs(c.capacity_mah - t.capacity_mah) / t.capacity_mah;
    const ok = c.cell_count === t.cell_count && capacityDiffPct <= 0.15 && c.continuous_discharge_a >= t.continuous_discharge_a;
    return { ok, why: `${c.cell_count}S · ${c.capacity_mah}mAh · ${c.continuous_discharge_a}A` };
  }

  // No modelled tolerance for this type — same type and in stock is the whole bar.
  return { ok: true, why: "Same component type" };
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params;
  const limit = Math.min(Number(req.query.limit) || 6, 20);
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  try {
    // query.graph bypasses the publishable-key/sales-channel scoping the store
    // SDK applies — filter to published products explicitly, or a draft/unreleased
    // product's title and thumbnail leak to an unauthenticated visitor by id.
    const { data: targets } = await query.graph({ entity: "product", fields: FIELDS, filters: { id, status: "published" } });
    const target = targets?.[0];
    if (!target) return res.status(404).json({ error: "Product not found" });

    const targetSpec = parseSpec((target.metadata as Record<string, unknown>) || {});
    if (!targetSpec) return res.json({ alternatives: [] });

    const { data: candidates } = await query.graph({
      entity: "product",
      fields: FIELDS,
      filters: { status: "published" },
      pagination: { take: 500, skip: 0 },
    });

    const alternatives = (candidates || [])
      .filter((p: any) => p.id !== id && inStock(p))
      .map((p: any) => {
        const spec = parseSpec((p.metadata as Record<string, unknown>) || {});
        if (!spec) return null;
        const match = isCompatible(targetSpec, spec);
        if (!match.ok) return null;
        return {
          id: p.id,
          title: (p.title as string)?.replace("[DEV] ", ""),
          handle: p.handle,
          thumbnail: p.thumbnail,
          matched: match.why,
          kv_diff: targetSpec.component_type === "MOTOR" ? Math.abs((spec as MotorSpec).kv - (targetSpec as MotorSpec).kv) : 0,
        };
      })
      .filter((a): a is NonNullable<typeof a> => a !== null)
      .sort((a, b) => a.kv_diff - b.kv_diff)
      .slice(0, limit)
      .map(({ kv_diff, ...a }) => a);

    return res.json({ component_type: targetSpec.component_type, alternatives });
  } catch (error) {
    console.error("Error finding alternatives:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
