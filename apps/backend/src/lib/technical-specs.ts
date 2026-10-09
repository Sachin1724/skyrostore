/**
 * Technical Specifications Architecture for Skyrostore UAV Platform
 *
 * Provides:
 * 1. Canonical engineering specifications consumed by the compatibility engine.
 * 2. Component-specific templates with typed validation & documented units.
 * 3. Additional custom display specifications with groups and visibility controls.
 * 4. Backward-compatible adapters to/from flat Medusa metadata.
 */

export type TechnicalSpecificationValue = string | number | boolean;

export interface TechnicalSpecificationField {
  key: string;
  label: string;
  value: TechnicalSpecificationValue;
  unit?: string;
  group?: string; // "Electrical" | "Mechanical" | "Dimensions" | "Performance" | "Compatibility" | "General"
  displayOrder: number;
  visible: boolean;
}

export interface ProductTechnicalSpecifications {
  schemaVersion: number;
  componentType: string;
  fields: Record<string, unknown>; // Canonical fields for compatibility
  additionalSpecifications: TechnicalSpecificationField[]; // Public display fields
}

export interface SpecificationTemplateField {
  key: string;
  label: string;
  unit?: string;
  group: "Electrical" | "Mechanical" | "Dimensions" | "Performance" | "Compatibility" | "General";
  type: "number" | "string" | "boolean";
  isCanonical: boolean; // If true, consumed by compatibility engine
  required?: boolean;
  min?: number;
  max?: number;
  description?: string;
}

export interface ComponentSpecificationTemplate {
  componentType: string;
  label: string;
  fields: SpecificationTemplateField[];
}

export const COMPONENT_SPEC_TEMPLATES: Record<string, ComponentSpecificationTemplate> = {
  MOTOR: {
    componentType: "MOTOR",
    label: "Brushless Motor",
    fields: [
      { key: "kv", label: "KV Rating", unit: "RPM/V", group: "Performance", type: "number", isCanonical: true, required: true, min: 50, max: 10000 },
      { key: "max_current_a", label: "Maximum Continuous Current", unit: "A", group: "Electrical", type: "number", isCanonical: true, min: 1, max: 250 },
      { key: "recommended_voltage_min_v", label: "Rated Voltage Min", unit: "V", group: "Electrical", type: "number", isCanonical: true, min: 1, max: 100 },
      { key: "recommended_voltage_max_v", label: "Rated Voltage Max", unit: "V", group: "Electrical", type: "number", isCanonical: true, min: 1, max: 100 },
      { key: "weight_g", label: "Motor Weight", unit: "g", group: "Mechanical", type: "number", isCanonical: true, required: true, min: 1, max: 5000 },
      { key: "recommended_propeller_min_in", label: "Rec. Propeller Min Diameter", unit: "in", group: "Compatibility", type: "number", isCanonical: true, min: 2, max: 40 },
      { key: "recommended_propeller_max_in", label: "Rec. Propeller Max Diameter", unit: "in", group: "Compatibility", type: "number", isCanonical: true, min: 2, max: 40 },
      { key: "continuous_power_w", label: "Max Continuous Power", unit: "W", group: "Electrical", type: "number", isCanonical: false, min: 10 },
      { key: "burst_current_a", label: "Peak / Burst Current", unit: "A", group: "Electrical", type: "number", isCanonical: false },
      { key: "shaft_diameter_mm", label: "Shaft Diameter", unit: "mm", group: "Mechanical", type: "number", isCanonical: false },
      { key: "stator_size", label: "Stator Dimensions", group: "Mechanical", type: "string", isCanonical: false },
      { key: "mounting_holes_mm", label: "Mounting Pattern", group: "Mechanical", type: "string", isCanonical: false },
    ],
  },
  PROPELLER: {
    componentType: "PROPELLER",
    label: "Propeller",
    fields: [
      { key: "diameter_in", label: "Diameter", unit: "in", group: "Dimensions", type: "number", isCanonical: true, required: true, min: 2, max: 50 },
      { key: "pitch_in", label: "Pitch", unit: "in", group: "Dimensions", type: "number", isCanonical: true, required: true, min: 1, max: 30 },
      { key: "weight_g", label: "Weight (per prop)", unit: "g", group: "Mechanical", type: "number", isCanonical: true, required: true, min: 0.1, max: 1000 },
      { key: "blade_count", label: "Blade Count", group: "Mechanical", type: "number", isCanonical: false, min: 2, max: 6 },
      { key: "material", label: "Blade Material", group: "Mechanical", type: "string", isCanonical: false },
      { key: "shaft_diameter_mm", label: "Mounting Hole Diameter", unit: "mm", group: "Mechanical", type: "number", isCanonical: false },
      { key: "max_rpm", label: "Maximum Safe RPM", unit: "RPM", group: "Performance", type: "number", isCanonical: false },
      { key: "rotation", label: "Rotation Set", group: "General", type: "string", isCanonical: false },
    ],
  },
  ESC: {
    componentType: "ESC",
    label: "Electronic Speed Controller (ESC)",
    fields: [
      { key: "continuous_current_a", label: "Continuous Current", unit: "A", group: "Electrical", type: "number", isCanonical: true, required: true, min: 5, max: 300 },
      { key: "peak_current_a", label: "Peak / Burst Current", unit: "A", group: "Electrical", type: "number", isCanonical: true, min: 5, max: 400 },
      { key: "cell_count_min", label: "Input LiPo Cells Min", unit: "S", group: "Electrical", type: "number", isCanonical: true, required: true, min: 1, max: 14 },
      { key: "cell_count_max", label: "Input LiPo Cells Max", unit: "S", group: "Electrical", type: "number", isCanonical: true, required: true, min: 1, max: 14 },
      { key: "weight_g", label: "Weight", unit: "g", group: "Mechanical", type: "number", isCanonical: true, required: true, min: 1, max: 1000 },
      { key: "firmware", label: "Firmware Type", group: "General", type: "string", isCanonical: false },
      { key: "channels", label: "Output Channels", group: "Electrical", type: "number", isCanonical: false },
      { key: "protocols", label: "Supported Protocols", group: "Performance", type: "string", isCanonical: false },
      { key: "bec_output", label: "BEC Output", group: "Electrical", type: "string", isCanonical: false },
      { key: "dimensions_mm", label: "Dimensions", unit: "mm", group: "Dimensions", type: "string", isCanonical: false },
    ],
  },
  BATTERY: {
    componentType: "BATTERY",
    label: "Battery Pack",
    fields: [
      { key: "cell_count", label: "Cell Count (S)", unit: "S", group: "Electrical", type: "number", isCanonical: true, required: true, min: 1, max: 16 },
      { key: "voltage_v", label: "Nominal Voltage", unit: "V", group: "Electrical", type: "number", isCanonical: true, required: true, min: 3.7, max: 70 },
      { key: "capacity_mah", label: "Capacity", unit: "mAh", group: "Electrical", type: "number", isCanonical: true, required: true, min: 100, max: 100000 },
      { key: "continuous_discharge_a", label: "Continuous Discharge Current", unit: "A", group: "Electrical", type: "number", isCanonical: true, min: 1, max: 1000 },
      { key: "weight_g", label: "Pack Weight", unit: "g", group: "Mechanical", type: "number", isCanonical: true, required: true, min: 10, max: 20000 },
      { key: "c_rating", label: "Discharge Rating (C)", unit: "C", group: "Performance", type: "number", isCanonical: false },
      { key: "chemistry", label: "Battery Chemistry", group: "General", type: "string", isCanonical: false },
      { key: "connector", label: "Main Connector", group: "Mechanical", type: "string", isCanonical: false },
      { key: "dimensions_mm", label: "Dimensions", unit: "mm", group: "Dimensions", type: "string", isCanonical: false },
    ],
  },
  FRAME: {
    componentType: "FRAME",
    label: "UAV Airframe / Frame Kit",
    fields: [
      { key: "motor_count", label: "Rotor / Motor Count", group: "Compatibility", type: "number", isCanonical: true, required: true, min: 3, max: 12 },
      { key: "wheelbase_mm", label: "Wheelbase (Diagonal)", unit: "mm", group: "Dimensions", type: "number", isCanonical: true, required: true, min: 50, max: 3000 },
      { key: "max_propeller_size_in", label: "Max Propeller Clearance", unit: "in", group: "Compatibility", type: "number", isCanonical: true, required: true, min: 2, max: 50 },
      { key: "max_takeoff_weight_g", label: "Max Takeoff Weight (MTOW)", unit: "g", group: "Performance", type: "number", isCanonical: true, required: true, min: 100, max: 100000 },
      { key: "weight_g", label: "Empty Frame Weight", unit: "g", group: "Mechanical", type: "number", isCanonical: true, required: true, min: 10, max: 25000 },
      { key: "arm_material", label: "Arm Material", group: "Mechanical", type: "string", isCanonical: false },
      { key: "center_plate", label: "Center Plate Material", group: "Mechanical", type: "string", isCanonical: false },
      { key: "stack_mount_pattern_mm", label: "FC Mount Pattern", unit: "mm", group: "Dimensions", type: "string", isCanonical: false },
      { key: "motor_mount_pattern_mm", label: "Motor Mount Pattern", unit: "mm", group: "Dimensions", type: "string", isCanonical: false },
    ],
  },
  FLIGHT_CONTROLLER: {
    componentType: "FLIGHT_CONTROLLER",
    label: "Flight Controller (Autopilot)",
    fields: [
      { key: "weight_g", label: "Unit Weight", unit: "g", group: "Mechanical", type: "number", isCanonical: true, required: true, min: 1, max: 500 },
      { key: "processor", label: "Processor / MCU", group: "Performance", type: "string", isCanonical: false },
      { key: "firmware_support", label: "Supported Firmware", group: "General", type: "string", isCanonical: false },
      { key: "imu_count", label: "IMU Redundancy", group: "Performance", type: "string", isCanonical: false },
      { key: "uart_count", label: "UART Interfaces", group: "Electrical", type: "number", isCanonical: false },
      { key: "can_ports", label: "CAN / DroneCAN Ports", group: "Electrical", type: "number", isCanonical: false },
      { key: "barometer", label: "Barometer Sensor", group: "Performance", type: "string", isCanonical: false },
      { key: "mounting_mm", label: "Mounting Pattern", unit: "mm", group: "Dimensions", type: "string", isCanonical: false },
    ],
  },
  GPS: {
    componentType: "GPS",
    label: "GNSS / GPS Module",
    fields: [
      { key: "weight_g", label: "Weight", unit: "g", group: "Mechanical", type: "number", isCanonical: true, required: true, min: 1, max: 300 },
      { key: "constellations", label: "Supported Constellations", group: "Performance", type: "string", isCanonical: false },
      { key: "update_rate_hz", label: "Update Rate", unit: "Hz", group: "Performance", type: "number", isCanonical: false },
      { key: "accuracy_m", label: "Positioning Accuracy", unit: "m", group: "Performance", type: "number", isCanonical: false },
      { key: "compass", label: "Integrated Compass", group: "Electrical", type: "string", isCanonical: false },
      { key: "interface", label: "Interface Protocol", group: "Electrical", type: "string", isCanonical: false },
    ],
  },
  COMPLETE_UAV: {
    componentType: "COMPLETE_UAV",
    label: "Complete UAV System",
    fields: [
      { key: "weight_g", label: "Dry Weight", unit: "g", group: "Mechanical", type: "number", isCanonical: true, required: true },
      { key: "uav_class", label: "UAV Category / Class", group: "General", type: "string", isCanonical: false },
      { key: "max_takeoff_weight_g", label: "Max Takeoff Weight (MTOW)", unit: "g", group: "Performance", type: "number", isCanonical: false },
      { key: "flight_time_min", label: "Rated Flight Time", unit: "min", group: "Performance", type: "number", isCanonical: false },
      { key: "wheelbase_mm", label: "Wheelbase", unit: "mm", group: "Dimensions", type: "number", isCanonical: false },
      { key: "frame_material", label: "Frame Material", group: "Mechanical", type: "string", isCanonical: false },
      { key: "max_speed_kmh", label: "Max Speed", unit: "km/h", group: "Performance", type: "number", isCanonical: false },
      { key: "operating_range_km", label: "Operational Range", unit: "km", group: "Performance", type: "number", isCanonical: false },
    ],
  },
};

/**
 * Validates and normalizes canonical fields for a given component type
 */
export function validateCanonicalSpecs(
  componentType: string,
  rawFields: Record<string, unknown>
): { valid: boolean; errors: string[]; fields: Record<string, unknown> } {
  const template = COMPONENT_SPEC_TEMPLATES[componentType];
  const errors: string[] = [];
  const normalized: Record<string, unknown> = { component_type: componentType };

  if (!template) {
    // Generic component
    if (rawFields.weight_g !== undefined && rawFields.weight_g !== null) {
      const w = Number(rawFields.weight_g);
      if (isNaN(w) || w < 0) {
        errors.push("Weight must be a non-negative number");
      } else {
        normalized.weight_g = w;
      }
    }
    return { valid: errors.length === 0, errors, fields: { ...rawFields, ...normalized } };
  }

  for (const field of template.fields) {
    const rawVal = rawFields[field.key];
    if (rawVal === undefined || rawVal === null || rawVal === "") {
      if (field.required) {
        errors.push(`Field '${field.label}' (${field.key}) is required`);
      }
      continue;
    }

    if (field.type === "number") {
      const numVal = Number(rawVal);
      if (isNaN(numVal)) {
        errors.push(`Field '${field.label}' must be a valid number`);
        continue;
      }
      if (field.min !== undefined && numVal < field.min) {
        errors.push(`Field '${field.label}' must be at least ${field.min}${field.unit ? " " + field.unit : ""}`);
        continue;
      }
      if (field.max !== undefined && numVal > field.max) {
        errors.push(`Field '${field.label}' cannot exceed ${field.max}${field.unit ? " " + field.unit : ""}`);
        continue;
      }
      normalized[field.key] = numVal;
    } else if (field.type === "boolean") {
      normalized[field.key] = Boolean(rawVal);
    } else {
      normalized[field.key] = String(rawVal).trim();
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    fields: normalized,
  };
}

/**
 * Parses and synthesizes a full ProductTechnicalSpecifications structure
 * from product metadata, supporting both versioned and legacy flat metadata.
 */
export function extractTechnicalSpecs(
  metadata?: Record<string, unknown> | null
): ProductTechnicalSpecifications | null {
  if (!metadata) return null;

  // 1. If modern structured technical_specs already exists:
  if (
    metadata.technical_specs &&
    typeof metadata.technical_specs === "object" &&
    "schemaVersion" in (metadata.technical_specs as Record<string, unknown>)
  ) {
    const ts = metadata.technical_specs as ProductTechnicalSpecifications;
    return {
      schemaVersion: ts.schemaVersion || 1,
      componentType: ts.componentType || (metadata.component_type as string) || "GENERIC",
      fields: ts.fields || {},
      additionalSpecifications: Array.isArray(ts.additionalSpecifications) ? ts.additionalSpecifications : [],
    };
  }

  // 2. Synthesize from legacy flat metadata
  const componentType = (metadata.component_type as string) ||
    (metadata.uav_class ? "COMPLETE_UAV" : null);

  if (!componentType) return null;

  const template = COMPONENT_SPEC_TEMPLATES[componentType];
  const fields: Record<string, unknown> = { component_type: componentType };
  const additionalSpecifications: TechnicalSpecificationField[] = [];
  let order = 1;

  for (const [key, val] of Object.entries(metadata)) {
    if (key === "technical_specs" || key === "sku" || key === "id") continue;
    if (val === undefined || val === null || val === "") continue;

    // Check if it matches a template definition
    const matched = template?.fields.find((f) => f.key === key);
    if (matched) {
      if (matched.type === "number") {
        const num = Number(val);
        if (!isNaN(num)) {
          fields[key] = num;
        }
      } else {
        fields[key] = String(val);
      }
      additionalSpecifications.push({
        key,
        label: matched.label,
        value: matched.type === "number" ? Number(val) : String(val),
        unit: matched.unit,
        group: matched.group,
        displayOrder: order++,
        visible: true,
      });
    } else {
      // General field
      fields[key] = val;
      const label = key
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
      additionalSpecifications.push({
        key,
        label,
        value: typeof val === "number" || typeof val === "boolean" ? val : String(val),
        group: "General",
        displayOrder: order++,
        visible: true,
      });
    }
  }

  return {
    schemaVersion: 1,
    componentType,
    fields,
    additionalSpecifications,
  };
}

/**
 * Synchronizes technical_specs and flat canonical keys in product metadata
 * so compatibility engine and legacy consumers remain 100% compatible.
 */
export function serializeMetadataWithSpecs(
  existingMetadata: Record<string, unknown> | null | undefined,
  specs: ProductTechnicalSpecifications
): Record<string, unknown> {
  const metadata: Record<string, unknown> = { ...(existingMetadata || {}) };

  // Store the versioned authoritative structure
  metadata.technical_specs = specs;
  metadata.component_type = specs.componentType;

  // Mirror canonical fields to root metadata for compatibility engine backward-compatibility
  for (const [k, v] of Object.entries(specs.fields)) {
    metadata[k] = v;
  }

  // Also mirror visible additional specs to flat metadata
  for (const item of specs.additionalSpecifications) {
    if (item.visible && metadata[item.key] === undefined) {
      metadata[item.key] = item.value;
    }
  }

  return metadata;
}
