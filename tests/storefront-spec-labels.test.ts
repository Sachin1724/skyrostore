import { describe, expect, it } from "vitest";
import { labelFromKey } from "../apps/storefront/src/lib/technical-specs";
import { readListing } from "../apps/storefront/src/lib/listing";

describe("labelFromKey", () => {
  it.each([
    ["max_thrust_g", "Max Thrust", "g"],
    ["idle_current_a", "Idle Current", "A"],
    ["capacity_mah", "Capacity", "mAh"],
    ["kv_rating", "KV Rating", undefined],
    ["poles", "Poles", undefined],
  ])("%s", (key, label, unit) => {
    expect(labelFromKey(key)).toEqual({ label, unit });
  });
});

describe("storefront readListing", () => {
  it("drops malformed values so sections hide", () => {
    const l = readListing({ listing: { key_features: "x", documents: [{ url: "javascript:x" }], video_url: "http://a", gst_rate: "18" } });
    expect(l).toMatchObject({ key_features: [], documents: [], video_url: "", gst_rate: null });
  });
});
