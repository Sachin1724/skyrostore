import { describe, it, expect } from "vitest";
import {
  buildPackingList,
  canPack,
  canShip,
  deriveFulfilmentState,
  validateTracking,
} from "../apps/backend/src/lib/fulfilment";

describe("fulfilment status model", () => {
  it("derives awaiting payment from the order's own payment status", () => {
    for (const payment_status of ["not_paid", "awaiting", "requires_action"]) {
      expect(
        deriveFulfilmentState({ status: "pending", payment_status, fulfillment_status: "not_fulfilled" })
      ).toBe("awaiting_payment");
    }
  });

  it("represents payment failure accurately", () => {
    expect(
      deriveFulfilmentState({ status: "pending", payment_status: "canceled", fulfillment_status: "not_fulfilled" })
    ).toBe("payment_failed");
  });

  it("moves to paid_processing once captured and unfulfilled", () => {
    expect(
      deriveFulfilmentState({ status: "pending", payment_status: "captured", fulfillment_status: "not_fulfilled" })
    ).toBe("paid_processing");
  });

  it("reports packed, shipped and delivered from the fulfilment status", () => {
    expect(
      deriveFulfilmentState({ status: "pending", payment_status: "captured", fulfillment_status: "fulfilled" })
    ).toBe("packed");
    expect(
      deriveFulfilmentState({ status: "pending", payment_status: "captured", fulfillment_status: "partially_fulfilled" })
    ).toBe("packed");
    expect(
      deriveFulfilmentState({ status: "pending", payment_status: "captured", fulfillment_status: "shipped" })
    ).toBe("shipped");
    expect(
      deriveFulfilmentState({ status: "pending", payment_status: "captured", fulfillment_status: "delivered" })
    ).toBe("delivered");
  });

  it("treats a cancelled order as cancelled regardless of other statuses", () => {
    expect(
      deriveFulfilmentState({ status: "canceled", payment_status: "captured", fulfillment_status: "fulfilled" })
    ).toBe("cancelled");
  });

  it("only allows packing from paid_processing and shipping from packed", () => {
    expect(canPack("paid_processing")).toBe(true);
    expect(canPack("awaiting_payment")).toBe(false);
    expect(canPack("packed")).toBe(false);
    expect(canShip("packed")).toBe(true);
    expect(canShip("paid_processing")).toBe(false);
    expect(canShip("shipped")).toBe(false);
  });
});

describe("tracking details", () => {
  it("rejects an empty or partially filled form so opening it ships nothing", () => {
    expect(validateTracking({})).toEqual({ error: "courier is required" });
    expect(validateTracking({ courier: "Delhivery" })).toEqual({ error: "tracking_number is required" });
    expect(validateTracking({ courier: "   ", tracking_number: "ABCD1234" })).toEqual({
      error: "courier is required",
    });
  });

  it("rejects an implausible tracking number", () => {
    expect(validateTracking({ courier: "BlueDart", tracking_number: "AB" })).toHaveProperty("error");
    expect(validateTracking({ courier: "BlueDart", tracking_number: "bad/chars!" })).toHaveProperty("error");
  });

  it("rejects a non-http tracking URL", () => {
    expect(
      validateTracking({ courier: "BlueDart", tracking_number: "ABCD1234", tracking_url: "javascript:alert(1)" })
    ).toHaveProperty("error");
  });

  it("accepts and trims valid details", () => {
    const result = validateTracking({
      courier: "  Delhivery ",
      tracking_number: " ABCD1234567 ",
      tracking_url: "https://track.example/ABCD1234567",
    });
    expect(result).toEqual({
      details: {
        courier: "Delhivery",
        tracking_number: "ABCD1234567",
        tracking_url: "https://track.example/ABCD1234567",
      },
    });
  });
});

describe("packing list", () => {
  it("lists exact items and quantities", () => {
    const list = buildPackingList([
      {
        id: "item_1",
        title: "Pixhawk 6C",
        variant_sku: "PX6C",
        quantity: 3,
        detail: { fulfilled_quantity: 1, shipped_quantity: 0 },
      },
    ]);
    expect(list).toEqual([
      {
        line_item_id: "item_1",
        title: "Pixhawk 6C",
        variant_title: null,
        sku: "PX6C",
        quantity: 3,
        fulfilled_quantity: 1,
        shipped_quantity: 0,
        is_bundle: false,
        bundle_contents: [],
      },
    ]);
  });

  it("expands bundle contents and multiplies by the line quantity", () => {
    const [line] = buildPackingList([
      {
        id: "item_bundle",
        title: "Starter Kit",
        quantity: 2,
        metadata: {
          bundle_contents: [
            { title: "Frame", sku: "FR-1", quantity: 1 },
            { title: "Motor", sku: "MT-1", quantity: 4 },
          ],
        },
      },
    ]);
    expect(line.is_bundle).toBe(true);
    expect(line.bundle_contents).toEqual([
      { title: "Frame", sku: "FR-1", quantity: 2 },
      { title: "Motor", sku: "MT-1", quantity: 8 },
    ]);
  });
});
