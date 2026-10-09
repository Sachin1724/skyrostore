import { describe, it, expect } from "vitest";
import { parseSpec, validate } from "../apps/backend/src/lib/compatibility/engine";
import type {
  FrameSpec,
  ESCSpec,
  MotorSpec,
  PropellerSpec,
  BatterySpec,
} from "../apps/backend/src/lib/compatibility/types";

// Valid reference configuration
const FRAME: FrameSpec = {
  component_type: "FRAME",
  motor_count: 4,
  wheelbase_mm: 450,
  max_propeller_size_in: 15,
  max_takeoff_weight_g: 2500,
  weight_g: 320,
};

const MOTOR: MotorSpec = {
  component_type: "MOTOR",
  kv: 400,
  max_current_a: 25,
  recommended_voltage_min_v: 14.8,
  recommended_voltage_max_v: 25.2,
  weight_g: 95,
  recommended_propeller_min_in: 13,
  recommended_propeller_max_in: 17,
};

const ESC: ESCSpec = {
  component_type: "ESC",
  continuous_current_a: 50,
  peak_current_a: 55,
  cell_count_min: 3,
  cell_count_max: 6,
  weight_g: 62,
};

const PROPELLER: PropellerSpec = {
  component_type: "PROPELLER",
  diameter_in: 15,
  pitch_in: 5.5,
  weight_g: 21,
};

const BATTERY: BatterySpec = {
  component_type: "BATTERY",
  cell_count: 6,
  voltage_v: 22.2,
  capacity_mah: 5000,
  continuous_discharge_a: 250,
  weight_g: 680,
};

const FC = { component_type: "FLIGHT_CONTROLLER" as const, weight_g: 38 };
const GPS = { component_type: "GPS" as const, weight_g: 25 };

describe("parseSpec", () => {
  it("parses FRAME metadata", () => {
    const spec = parseSpec({ component_type: "FRAME", weight_g: "320", motor_count: "4", max_propeller_size_in: "15", max_takeoff_weight_g: "2500" });
    expect(spec).toMatchObject({ component_type: "FRAME", motor_count: 4, max_propeller_size_in: 15, weight_g: 320 });
  });

  it("parses MOTOR metadata", () => {
    const spec = parseSpec({ component_type: "MOTOR", weight_g: "95", kv: "400", max_current_a: "25" });
    expect(spec).toMatchObject({ component_type: "MOTOR", kv: 400, max_current_a: 25 });
  });

  it("returns null for missing component_type", () => {
    expect(parseSpec({ weight_g: "100" })).toBeNull();
  });

  it("handles unknown component types as generic", () => {
    const spec = parseSpec({ component_type: "RECEIVER", weight_g: "15" });
    expect(spec).toMatchObject({ component_type: "RECEIVER", weight_g: 15 });
  });

  it("defaults missing numeric values to 0", () => {
    const spec = parseSpec({ component_type: "MOTOR" });
    expect(spec).toMatchObject({ component_type: "MOTOR", kv: 0, weight_g: 0 });
  });
});

describe("validate — valid configuration", () => {
  it("passes with compatible components", () => {
    const result = validate({
      frame: FRAME,
      flight_controller: FC,
      esc: ESC,
      motor: MOTOR,
      propeller: PROPELLER,
      battery: BATTERY,
      gps: GPS,
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("calculates weight estimate", () => {
    const result = validate({ frame: FRAME, motor: MOTOR, esc: ESC, propeller: PROPELLER, battery: BATTERY, flight_controller: FC, gps: GPS });
    expect(result.estimates.weight_g).toBeGreaterThan(0);
    expect(result.estimates.weight_g).toBeLessThan(FRAME.max_takeoff_weight_g);
  });

  it("calculates flight time estimate", () => {
    const result = validate({ frame: FRAME, motor: MOTOR, battery: BATTERY, flight_controller: FC });
    expect(result.estimates.flight_time_min).toBeGreaterThan(0);
    expect(result.estimates.flight_time_min).toBeLessThan(60);
  });

  it("calculates payload capacity", () => {
    const result = validate({ frame: FRAME, motor: MOTOR, esc: ESC, propeller: PROPELLER, battery: BATTERY, flight_controller: FC, gps: GPS });
    expect(result.estimates.payload_capacity_g).toBeGreaterThan(0);
  });
});

describe("validate — voltage mismatch", () => {
  it("errors when battery voltage outside motor range", () => {
    const lowBattery: BatterySpec = { ...BATTERY, voltage_v: 11.1, cell_count: 3 };
    const result = validate({ frame: FRAME, motor: MOTOR, battery: lowBattery });
    const motorVoltage = result.checks.find((c) => c.code === "MOTOR_VOLTAGE_MISMATCH");
    expect(motorVoltage).toBeDefined();
    expect(motorVoltage!.severity).toBe("ERROR");
  });

  it("errors when battery cells outside ESC range", () => {
    const twoCellBattery: BatterySpec = { ...BATTERY, cell_count: 2, voltage_v: 7.4 };
    const result = validate({ esc: ESC, battery: twoCellBattery });
    const escVoltage = result.checks.find((c) => c.code === "BATTERY_VOLTAGE_EXCEEDED");
    expect(escVoltage).toBeDefined();
    expect(escVoltage!.severity).toBe("ERROR");
  });
});

describe("validate — current-limit mismatch", () => {
  it("errors when motor current exceeds ESC rating", () => {
    const weakESC: ESCSpec = { ...ESC, continuous_current_a: 20 };
    const result = validate({ motor: MOTOR, esc: weakESC });
    const currentCheck = result.checks.find((c) => c.code === "ESC_CURRENT_INSUFFICIENT");
    expect(currentCheck).toBeDefined();
    expect(currentCheck!.severity).toBe("ERROR");
  });

  it("warns when motor current above 80% of ESC rating", () => {
    const marginalESC: ESCSpec = { ...ESC, continuous_current_a: 30 };
    const result = validate({ motor: MOTOR, esc: marginalESC });
    const currentCheck = result.checks.find((c) => c.code === "ESC_CURRENT_MARGINAL");
    expect(currentCheck).toBeDefined();
    expect(currentCheck!.severity).toBe("WARNING");
  });
});

describe("validate — propeller size", () => {
  it("errors when propeller exceeds frame max", () => {
    const bigProp: PropellerSpec = { ...PROPELLER, diameter_in: 18 };
    const result = validate({ frame: FRAME, propeller: bigProp });
    expect(result.checks.find((c) => c.code === "PROPELLER_TOO_LARGE")).toBeDefined();
  });

  it("errors when propeller outside motor recommended range", () => {
    const smallProp: PropellerSpec = { ...PROPELLER, diameter_in: 10 };
    const result = validate({ motor: MOTOR, propeller: smallProp });
    expect(result.checks.find((c) => c.code === "PROPELLER_MOTOR_MISMATCH")).toBeDefined();
  });
});

describe("validate — weight limits", () => {
  it("errors when total weight exceeds frame limit", () => {
    const heavyBattery: BatterySpec = { ...BATTERY, weight_g: 3000 };
    const result = validate({ frame: FRAME, battery: heavyBattery, motor: MOTOR, propeller: PROPELLER });
    expect(result.checks.find((c) => c.code === "OVERWEIGHT")).toBeDefined();
    expect(result.valid).toBe(false);
  });

  it("warns when weight above 90% of frame limit", () => {
    const heavyBattery: BatterySpec = { ...BATTERY, weight_g: 1200 };
    const result = validate({ frame: FRAME, battery: heavyBattery, motor: MOTOR, esc: ESC, propeller: PROPELLER, flight_controller: FC });
    const weightCheck = result.checks.find((c) => c.code === "WEIGHT_MARGINAL");
    expect(weightCheck).toBeDefined();
    expect(weightCheck!.severity).toBe("WARNING");
  });
});

describe("validate — payload limits", () => {
  it("errors when payload causes overweight", () => {
    const result = validate({
      frame: FRAME,
      motor: MOTOR,
      esc: ESC,
      propeller: PROPELLER,
      battery: BATTERY,
      flight_controller: FC,
      gps: GPS,
      payload_grams: 2000,
    });
    expect(result.checks.find((c) => c.code === "PAYLOAD_EXCEEDED" || c.code === "OVERWEIGHT")).toBeDefined();
    expect(result.valid).toBe(false);
  });
});

describe("validate — missing components", () => {
  it("warns about missing required components", () => {
    const result = validate({ frame: FRAME });
    const missing = result.checks.filter((c) => c.code.startsWith("MISSING_"));
    expect(missing.length).toBeGreaterThanOrEqual(4);
    expect(missing.every((c) => c.severity === "WARNING")).toBe(true);
  });

  it("does not warn about missing optional components", () => {
    const result = validate({ frame: FRAME, motor: MOTOR, esc: ESC, propeller: PROPELLER, battery: BATTERY, flight_controller: FC });
    const missingGPS = result.checks.find((c) => c.code === "MISSING_GPS");
    expect(missingGPS).toBeUndefined();
  });
});

describe("validate — price calculation", () => {
  it("calculates total price with motor/propeller quantities", () => {
    const result = validate({
      frame: FRAME,
      motor: MOTOR,
      esc: ESC,
      propeller: PROPELLER,
      battery: BATTERY,
      flight_controller: FC,
      gps: GPS,
      prices: { frame: 6499, motor: 5999, esc: 7499, propeller: 2499, battery: 8999, flight_controller: 14999, gps: 4999 },
    });
    // frame + FC + ESC + battery + GPS = 1 each, motors x4, propellers x2
    const expected = 6499 + 14999 + 7499 + 8999 + 4999 + 5999 * 4 + 2499 * 2;
    expect(result.estimates.price).toBe(expected);
  });
});

describe("validate — invalid product references", () => {
  it("returns valid true with empty prices (no products to check)", () => {
    const result = validate({ frame: FRAME, motor: MOTOR, esc: ESC, propeller: PROPELLER, battery: BATTERY, flight_controller: FC });
    expect(result.valid).toBe(true);
  });
});
