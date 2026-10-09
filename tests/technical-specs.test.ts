import { describe, it, expect } from "vitest";
import {
  validateCanonicalSpecs,
  extractTechnicalSpecs,
  serializeMetadataWithSpecs,
  COMPONENT_SPEC_TEMPLATES,
  type ProductTechnicalSpecifications,
} from "../apps/backend/src/lib/technical-specs";
import { parseSpec, validate } from "../apps/backend/src/lib/compatibility/engine";

describe("Technical Specifications Architecture", () => {
  describe("validateCanonicalSpecs", () => {
    it("validates and normalizes valid motor specifications", () => {
      const result = validateCanonicalSpecs("MOTOR", {
        kv: "400",
        max_current_a: 30,
        recommended_voltage_min_v: 22.2,
        recommended_voltage_max_v: 25.2,
        weight_g: 156,
        recommended_propeller_min_in: 15,
        recommended_propeller_max_in: 18,
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.fields.kv).toBe(400);
      expect(result.fields.weight_g).toBe(156);
      expect(result.fields.component_type).toBe("MOTOR");
    });

    it("rejects out-of-range numeric values", () => {
      const result = validateCanonicalSpecs("MOTOR", {
        kv: 20, // min is 50
        weight_g: -5, // min is 1
      });

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some((e) => e.includes("KV Rating"))).toBe(true);
      expect(result.errors.some((e) => e.includes("Motor Weight"))).toBe(true);
    });

    it("rejects non-numeric values for typed numeric fields", () => {
      const result = validateCanonicalSpecs("BATTERY", {
        cell_count: "six-s",
        voltage_v: "high",
        capacity_mah: "five-thousand",
        weight_g: 680,
      });

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("Cell Count"))).toBe(true);
      expect(result.errors.some((e) => e.includes("Nominal Voltage"))).toBe(true);
    });

    it("requires required canonical fields", () => {
      const result = validateCanonicalSpecs("FRAME", {
        // Missing required motor_count, wheelbase_mm, max_propeller_size_in, max_takeoff_weight_g, weight_g
      });

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe("extractTechnicalSpecs", () => {
    it("extracts from versioned technical_specs metadata", () => {
      const versionedSpecs: ProductTechnicalSpecifications = {
        schemaVersion: 1,
        componentType: "MOTOR",
        fields: {
          kv: 400,
          weight_g: 156,
          max_current_a: 30,
        },
        additionalSpecifications: [
          {
            key: "stator_size",
            label: "Stator Size",
            value: "4014",
            unit: "mm",
            group: "Mechanical",
            displayOrder: 1,
            visible: true,
          },
          {
            key: "internal_notes",
            label: "Internal Admin Note",
            value: "Batch #4 test passed",
            group: "Admin",
            displayOrder: 2,
            visible: false,
          },
        ],
      };

      const extracted = extractTechnicalSpecs({
        technical_specs: versionedSpecs,
        component_type: "MOTOR",
      });

      expect(extracted).not.toBeNull();
      expect(extracted?.schemaVersion).toBe(1);
      expect(extracted?.componentType).toBe("MOTOR");
      expect(extracted?.fields.kv).toBe(400);
      expect(extracted?.additionalSpecifications).toHaveLength(2);
    });

    it("synthesizes structured specifications from legacy flat metadata", () => {
      const legacyMetadata = {
        component_type: "BATTERY",
        cell_count: "6",
        voltage_v: "22.2",
        capacity_mah: "5000",
        continuous_discharge_a: "250",
        connector: "XT60",
        weight_g: "680",
      };

      const extracted = extractTechnicalSpecs(legacyMetadata);
      expect(extracted).not.toBeNull();
      expect(extracted?.componentType).toBe("BATTERY");
      expect(extracted?.fields.cell_count).toBe(6);
      expect(extracted?.fields.capacity_mah).toBe(5000);
      expect(extracted?.fields.weight_g).toBe(680);

      // Verify template groups were matched
      const cellField = extracted?.additionalSpecifications.find((s) => s.key === "cell_count");
      expect(cellField?.label).toBe("Cell Count (S)");
      expect(cellField?.unit).toBe("S");
      expect(cellField?.group).toBe("Electrical");
    });

    it("returns null when no component type or uav_class exists", () => {
      expect(extractTechnicalSpecs({})).toBeNull();
      expect(extractTechnicalSpecs(null)).toBeNull();
      expect(extractTechnicalSpecs({ generic_info: "value" })).toBeNull();
    });
  });

  describe("serializeMetadataWithSpecs", () => {
    it("mirrors canonical fields and visible additional specs into flat metadata", () => {
      const specs: ProductTechnicalSpecifications = {
        schemaVersion: 1,
        componentType: "ESC",
        fields: {
          continuous_current_a: 50,
          peak_current_a: 60,
          cell_count_min: 3,
          cell_count_max: 6,
          weight_g: 62,
        },
        additionalSpecifications: [
          {
            key: "firmware",
            label: "Firmware",
            value: "BLHeli_32",
            group: "General",
            displayOrder: 1,
            visible: true,
          },
          {
            key: "internal_sku_ref",
            label: "Internal SKU",
            value: "ESC-INT-99",
            group: "Internal",
            displayOrder: 2,
            visible: false,
          },
        ],
      };

      const serialized = serializeMetadataWithSpecs({ existing_flag: true }, specs);
      expect(serialized.existing_flag).toBe(true);
      expect(serialized.component_type).toBe("ESC");
      expect(serialized.continuous_current_a).toBe(50);
      expect(serialized.weight_g).toBe(62);
      expect(serialized.firmware).toBe("BLHeli_32");
      // Hidden specification should NOT be mirrored to root flat metadata
      expect(serialized.internal_sku_ref).toBeUndefined();
      expect(serialized.technical_specs).toBeDefined();
    });
  });

  describe("Compatibility Engine Integration", () => {
    it("parses component specs directly from versioned technical_specs.fields", () => {
      const metadata = {
        technical_specs: {
          schemaVersion: 1,
          componentType: "MOTOR",
          fields: {
            kv: 400,
            max_current_a: 30,
            recommended_voltage_min_v: 22.2,
            recommended_voltage_max_v: 25.2,
            weight_g: 156,
            recommended_propeller_min_in: 15,
            recommended_propeller_max_in: 18,
          },
          additionalSpecifications: [],
        },
      };

      const parsed = parseSpec(metadata);
      expect(parsed).not.toBeNull();
      expect(parsed?.component_type).toBe("MOTOR");
      if (parsed && parsed.component_type === "MOTOR") {
        expect(parsed.kv).toBe(400);
        expect(parsed.weight_g).toBe(156);
        expect(parsed.max_current_a).toBe(30);
      }
    });

    it("runs validation successfully with components parsed from technical_specs", () => {
      const frameMeta = {
        technical_specs: {
          schemaVersion: 1,
          componentType: "FRAME",
          fields: {
            motor_count: 4,
            wheelbase_mm: 450,
            max_propeller_size_in: 15,
            max_takeoff_weight_g: 2500,
            weight_g: 320,
          },
          additionalSpecifications: [],
        },
      };

      const motorMeta = {
        technical_specs: {
          schemaVersion: 1,
          componentType: "MOTOR",
          fields: {
            kv: 400,
            max_current_a: 30,
            recommended_voltage_min_v: 22.2,
            recommended_voltage_max_v: 25.2,
            weight_g: 156,
            recommended_propeller_min_in: 14,
            recommended_propeller_max_in: 16,
          },
          additionalSpecifications: [],
        },
      };

      const escMeta = {
        technical_specs: {
          schemaVersion: 1,
          componentType: "ESC",
          fields: {
            continuous_current_a: 50,
            peak_current_a: 60,
            cell_count_min: 3,
            cell_count_max: 6,
            weight_g: 62,
          },
          additionalSpecifications: [],
        },
      };

      const propMeta = {
        technical_specs: {
          schemaVersion: 1,
          componentType: "PROPELLER",
          fields: {
            diameter_in: 15,
            pitch_in: 5.5,
            weight_g: 28,
          },
          additionalSpecifications: [],
        },
      };

      const batteryMeta = {
        technical_specs: {
          schemaVersion: 1,
          componentType: "BATTERY",
          fields: {
            cell_count: 6,
            voltage_v: 22.2,
            capacity_mah: 5000,
            continuous_discharge_a: 250,
            weight_g: 680,
          },
          additionalSpecifications: [],
        },
      };

      const frame = parseSpec(frameMeta);
      const motor = parseSpec(motorMeta);
      const esc = parseSpec(escMeta);
      const prop = parseSpec(propMeta);
      const battery = parseSpec(batteryMeta);

      const result = validate({
        frame: frame as any,
        motor: motor as any,
        esc: esc as any,
        propeller: prop as any,
        battery: battery as any,
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.estimates.weight_g).toBeGreaterThan(0);
      expect(result.estimates.flight_time_min).toBeGreaterThan(0);
    });
  });
});
