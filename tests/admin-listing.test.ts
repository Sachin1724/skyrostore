import { describe, expect, it } from "vitest";
import { parseListing, readListing } from "../apps/admin/src/lib/listing";

describe("parseListing", () => {
  it("cleans lists and keeps valid fields", () => {
    const r = parseListing({ key_features: [" A ", "", "B"], in_the_box: ["1 × unit"], gst_rate: "18", dispatch_days: "2", hsn_code: "85015210" });
    expect("listing" in r && r.listing).toMatchObject({ key_features: ["A", "B"], in_the_box: ["1 × unit"], gst_rate: 18, dispatch_days: 2 });
  });
  it("treats empty numbers as not set", () => {
    const r = parseListing({ key_features: [], in_the_box: [], gst_rate: "", dispatch_days: "" });
    expect("listing" in r && r.listing.gst_rate).toBe(null);
    expect("listing" in r && r.listing.dispatch_days).toBe(null);
  });
  it.each([
    [{ key_features: [], in_the_box: [], gst_rate: 10 }, "GST"],
    [{ key_features: [], in_the_box: [], hsn_code: "12" }, "HSN"],
    [{ key_features: [], in_the_box: [], dispatch_days: 1.5 }, "Dispatch"],
    [{ key_features: [], in_the_box: [], video_url: "http://x" }, "Video"],
    [{ key_features: [], in_the_box: [], documents: [{ url: "javascript:alert(1)" }] }, "document"],
    [{ key_features: "x", in_the_box: [] }, "lists"],
  ])("rejects %o", (input, word) => {
    const r = parseListing(input);
    expect("error" in r && r.error).toContain(word);
  });
  it("reads missing listing as empty", () => {
    expect(readListing({}).key_features).toEqual([]);
  });
});
