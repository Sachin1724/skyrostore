import { describe, it, expect } from "vitest";
import { applyFacets, buildFacets } from "../apps/storefront/src/lib/technical-specs";

const motors = [
  { id: "a", metadata: { component_type: "MOTOR", kv: "400", stator_size: "5010" } },
  { id: "b", metadata: { component_type: "MOTOR", kv: "1750", stator_size: "2207" } },
  { id: "c", metadata: { component_type: "MOTOR", kv: "400", stator_size: "2207" } },
];

describe("shop by spec facets", () => {
  it("builds motor facets in buyer order, numeric values sorted", () => {
    const facets = buildFacets(motors);
    expect(facets.map((f) => f.key)).toEqual(["kv", "stator_size"]);
    expect(facets[0].values).toEqual([
      { value: "400", count: 2 },
      { value: "1750", count: 1 },
    ]);
  });

  it("filters on every selected value", () => {
    expect(applyFacets(motors, { kv: "400" }).map((p) => p.id)).toEqual(["a", "c"]);
    expect(applyFacets(motors, { kv: "400", stator_size: "2207" }).map((p) => p.id)).toEqual(["c"]);
    expect(applyFacets(motors, {})).toHaveLength(3);
  });

  it("ignores products without a known component type", () => {
    expect(buildFacets([{ metadata: { kv: "400" } }])).toEqual([]);
  });
});
