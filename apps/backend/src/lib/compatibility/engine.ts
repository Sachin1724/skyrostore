import type {
  FrameSpec,
  ESCSpec,
  MotorSpec,
  PropellerSpec,
  BatterySpec,
  ComponentSpec,
  CompatibilityCheck,
  CompatibilityEstimates,
  CompatibilityResult,
} from "./types";

function check(
  code: string,
  severity: "PASS" | "WARNING" | "ERROR",
  message: string
): CompatibilityCheck {
  return { code, severity, message };
}

function num(v: unknown): number | null {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}

export function parseSpec(metadata: Record<string, unknown>): ComponentSpec | null {
  const ts = metadata.technical_specs as
    | { fields?: Record<string, unknown>; componentType?: string }
    | undefined;
  const source = ts?.fields
    ? {
        ...metadata,
        ...ts.fields,
        component_type: ts.componentType || metadata.component_type,
      }
    : metadata;

  const ct = (source.component_type as string) || (source.componentType as string);
  if (!ct) return null;

  const w = num(source.weight_g) ?? 0;

  switch (ct) {
    case "FRAME":
      return {
        component_type: "FRAME",
        motor_count: num(source.motor_count) ?? 4,
        wheelbase_mm: num(source.wheelbase_mm) ?? 0,
        max_propeller_size_in: num(source.max_propeller_size_in) ?? 0,
        max_takeoff_weight_g: num(source.max_takeoff_weight_g) ?? 0,
        weight_g: w,
      };
    case "FLIGHT_CONTROLLER":
      return { component_type: "FLIGHT_CONTROLLER", weight_g: w };
    case "ESC":
      return {
        component_type: "ESC",
        continuous_current_a: num(source.continuous_current_a) ?? 0,
        peak_current_a: num(source.peak_current_a) ?? 0,
        cell_count_min: num(source.cell_count_min) ?? 0,
        cell_count_max: num(source.cell_count_max) ?? 0,
        weight_g: w,
      };
    case "MOTOR":
      return {
        component_type: "MOTOR",
        kv: num(source.kv) ?? 0,
        max_current_a: num(source.max_current_a) ?? 0,
        recommended_voltage_min_v: num(source.recommended_voltage_min_v) ?? 0,
        recommended_voltage_max_v: num(source.recommended_voltage_max_v) ?? 0,
        weight_g: w,
        recommended_propeller_min_in: num(source.recommended_propeller_min_in) ?? 0,
        recommended_propeller_max_in: num(source.recommended_propeller_max_in) ?? 0,
      };
    case "PROPELLER":
      return {
        component_type: "PROPELLER",
        diameter_in: num(source.diameter_in) ?? 0,
        pitch_in: num(source.pitch_in) ?? 0,
        weight_g: w,
      };
    case "BATTERY":
      return {
        component_type: "BATTERY",
        cell_count: num(source.cell_count) ?? 0,
        voltage_v: num(source.voltage_v) ?? 0,
        capacity_mah: num(source.capacity_mah) ?? 0,
        continuous_discharge_a: num(source.continuous_discharge_a) ?? 0,
        weight_g: w,
      };
    case "GPS":
      return { component_type: "GPS", weight_g: w };
    default:
      return { component_type: ct, weight_g: w };
  }
}

export function validate(components: {
  frame?: FrameSpec;
  flight_controller?: ComponentSpec;
  esc?: ESCSpec;
  motor?: MotorSpec;
  propeller?: PropellerSpec;
  battery?: BatterySpec;
  gps?: ComponentSpec;
  payload_grams?: number;
  prices?: Record<string, number>;
}): CompatibilityResult {
  const checks: CompatibilityCheck[] = [];
  const { frame, esc, motor, propeller, battery, payload_grams = 0 } = components;

  // Frame + Propeller size
  if (frame && propeller) {
    if (propeller.diameter_in > frame.max_propeller_size_in) {
      checks.push(
        check(
          "PROPELLER_TOO_LARGE",
          "ERROR",
          `Propeller diameter ${propeller.diameter_in}" exceeds frame maximum ${frame.max_propeller_size_in}".`
        )
      );
    } else {
      checks.push(
        check(
          "PROPELLER_SIZE_OK",
          "PASS",
          `Propeller diameter ${propeller.diameter_in}" fits frame (max ${frame.max_propeller_size_in}").`
        )
      );
    }
  }

  // Motor + ESC current
  if (motor && esc) {
    if (motor.max_current_a > esc.continuous_current_a) {
      checks.push(
        check(
          "ESC_CURRENT_INSUFFICIENT",
          "ERROR",
          `Motor max current ${motor.max_current_a}A exceeds ESC continuous rating ${esc.continuous_current_a}A.`
        )
      );
    } else if (motor.max_current_a > esc.continuous_current_a * 0.8) {
      checks.push(
        check(
          "ESC_CURRENT_MARGINAL",
          "WARNING",
          `Motor max current ${motor.max_current_a}A is above 80% of ESC rating ${esc.continuous_current_a}A. Consider higher-rated ESC.`
        )
      );
    } else {
      checks.push(
        check(
          "ESC_CURRENT_OK",
          "PASS",
          `Motor max current ${motor.max_current_a}A within ESC rating ${esc.continuous_current_a}A.`
        )
      );
    }
  }

  // Battery + ESC voltage
  if (battery && esc) {
    if (battery.cell_count < esc.cell_count_min || battery.cell_count > esc.cell_count_max) {
      checks.push(
        check(
          "BATTERY_VOLTAGE_EXCEEDED",
          "ERROR",
          `Battery ${battery.cell_count}S outside ESC supported range ${esc.cell_count_min}S-${esc.cell_count_max}S.`
        )
      );
    } else {
      checks.push(
        check(
          "BATTERY_ESC_VOLTAGE_OK",
          "PASS",
          `Battery ${battery.cell_count}S within ESC range ${esc.cell_count_min}S-${esc.cell_count_max}S.`
        )
      );
    }
  }

  // Battery + Motor voltage
  if (battery && motor) {
    if (
      battery.voltage_v < motor.recommended_voltage_min_v ||
      battery.voltage_v > motor.recommended_voltage_max_v
    ) {
      checks.push(
        check(
          "MOTOR_VOLTAGE_MISMATCH",
          "ERROR",
          `Battery voltage ${battery.voltage_v}V outside motor range ${motor.recommended_voltage_min_v}V-${motor.recommended_voltage_max_v}V.`
        )
      );
    } else {
      checks.push(
        check(
          "MOTOR_VOLTAGE_OK",
          "PASS",
          `Battery voltage ${battery.voltage_v}V within motor range.`
        )
      );
    }
  }

  // Motor + Propeller size
  if (motor && propeller) {
    if (
      propeller.diameter_in < motor.recommended_propeller_min_in ||
      propeller.diameter_in > motor.recommended_propeller_max_in
    ) {
      checks.push(
        check(
          "PROPELLER_MOTOR_MISMATCH",
          "ERROR",
          `Propeller ${propeller.diameter_in}" outside motor recommended range ${motor.recommended_propeller_min_in}"-${motor.recommended_propeller_max_in}".`
        )
      );
    } else {
      checks.push(
        check(
          "PROPELLER_MOTOR_OK",
          "PASS",
          `Propeller ${propeller.diameter_in}" within motor recommended range.`
        )
      );
    }
  }

  // Weight calculation
  const motorCount = frame?.motor_count ?? 4;
  let totalWeight = 0;
  if (frame) totalWeight += frame.weight_g;
  if (components.flight_controller) totalWeight += components.flight_controller.weight_g;
  if (esc) totalWeight += esc.weight_g;
  if (motor) totalWeight += motor.weight_g * motorCount;
  if (propeller) totalWeight += propeller.weight_g * motorCount;
  if (battery) totalWeight += battery.weight_g;
  if (components.gps) totalWeight += components.gps.weight_g;
  // ponytail: 10% wiring estimate, refine with actual wiring weight data if needed
  const wiringEstimate = Math.round(totalWeight * 0.1);
  totalWeight += wiringEstimate;
  totalWeight += payload_grams;

  // Frame weight limit
  if (frame && totalWeight > 0) {
    if (totalWeight > frame.max_takeoff_weight_g) {
      checks.push(
        check(
          "OVERWEIGHT",
          "ERROR",
          `Estimated total weight ${totalWeight}g exceeds frame max takeoff weight ${frame.max_takeoff_weight_g}g.`
        )
      );
    } else if (totalWeight > frame.max_takeoff_weight_g * 0.9) {
      checks.push(
        check(
          "WEIGHT_MARGINAL",
          "WARNING",
          `Estimated total weight ${totalWeight}g is above 90% of frame limit ${frame.max_takeoff_weight_g}g.`
        )
      );
    } else {
      checks.push(
        check("WEIGHT_OK", "PASS", `Estimated total weight ${totalWeight}g within frame limit.`)
      );
    }
  }

  // Payload capacity
  const payloadCapacity = frame ? frame.max_takeoff_weight_g - totalWeight + payload_grams : null;
  if (frame && payload_grams > 0 && payloadCapacity !== null && payloadCapacity < 0) {
    checks.push(
      check(
        "PAYLOAD_EXCEEDED",
        "ERROR",
        `Payload ${payload_grams}g causes overweight. Reduce payload or choose lighter components.`
      )
    );
  }

  // Required-component completeness
  const REQUIRED: Array<[string, keyof typeof components]> = [
    ["Frame", "frame"],
    ["Flight Controller", "flight_controller"],
    ["ESC", "esc"],
    ["Motor", "motor"],
    ["Propeller", "propeller"],
    ["Battery", "battery"],
  ];
  for (const [label, key] of REQUIRED) {
    if (!components[key]) {
      checks.push(check("MISSING_" + key.toUpperCase(), "WARNING", `${label} not selected. Required for a complete configuration.`));
    }
  }

  const errors = checks.filter((c) => c.severity === "ERROR");
  const warnings = checks.filter((c) => c.severity === "WARNING");

  // Estimates
  let flightTime: number | null = null;
  if (battery && motor && totalWeight > 0) {
    // ponytail: simplified hover flight time: battery_Wh * efficiency / hover_power_W * 60
    // ~150W/kg hover power for typical multirotor, 80% discharge limit
    const hoverPowerW = (totalWeight / 1000) * 150;
    const batteryEnergyWh = (battery.capacity_mah / 1000) * battery.voltage_v * 0.8;
    flightTime = hoverPowerW > 0 ? Math.round((batteryEnergyWh / hoverPowerW) * 60) : null;
  }

  let totalPrice: number | null = null;
  if (components.prices) {
    const p = components.prices;
    totalPrice = 0;
    if (p.frame) totalPrice += p.frame;
    if (p.flight_controller) totalPrice += p.flight_controller;
    if (p.esc) totalPrice += p.esc;
    if (p.motor) totalPrice += p.motor * motorCount;
    if (p.propeller) totalPrice += p.propeller * Math.ceil(motorCount / 2);
    if (p.battery) totalPrice += p.battery;
    if (p.gps) totalPrice += p.gps;
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    checks,
    estimates: {
      weight_g: totalWeight > 0 ? totalWeight : null,
      flight_time_min: flightTime,
      payload_capacity_g: payloadCapacity !== null && payloadCapacity >= 0 ? payloadCapacity : null,
      price: totalPrice,
    },
  };
}
