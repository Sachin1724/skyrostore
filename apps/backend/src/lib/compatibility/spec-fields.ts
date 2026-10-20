export interface SpecFieldDef {
  key: string;
  label: string;
  unit: string;
  type: "number" | "text";
  required: boolean;
  min?: number;
  max?: number;
  canonical: boolean; // consumed by compatibility engine
  customer_visible: boolean;
}

export const COMPONENT_SPEC_FIELDS: Record<string, SpecFieldDef[]> = {
  FRAME: [
    { key: "weight_g", label: "Weight", unit: "g", type: "number", required: true, min: 1, max: 50000, canonical: true, customer_visible: true },
    { key: "motor_count", label: "Motor Count", unit: "", type: "number", required: true, min: 1, max: 12, canonical: true, customer_visible: true },
    { key: "wheelbase_mm", label: "Wheelbase", unit: "mm", type: "number", required: false, min: 50, max: 5000, canonical: true, customer_visible: true },
    { key: "max_propeller_size_in", label: "Max Propeller Size", unit: "in", type: "number", required: true, min: 1, max: 50, canonical: true, customer_visible: true },
    { key: "max_takeoff_weight_g", label: "Max Takeoff Weight", unit: "g", type: "number", required: true, min: 100, max: 100000, canonical: true, customer_visible: true },
    { key: "frame_material", label: "Frame Material", unit: "", type: "text", required: false, canonical: false, customer_visible: true },
    { key: "internal_batch_code", label: "Batch Code", unit: "", type: "text", required: false, canonical: false, customer_visible: false },
  ],
  FLIGHT_CONTROLLER: [
    { key: "weight_g", label: "Weight", unit: "g", type: "number", required: true, min: 1, max: 500, canonical: true, customer_visible: true },
    { key: "processor", label: "Processor", unit: "", type: "text", required: false, canonical: false, customer_visible: true },
    { key: "imu_count", label: "IMU Count", unit: "", type: "number", required: false, min: 1, max: 10, canonical: false, customer_visible: true },
    { key: "uart_count", label: "UART Count", unit: "", type: "number", required: false, min: 0, max: 20, canonical: false, customer_visible: true },
    { key: "firmware_support", label: "Firmware Support", unit: "", type: "text", required: false, canonical: false, customer_visible: true },
  ],
  ESC: [
    { key: "weight_g", label: "Weight", unit: "g", type: "number", required: true, min: 1, max: 1000, canonical: true, customer_visible: true },
    { key: "continuous_current_a", label: "Continuous Current", unit: "A", type: "number", required: true, min: 1, max: 500, canonical: true, customer_visible: true },
    { key: "peak_current_a", label: "Peak Current", unit: "A", type: "number", required: false, min: 1, max: 600, canonical: true, customer_visible: true },
    { key: "cell_count_min", label: "Min Cell Count", unit: "S", type: "number", required: true, min: 1, max: 14, canonical: true, customer_visible: true },
    { key: "cell_count_max", label: "Max Cell Count", unit: "S", type: "number", required: true, min: 1, max: 14, canonical: true, customer_visible: true },
    { key: "firmware", label: "Firmware", unit: "", type: "text", required: false, canonical: false, customer_visible: true },
    { key: "protocol", label: "Protocol", unit: "", type: "text", required: false, canonical: false, customer_visible: true },
  ],
  MOTOR: [
    { key: "weight_g", label: "Weight", unit: "g", type: "number", required: true, min: 1, max: 5000, canonical: true, customer_visible: true },
    { key: "kv", label: "KV Rating", unit: "KV", type: "number", required: true, min: 1, max: 10000, canonical: true, customer_visible: true },
    { key: "max_current_a", label: "Max Current", unit: "A", type: "number", required: true, min: 1, max: 500, canonical: true, customer_visible: true },
    { key: "recommended_voltage_min_v", label: "Min Voltage", unit: "V", type: "number", required: false, min: 1, max: 100, canonical: true, customer_visible: true },
    { key: "recommended_voltage_max_v", label: "Max Voltage", unit: "V", type: "number", required: false, min: 1, max: 100, canonical: true, customer_visible: true },
    { key: "recommended_propeller_min_in", label: "Min Propeller", unit: "in", type: "number", required: false, min: 1, max: 50, canonical: true, customer_visible: true },
    { key: "recommended_propeller_max_in", label: "Max Propeller", unit: "in", type: "number", required: false, min: 1, max: 50, canonical: true, customer_visible: true },
    { key: "stator_diameter_mm", label: "Stator Diameter", unit: "mm", type: "number", required: false, min: 1, max: 200, canonical: false, customer_visible: true },
    { key: "stator_height_mm", label: "Stator Height", unit: "mm", type: "number", required: false, min: 1, max: 100, canonical: false, customer_visible: true },
    { key: "internal_batch_code", label: "Batch Code", unit: "", type: "text", required: false, canonical: false, customer_visible: false },
    { key: "qa_test_result", label: "QA Result", unit: "", type: "text", required: false, canonical: false, customer_visible: false },
  ],
  PROPELLER: [
    { key: "weight_g", label: "Weight", unit: "g", type: "number", required: true, min: 1, max: 1000, canonical: true, customer_visible: true },
    { key: "diameter_in", label: "Diameter", unit: "in", type: "number", required: true, min: 1, max: 50, canonical: true, customer_visible: true },
    { key: "pitch_in", label: "Pitch", unit: "in", type: "number", required: true, min: 0.5, max: 30, canonical: true, customer_visible: true },
    { key: "blade_count", label: "Blade Count", unit: "", type: "number", required: false, min: 2, max: 8, canonical: false, customer_visible: true },
    { key: "material", label: "Material", unit: "", type: "text", required: false, canonical: false, customer_visible: true },
  ],
  BATTERY: [
    { key: "weight_g", label: "Weight", unit: "g", type: "number", required: true, min: 1, max: 20000, canonical: true, customer_visible: true },
    { key: "cell_count", label: "Cell Count", unit: "S", type: "number", required: true, min: 1, max: 14, canonical: true, customer_visible: true },
    { key: "voltage_v", label: "Voltage", unit: "V", type: "number", required: true, min: 1, max: 60, canonical: true, customer_visible: true },
    { key: "capacity_mah", label: "Capacity", unit: "mAh", type: "number", required: true, min: 100, max: 100000, canonical: true, customer_visible: true },
    { key: "continuous_discharge_a", label: "Continuous Discharge", unit: "A", type: "number", required: true, min: 1, max: 1000, canonical: true, customer_visible: true },
    { key: "chemistry", label: "Chemistry", unit: "", type: "text", required: false, canonical: false, customer_visible: true },
    { key: "c_rating", label: "C Rating", unit: "C", type: "number", required: false, min: 1, max: 200, canonical: false, customer_visible: true },
    { key: "internal_batch_code", label: "Batch Code", unit: "", type: "text", required: false, canonical: false, customer_visible: false },
  ],
  GPS: [
    { key: "weight_g", label: "Weight", unit: "g", type: "number", required: true, min: 1, max: 500, canonical: true, customer_visible: true },
    { key: "constellation", label: "Constellation", unit: "", type: "text", required: false, canonical: false, customer_visible: true },
    { key: "update_rate_hz", label: "Update Rate", unit: "Hz", type: "number", required: false, min: 1, max: 100, canonical: false, customer_visible: true },
  ],
  RECEIVER: [
    { key: "weight_g", label: "Weight", unit: "g", type: "number", required: false, min: 0, max: 500, canonical: true, customer_visible: true },
    { key: "protocol", label: "Protocol", unit: "", type: "text", required: false, canonical: false, customer_visible: true },
    { key: "frequency_mhz", label: "Frequency", unit: "MHz", type: "number", required: false, min: 1, max: 10000, canonical: false, customer_visible: true },
  ],
  TELEMETRY: [
    { key: "weight_g", label: "Weight", unit: "g", type: "number", required: false, min: 0, max: 500, canonical: true, customer_visible: true },
    { key: "range_km", label: "Range", unit: "km", type: "number", required: false, min: 0, max: 100, canonical: false, customer_visible: true },
    { key: "frequency_mhz", label: "Frequency", unit: "MHz", type: "number", required: false, min: 1, max: 10000, canonical: false, customer_visible: true },
  ],
  CAMERA: [
    { key: "weight_g", label: "Weight", unit: "g", type: "number", required: false, min: 0, max: 5000, canonical: true, customer_visible: true },
    { key: "resolution", label: "Resolution", unit: "", type: "text", required: false, canonical: false, customer_visible: true },
    { key: "sensor_size", label: "Sensor Size", unit: "", type: "text", required: false, canonical: false, customer_visible: true },
  ],
  PAYLOAD: [
    { key: "weight_g", label: "Weight", unit: "g", type: "number", required: false, min: 0, max: 50000, canonical: true, customer_visible: true },
    { key: "payload_type", label: "Type", unit: "", type: "text", required: false, canonical: false, customer_visible: true },
  ],
  POWER_MODULE: [
    { key: "weight_g", label: "Weight", unit: "g", type: "number", required: false, min: 0, max: 1000, canonical: true, customer_visible: true },
    { key: "max_current_a", label: "Max Current", unit: "A", type: "number", required: false, min: 1, max: 500, canonical: false, customer_visible: true },
    { key: "voltage_range", label: "Voltage Range", unit: "", type: "text", required: false, canonical: false, customer_visible: true },
  ],
};

export function validateSpecField(field: SpecFieldDef, value: string | undefined): string | null {
  if (!value && value !== "0") {
    return field.required ? `${field.label} is required` : null;
  }
  if (field.type === "number") {
    const n = Number(value);
    if (isNaN(n)) return `${field.label} must be a number`;
    if (field.min !== undefined && n < field.min) return `${field.label} must be at least ${field.min}`;
    if (field.max !== undefined && n > field.max) return `${field.label} must be at most ${field.max}`;
  }
  return null;
}

export function validateSpecs(
  componentType: string,
  specs: Record<string, string>
): { valid: boolean; errors: Record<string, string> } {
  const fields = COMPONENT_SPEC_FIELDS[componentType];
  if (!fields) return { valid: true, errors: {} };

  const errors: Record<string, string> = {};
  for (const field of fields) {
    const err = validateSpecField(field, specs[field.key]);
    if (err) errors[field.key] = err;
  }
  return { valid: Object.keys(errors).length === 0, errors };
}

const _internalKeysCache = new Set<string>();
function getInternalKeys(): Set<string> {
  if (_internalKeysCache.size > 0) return _internalKeysCache;
  for (const fields of Object.values(COMPONENT_SPEC_FIELDS)) {
    for (const f of fields) {
      if (!f.customer_visible) _internalKeysCache.add(f.key);
    }
  }
  return _internalKeysCache;
}

export function filterPublicMetadata(
  metadata: Record<string, unknown> | null | undefined
): Record<string, unknown> | null {
  if (!metadata) return null;
  const internal = getInternalKeys();
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (!internal.has(key)) result[key] = value;
  }
  return result;
}
