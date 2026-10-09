/**
 * Technical Specifications Architecture for Skyrostore UAV Platform (Admin)
 */

export type TechnicalSpecificationValue = string | number | boolean;

export interface TechnicalSpecificationField {
  key: string;
  label: string;
  value: TechnicalSpecificationValue;
  unit?: string;
  group?: string;
  displayOrder: number;
  visible: boolean;
}

export interface ProductTechnicalSpecifications {
  schemaVersion: number;
  componentType: string;
  fields: Record<string, unknown>;
  additionalSpecifications: TechnicalSpecificationField[];
}

export interface SpecificationTemplateField {
  key: string;
  label: string;
  unit?: string;
  group: "Electrical" | "Mechanical" | "Dimensions" | "Performance" | "Compatibility" | "General";
  type: "number" | "string" | "boolean";
  isCanonical: boolean;
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
      { key: "continuous_power_w", label: "Max Continuous Power", unit: "W", group: "Electrical", type: "number", isCanonical: false },
      { key: "shaft_diameter_mm", label: "Shaft Diameter", unit: "mm", group: "Mechanical", type: "number", isCanonical: false },
      { key: "stator_size", label: "Stator Dimensions", group: "Mechanical", type: "string", isCanonical: false },
    ],
  },
  PROPELLER: {
    componentType: "PROPELLER",
    label: "Propeller",
    fields: [
      { key: "diameter_in", label: "Diameter", unit: "in", group: "Dimensions", type: "number", isCanonical: true, required: true, min: 2, max: 50 },
      { key: "pitch_in", label: "Pitch", unit: "in", group: "Dimensions", type: "number", isCanonical: true, required: true, min: 1, max: 30 },
      { key: "weight_g", label: "Weight (per prop)", unit: "g", group: "Mechanical", type: "number", isCanonical: true, required: true, min: 0.1, max: 1000 },
      { key: "blade_count", label: "Blade Count", group: "Mechanical", type: "number", isCanonical: false },
      { key: "material", label: "Blade Material", group: "Mechanical", type: "string", isCanonical: false },
      { key: "shaft_diameter_mm", label: "Mounting Hole Diameter", unit: "mm", group: "Mechanical", type: "number", isCanonical: false },
    ],
  },
  ESC: {
    componentType: "ESC",
    label: "Electronic Speed Controller (ESC)",
    fields: [
      { key: "continuous_current_a", label: "Continuous Current", unit: "A", group: "Electrical", type: "number", isCanonical: true, required: true, min: 5, max: 300 },
      { key: "peak_current_a", label: "Peak Current", unit: "A", group: "Electrical", type: "number", isCanonical: true, min: 5, max: 400 },
      { key: "cell_count_min", label: "Input LiPo Cells Min", unit: "S", group: "Electrical", type: "number", isCanonical: true, required: true, min: 1, max: 14 },
      { key: "cell_count_max", label: "Input LiPo Cells Max", unit: "S", group: "Electrical", type: "number", isCanonical: true, required: true, min: 1, max: 14 },
      { key: "weight_g", label: "Weight", unit: "g", group: "Mechanical", type: "number", isCanonical: true, required: true, min: 1, max: 1000 },
      { key: "firmware", label: "Firmware Type", group: "General", type: "string", isCanonical: false },
      { key: "protocols", label: "Supported Protocols", group: "Performance", type: "string", isCanonical: false },
    ],
  },
  BATTERY: {
    componentType: "BATTERY",
    label: "Battery Pack",
    fields: [
      { key: "cell_count", label: "Cell Count (S)", unit: "S", group: "Electrical", type: "number", isCanonical: true, required: true, min: 1, max: 16 },
      { key: "voltage_v", label: "Nominal Voltage", unit: "V", group: "Electrical", type: "number", isCanonical: true, required: true, min: 3.7, max: 70 },
      { key: "capacity_mah", label: "Capacity", unit: "mAh", group: "Electrical", type: "number", isCanonical: true, required: true, min: 100, max: 100000 },
      { key: "continuous_discharge_a", label: "Continuous Discharge", unit: "A", group: "Electrical", type: "number", isCanonical: true, min: 1, max: 1000 },
      { key: "weight_g", label: "Pack Weight", unit: "g", group: "Mechanical", type: "number", isCanonical: true, required: true, min: 10, max: 20000 },
      { key: "connector", label: "Main Connector", group: "Mechanical", type: "string", isCanonical: false },
    ],
  },
  FRAME: {
    componentType: "FRAME",
    label: "Airframe Kit",
    fields: [
      { key: "motor_count", label: "Rotor / Motor Count", group: "Compatibility", type: "number", isCanonical: true, required: true, min: 3, max: 12 },
      { key: "wheelbase_mm", label: "Wheelbase", unit: "mm", group: "Dimensions", type: "number", isCanonical: true, required: true, min: 50, max: 3000 },
      { key: "max_propeller_size_in", label: "Max Propeller Clearance", unit: "in", group: "Compatibility", type: "number", isCanonical: true, required: true, min: 2, max: 50 },
      { key: "max_takeoff_weight_g", label: "Max Takeoff Weight (MTOW)", unit: "g", group: "Performance", type: "number", isCanonical: true, required: true, min: 100, max: 100000 },
      { key: "weight_g", label: "Empty Frame Weight", unit: "g", group: "Mechanical", type: "number", isCanonical: true, required: true, min: 10, max: 25000 },
      { key: "arm_material", label: "Arm Material", group: "Mechanical", type: "string", isCanonical: false },
    ],
  },
  FLIGHT_CONTROLLER: {
    componentType: "FLIGHT_CONTROLLER",
    label: "Flight Controller",
    fields: [
      { key: "weight_g", label: "Unit Weight", unit: "g", group: "Mechanical", type: "number", isCanonical: true, required: true, min: 1, max: 500 },
      { key: "processor", label: "Processor / MCU", group: "Performance", type: "string", isCanonical: false },
      { key: "firmware_support", label: "Supported Firmware", group: "General", type: "string", isCanonical: false },
      { key: "imu_count", label: "IMU Redundancy", group: "Performance", type: "string", isCanonical: false },
      { key: "uart_count", label: "UART Interfaces", group: "Electrical", type: "number", isCanonical: false },
    ],
  },
  GPS: {
    componentType: "GPS",
    label: "GPS Module",
    fields: [
      { key: "weight_g", label: "Weight", unit: "g", group: "Mechanical", type: "number", isCanonical: true, required: true, min: 1, max: 300 },
      { key: "constellations", label: "Supported Constellations", group: "Performance", type: "string", isCanonical: false },
      { key: "update_rate_hz", label: "Update Rate", unit: "Hz", group: "Performance", type: "number", isCanonical: false },
      { key: "accuracy_m", label: "Accuracy", unit: "m", group: "Performance", type: "number", isCanonical: false },
      { key: "compass", label: "Compass Sensor", group: "Electrical", type: "string", isCanonical: false },
    ],
  },
  COMPLETE_UAV: {
    componentType: "COMPLETE_UAV",
    label: "Complete UAV",
    fields: [
      { key: "weight_g", label: "Dry Weight", unit: "g", group: "Mechanical", type: "number", isCanonical: true, required: true },
      { key: "uav_class", label: "Class", group: "General", type: "string", isCanonical: false },
      { key: "max_takeoff_weight_g", label: "MTOW", unit: "g", group: "Performance", type: "number", isCanonical: false },
      { key: "flight_time_min", label: "Flight Time", unit: "min", group: "Performance", type: "number", isCanonical: false },
      { key: "wheelbase_mm", label: "Wheelbase", unit: "mm", group: "Dimensions", type: "number", isCanonical: false },
    ],
  },
};

export function extractTechnicalSpecs(
  metadata?: Record<string, unknown> | null
): ProductTechnicalSpecifications | null {
  if (!metadata) return null;

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
      additionalSpecifications: Array.isArray(ts.additionalSpecifications)
        ? ts.additionalSpecifications
        : [],
    };
  }

  const componentType = (metadata.component_type as string) ||
    (metadata.uav_class ? "COMPLETE_UAV" : null);

  if (!componentType) return null;

  const template = COMPONENT_SPEC_TEMPLATES[componentType];
  const fields: Record<string, unknown> = { component_type: componentType };
  const additionalSpecifications: TechnicalSpecificationField[] = [];
  let order = 1;

  for (const [key, val] of Object.entries(metadata)) {
    if (key === "technical_specs" || key === "sku" || key === "id" || key === "thumbnail") continue;
    if (val === undefined || val === null || val === "") continue;

    const matched = template?.fields.find((f) => f.key === key);
    if (matched) {
      const numVal = matched.type === "number" ? Number(val) : NaN;
      const parsedVal = !isNaN(numVal) ? numVal : String(val);
      fields[key] = parsedVal;
      additionalSpecifications.push({
        key,
        label: matched.label,
        value: parsedVal,
        unit: matched.unit,
        group: matched.group,
        displayOrder: order++,
        visible: true,
      });
    } else {
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

export function serializeMetadataWithSpecs(
  existingMetadata: Record<string, unknown> | null | undefined,
  specs: ProductTechnicalSpecifications
): Record<string, unknown> {
  const metadata: Record<string, unknown> = { ...(existingMetadata || {}) };

  metadata.technical_specs = specs;
  metadata.component_type = specs.componentType;

  for (const [k, v] of Object.entries(specs.fields)) {
    metadata[k] = v;
  }

  for (const item of specs.additionalSpecifications) {
    if (item.visible && metadata[item.key] === undefined) {
      metadata[item.key] = item.value;
    }
  }

  return metadata;
}
