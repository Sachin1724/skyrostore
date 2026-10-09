export type UAVComponentType =
  | "FRAME"
  | "FLIGHT_CONTROLLER"
  | "ESC"
  | "MOTOR"
  | "PROPELLER"
  | "BATTERY"
  | "GPS"
  | "RECEIVER"
  | "TELEMETRY"
  | "CAMERA"
  | "PAYLOAD"
  | "POWER_MODULE";

export interface FrameSpec {
  component_type: "FRAME";
  motor_count: number;
  wheelbase_mm: number;
  max_propeller_size_in: number;
  max_takeoff_weight_g: number;
  weight_g: number;
}

export interface FlightControllerSpec {
  component_type: "FLIGHT_CONTROLLER";
  weight_g: number;
}

export interface ESCSpec {
  component_type: "ESC";
  continuous_current_a: number;
  peak_current_a: number;
  cell_count_min: number;
  cell_count_max: number;
  weight_g: number;
}

export interface MotorSpec {
  component_type: "MOTOR";
  kv: number;
  max_current_a: number;
  recommended_voltage_min_v: number;
  recommended_voltage_max_v: number;
  weight_g: number;
  recommended_propeller_min_in: number;
  recommended_propeller_max_in: number;
}

export interface PropellerSpec {
  component_type: "PROPELLER";
  diameter_in: number;
  pitch_in: number;
  weight_g: number;
}

export interface BatterySpec {
  component_type: "BATTERY";
  cell_count: number;
  voltage_v: number;
  capacity_mah: number;
  continuous_discharge_a: number;
  weight_g: number;
}

export interface GPSSpec {
  component_type: "GPS";
  weight_g: number;
}

export interface GenericComponentSpec {
  component_type: string;
  weight_g: number;
}

export type ComponentSpec =
  | FrameSpec
  | FlightControllerSpec
  | ESCSpec
  | MotorSpec
  | PropellerSpec
  | BatterySpec
  | GPSSpec
  | GenericComponentSpec;

export type CheckSeverity = "PASS" | "WARNING" | "ERROR";

export interface CompatibilityCheck {
  code: string;
  severity: CheckSeverity;
  message: string;
}

export interface CompatibilityEstimates {
  weight_g: number | null;
  flight_time_min: number | null;
  payload_capacity_g: number | null;
  price: number | null;
}

export interface CompatibilityResult {
  valid: boolean;
  errors: CompatibilityCheck[];
  warnings: CompatibilityCheck[];
  checks: CompatibilityCheck[];
  estimates: CompatibilityEstimates;
}

export interface ComponentInput {
  variant_id: string;
  spec: ComponentSpec;
  price_amount: number;
}

export interface ValidateRequest {
  frame_variant_id?: string;
  flight_controller_variant_id?: string;
  esc_variant_id?: string;
  motor_variant_id?: string;
  propeller_variant_id?: string;
  battery_variant_id?: string;
  gps_variant_id?: string;
  payload_grams?: number;
}
