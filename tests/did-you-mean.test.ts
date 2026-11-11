import { describe, it, expect } from "vitest";
import { didYouMean } from "../apps/storefront/src/lib/search/did-you-mean";
import { singular, wordForms } from "../apps/storefront/src/lib/search/domain-parser";

const vocab = ["T-Motor U5 KV400", "Motors", "Propellers", "Pixhawk 6C Mini", "LiPo 6S 5000mAh 50C", "Batteries"];

describe("didYouMean", () => {
  it("corrects a one-letter typo", () => expect(didYouMean("moter", vocab)).toBe("motor"));
  it("corrects each word and keeps spec tokens", () => expect(didYouMean("pixhwak 6s", vocab)).toBe("pixhawk 6s"));
  it("finds a hyphenated name typed without the hyphen", () => expect(didYouMean("tmotor", vocab)).toBe("t-motor"));
  it("returns null when every word is known", () => expect(didYouMean("pixhawk mini", vocab)).toBeNull());
  it("returns null when nothing is close", () => expect(didYouMean("toaster", vocab)).toBeNull());
});

describe("query word forms", () => {
  it("makes plurals singular but leaves spec tokens", () => {
    expect(singular("motors")).toBe("motor");
    expect(singular("batteries")).toBe("battery");
    expect(singular("6s")).toBe("6s");
    expect(singular("gps")).toBe("gps");
  });
  it("adds the catalogue's word for everyday terms", () => {
    expect(wordForms("drones")).toContain("quadcopter");
    expect(wordForms("props")).toContain("propeller");
    expect(wordForms("fc")).toContain("flight controller");
  });
});
