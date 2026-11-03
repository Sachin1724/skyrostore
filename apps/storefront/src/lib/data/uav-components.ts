import { medusa } from "@/lib/medusa";

const REGION_ID = process.env.NEXT_PUBLIC_REGION_ID || "reg_01M4EBVQ7AW00SGW5JEMPAABK3";

export type UAVComponent = {
  id: string;
  title: string;
  handle: string;
  variant_id: string;
  component_type: string;
  price: number | null;
  currency_code: string;
  weight_g: number | null;
  metadata: Record<string, unknown>;
};

export const FALLBACK_UAV_COMPONENTS: Record<string, UAVComponent[]> = {
  FRAME: [
    {
      id: "comp_frame_x450",
      title: "Skyro Carbon X450 Quadcopter Frame Kit",
      handle: "skyro-x450-carbon-frame",
      variant_id: "var_frame_x450",
      component_type: "FRAME",
      price: 6499,
      currency_code: "inr",
      weight_g: 320,
      metadata: {
        motor_count: 4,
        wheelbase_mm: 450,
        max_prop_size_in: 10,
        max_takeoff_weight_kg: 2.5,
        frame_type: "Quadcopter (X-Configuration)",
        material: "3K Matte Carbon Fiber + CNC Aluminum",
        thumbnail: "/images/products/x450-carbon-frame.png",
      },
    },
    {
      id: "comp_frame_x550",
      title: "Skyro Carbon X550 Long-Range Quad Frame",
      handle: "skyro-x550-carbon-frame",
      variant_id: "var_frame_x550",
      component_type: "FRAME",
      price: 7999,
      currency_code: "inr",
      weight_g: 420,
      metadata: {
        motor_count: 4,
        wheelbase_mm: 550,
        max_prop_size_in: 12,
        max_takeoff_weight_kg: 4.0,
        frame_type: "Quadcopter (Deadcat / Stretched X)",
        material: "3K Toray Carbon Fiber",
        thumbnail: "/images/products/x550-carbon-frame.png",
      },
    },
    {
      id: "comp_frame_h680",
      title: "Skyro H680 Heavy-Lift Hexacopter Platform",
      handle: "skyro-h680-hexa-frame",
      variant_id: "var_frame_h680",
      component_type: "FRAME",
      price: 11499,
      currency_code: "inr",
      weight_g: 650,
      metadata: {
        motor_count: 6,
        wheelbase_mm: 680,
        max_prop_size_in: 14,
        max_takeoff_weight_kg: 8.0,
        frame_type: "Hexacopter (Redundant Coaxial/Radial)",
        material: "High-Modulus Carbon Fiber with Quick-Fold Arms",
        thumbnail: "/images/products/h680-hexa-frame.png",
      },
    },
    {
      id: "comp_frame_s900",
      title: "Skyro Industrial S900 Hexa Heavy Survey Frame",
      handle: "skyro-s900-survey-frame",
      variant_id: "var_frame_s900",
      component_type: "FRAME",
      price: 18999,
      currency_code: "inr",
      weight_g: 1200,
      metadata: {
        motor_count: 6,
        wheelbase_mm: 900,
        max_prop_size_in: 18,
        max_takeoff_weight_kg: 15.0,
        frame_type: "Industrial Hexacopter",
        material: "Aviation-Grade Carbon Fiber + Anodized 7075 Aluminum",
        thumbnail: "/images/products/s900-heavy-frame.png",
      },
    },
  ],
  MOTOR: [
    {
      id: "comp_motor_2216",
      title: "T-Motor Navigator MN2216 920KV High-Efficiency Motor",
      handle: "tmotor-mn2216-920kv",
      variant_id: "var_motor_2216",
      component_type: "MOTOR",
      price: 2450,
      currency_code: "inr",
      weight_g: 68,
      metadata: {
        kv: 920,
        max_thrust_g: 1050,
        max_current_a: 18,
        recommended_prop_min_in: 9,
        recommended_prop_max_in: 10,
        recommended_voltage_min_v: 11.1,
        recommended_voltage_max_v: 14.8,
        stator_size: "2216",
        shaft_diam_mm: 3.175,
        rating: "4S LiPo Optimal",
      },
    },
    {
      id: "comp_motor_2814",
      title: "Sunnysky X2814 900KV Industrial Brushless Motor",
      handle: "sunnysky-x2814-900kv",
      variant_id: "var_motor_2814",
      component_type: "MOTOR",
      price: 3100,
      currency_code: "inr",
      weight_g: 106,
      metadata: {
        kv: 900,
        max_thrust_g: 1850,
        max_current_a: 32,
        recommended_prop_min_in: 11,
        recommended_prop_max_in: 12,
        recommended_voltage_min_v: 14.8,
        recommended_voltage_max_v: 22.2,
        stator_size: "2814",
        shaft_diam_mm: 4.0,
        rating: "4S–6S LiPo Rated",
      },
    },
    {
      id: "comp_motor_4008",
      title: "T-Motor Antigravity MN4008 380KV Ultra-Light Motor",
      handle: "tmotor-mn4008-380kv",
      variant_id: "var_motor_4008",
      component_type: "MOTOR",
      price: 4850,
      currency_code: "inr",
      weight_g: 92,
      metadata: {
        kv: 380,
        max_thrust_g: 2400,
        max_current_a: 24,
        recommended_prop_min_in: 13,
        recommended_prop_max_in: 16,
        recommended_voltage_min_v: 22.2,
        recommended_voltage_max_v: 25.2,
        stator_size: "4008",
        shaft_diam_mm: 4.0,
        rating: "6S High-Endurance UAV",
      },
    },
    {
      id: "comp_motor_5010",
      title: "EMAX GT5325 340KV Heavy-Payload Torque Motor",
      handle: "emax-gt5325-340kv",
      variant_id: "var_motor_5010",
      component_type: "MOTOR",
      price: 6400,
      currency_code: "inr",
      weight_g: 195,
      metadata: {
        kv: 340,
        max_thrust_g: 3800,
        max_current_a: 42,
        recommended_prop_min_in: 15,
        recommended_prop_max_in: 18,
        recommended_voltage_min_v: 22.2,
        recommended_voltage_max_v: 29.6,
        stator_size: "5010",
        shaft_diam_mm: 5.0,
        rating: "6S–8S Agricultural/Lift",
      },
    },
  ],
  ESC: [
    {
      id: "comp_esc_30a",
      title: "Flycolor 30A OPTO BLHeli_S Electronic Speed Controller",
      handle: "flycolor-30a-opto",
      variant_id: "var_esc_30a",
      component_type: "ESC",
      price: 1199,
      currency_code: "inr",
      weight_g: 22,
      metadata: {
        continuous_current_a: 30,
        burst_current_a: 40,
        cell_count_min: 2,
        cell_count_max: 4,
        firmware: "BLHeli_S",
        protocol: "DShot300 / DShot600",
      },
    },
    {
      id: "comp_esc_45a",
      title: "Hobbywing XRotor Pro 40A Multi-Rotor ESC",
      handle: "hobbywing-xrotor-pro-40a",
      variant_id: "var_esc_45a",
      component_type: "ESC",
      price: 1850,
      currency_code: "inr",
      weight_g: 35,
      metadata: {
        continuous_current_a: 40,
        burst_current_a: 60,
        cell_count_min: 3,
        cell_count_max: 6,
        firmware: "XRotor Industrial Core",
        protocol: "PWM / OneShot",
      },
    },
    {
      id: "comp_esc_60a",
      title: "T-Motor FLAME 60A 12S FOC Industrial ESC (IP67)",
      handle: "tmotor-flame-60a",
      variant_id: "var_esc_60a",
      component_type: "ESC",
      price: 4950,
      currency_code: "inr",
      weight_g: 68,
      metadata: {
        continuous_current_a: 60,
        burst_current_a: 80,
        cell_count_min: 6,
        cell_count_max: 12,
        firmware: "Field-Oriented Control (FOC)",
        protocol: "CAN / PWM / UART",
      },
    },
  ],
  FLIGHT_CONTROLLER: [
    {
      id: "comp_fc_pixhawk4",
      title: "Holybro Pixhawk 4 Autopilot with PM07 Power Management",
      handle: "holybro-pixhawk-4",
      variant_id: "var_fc_pixhawk4",
      component_type: "FLIGHT_CONTROLLER",
      price: 16800,
      currency_code: "inr",
      weight_g: 48,
      metadata: {
        processor: "STM32F765 216MHz 32-bit",
        firmware: "PX4 / ArduPilot Plane & Copter",
        imu: "Triple Redundant IMU (ICM-20689 + ICM-20602 + BMI055)",
        barometer: "MS5611 High Precision",
      },
    },
    {
      id: "comp_fc_speedybee",
      title: "SpeedyBee F405 V4 55A Stack Flight Controller",
      handle: "speedybee-f405-v4-stack",
      variant_id: "var_fc_speedybee",
      component_type: "FLIGHT_CONTROLLER",
      price: 6890,
      currency_code: "inr",
      weight_g: 32,
      metadata: {
        processor: "STM32F405 168MHz",
        firmware: "Betaflight / INAV",
        imu: "ICM-42688-P",
        barometer: "DPS310",
      },
    },
    {
      id: "comp_fc_cubeorange",
      title: "Cube Orange+ Standard Set with ADS-B Carrier Board",
      handle: "cube-orange-plus-adsb",
      variant_id: "var_fc_cubeorange",
      component_type: "FLIGHT_CONTROLLER",
      price: 36500,
      currency_code: "inr",
      weight_g: 75,
      metadata: {
        processor: "STM32H757 Dual Core 480MHz",
        firmware: "ArduPilot Enterprise / Mission Planner / QGroundControl",
        imu: "Triple Isolated Vibration-Damped & Heated IMUs",
        features: "Built-in 1090MHz ADS-B In Aircraft Receiver",
      },
    },
  ],
  PROPELLER: [
    {
      id: "comp_prop_1045",
      title: "APC 10x4.5 Multi-Rotor Propeller Pair (CW + CCW)",
      handle: "apc-1045-mr-pair",
      variant_id: "var_prop_1045",
      component_type: "PROPELLER",
      price: 480,
      currency_code: "inr",
      weight_g: 18,
      metadata: {
        diameter_in: 10,
        pitch_in: 4.5,
        material: "Glass-Filled Nylon Composite",
        shaft_adapter_mm: 5.0,
      },
    },
    {
      id: "comp_prop_1238",
      title: "Tarot 12x3.8 High-Efficiency Carbon Fiber Prop Pair",
      handle: "tarot-1238-carbon-pair",
      variant_id: "var_prop_1238",
      component_type: "PROPELLER",
      price: 1150,
      currency_code: "inr",
      weight_g: 24,
      metadata: {
        diameter_in: 12,
        pitch_in: 3.8,
        material: "100% 3K Carbon Fiber",
        shaft_adapter_mm: 4.0,
      },
    },
    {
      id: "comp_prop_1555",
      title: "T-Motor 15x5.0 Carbon Fiber Precision Matched Pair",
      handle: "tmotor-1555-carbon-pair",
      variant_id: "var_prop_1555",
      component_type: "PROPELLER",
      price: 2490,
      currency_code: "inr",
      weight_g: 38,
      metadata: {
        diameter_in: 15,
        pitch_in: 5.0,
        material: "Solid Core Japanese Carbon Fiber",
        shaft_adapter_mm: 6.0,
      },
    },
  ],
  BATTERY: [
    {
      id: "comp_batt_4s_5200",
      title: "Tattu 5200mAh 14.8V 4S 35C LiPo Battery Pack (XT60)",
      handle: "tattu-5200mah-4s-35c",
      variant_id: "var_batt_4s_5200",
      component_type: "BATTERY",
      price: 4650,
      currency_code: "inr",
      weight_g: 480,
      metadata: {
        capacity_mah: 5200,
        cell_count: 4,
        voltage_v: 14.8,
        c_rating: 35,
        connector: "XT60",
      },
    },
    {
      id: "comp_batt_6s_8000",
      title: "Gens Ace Tattu Plus 8000mAh 22.2V 6S 25C Smart Battery",
      handle: "tattu-plus-8000mah-6s",
      variant_id: "var_batt_6s_8000",
      component_type: "BATTERY",
      price: 11200,
      currency_code: "inr",
      weight_g: 980,
      metadata: {
        capacity_mah: 8000,
        cell_count: 6,
        voltage_v: 22.2,
        c_rating: 25,
        connector: "XT90-S Anti-Spark",
      },
    },
    {
      id: "comp_batt_6s_16000",
      title: "Tattu 16000mAh 22.2V 6S 15C High-Capacity Solid State Pack",
      handle: "tattu-16000mah-6s-pack",
      variant_id: "var_batt_6s_16000",
      component_type: "BATTERY",
      price: 21900,
      currency_code: "inr",
      weight_g: 1980,
      metadata: {
        capacity_mah: 16000,
        cell_count: 6,
        voltage_v: 22.2,
        c_rating: 15,
        connector: "AS150 Anti-Spark",
      },
    },
  ],
  GPS: [
    {
      id: "comp_gps_m8n",
      title: "Here3+ High-Precision GNSS Receiver with CAN Compass",
      handle: "here3-plus-gnss-receiver",
      variant_id: "var_gps_m8n",
      component_type: "GPS",
      price: 7990,
      currency_code: "inr",
      weight_g: 49,
      metadata: {
        constellations: "GPS, GLONASS, Galileo, BeiDou",
        compass: "Dual Integrated Digital Magnetic Compass",
        interface: "DroneCAN / UART",
      },
    },
    {
      id: "comp_gps_f9p",
      title: "Holybro H-RTK F9P Helical Centimeter RTK Rover",
      handle: "holybro-hrtk-f9p-rover",
      variant_id: "var_gps_f9p",
      component_type: "GPS",
      price: 24500,
      currency_code: "inr",
      weight_g: 65,
      metadata: {
        constellations: "Multi-band RTK GNSS (L1/L2/E5b)",
        accuracy: "1.0 cm + 1 ppm CEP horizontal RTK",
        interface: "UART / I2C / SPI",
      },
    },
  ],
  RECEIVER: [
    {
      id: "comp_rx_elrs",
      title: "RadioMaster RP3 ExpressLRS 2.4GHz Diversity Nano Receiver",
      handle: "radiomaster-rp3-elrs",
      variant_id: "var_rx_elrs",
      component_type: "RECEIVER",
      price: 2150,
      currency_code: "inr",
      weight_g: 4.6,
      metadata: {
        protocol: "ExpressLRS (ELRS 2.4GHz)",
        telemetry_power: "100mW True Diversity",
        range_km: 15,
      },
    },
    {
      id: "comp_rx_crossfire",
      title: "TBS Crossfire Nano Pro Long Range Receiver",
      handle: "tbs-crossfire-nano-pro",
      variant_id: "var_rx_crossfire",
      component_type: "RECEIVER",
      price: 3600,
      currency_code: "inr",
      weight_g: 4.3,
      metadata: {
        protocol: "CRSF 868MHz / 915MHz",
        telemetry_power: "500mW Long Range",
        range_km: 40,
      },
    },
  ],
  TELEMETRY: [
    {
      id: "comp_telem_siik",
      title: "Holybro SiK 500mW 433MHz Telemetry Radio V3",
      handle: "holybro-sik-500mw-433mhz",
      variant_id: "var_telem_sik",
      component_type: "TELEMETRY",
      price: 4200,
      currency_code: "inr",
      weight_g: 38,
      metadata: {
        frequency: "433 MHz Ground-to-Air Link",
        power_mw: 500,
        interface: "Micro-USB + JST-GH 6-pin",
        range_km: 8,
      },
    },
  ],
  PAYLOAD: [
    {
      id: "comp_payload_gimbal",
      title: "Viewpro Mini Z-30A 30x Optical Zoom Optical Sensor Gimbal",
      handle: "viewpro-mini-z30a-gimbal",
      variant_id: "var_payload_gimbal",
      component_type: "PAYLOAD",
      price: 48000,
      currency_code: "inr",
      weight_g: 370,
      metadata: {
        resolution: "1080p 60fps / 4K Stills with 30x Optical Zoom",
        stabilization: "3-Axis Direct Drive Brushless Gimbal (±0.008°)",
        tracking: "Target Auto-Tracking & Geotagging",
      },
    },
  ],
};

export async function getUAVComponents(): Promise<Record<string, UAVComponent[]>> {
  const grouped: Record<string, UAVComponent[]> = {};

  // Initialize with fallback components
  for (const [k, v] of Object.entries(FALLBACK_UAV_COMPONENTS)) {
    grouped[k] = [...v];
  }

  try {
    const { products } = await medusa.store.product.list({
      limit: 100,
      region_id: REGION_ID,
      fields: "+metadata,+variants.calculated_price",
    });

    for (const p of products) {
      const meta = (p.metadata ?? {}) as Record<string, unknown>;
      const componentType = (meta.component_type || (meta.technical_specs as { componentType?: string })?.componentType) as string | undefined;
      if (!componentType) continue;

      const variant = p.variants?.[0];
      if (!variant) continue;

      const price = (variant as unknown as Record<string, unknown>).calculated_price as {
        calculated_amount?: number;
        currency_code?: string;
      } | null;

      const component: UAVComponent = {
        id: p.id,
        title: p.title,
        handle: p.handle ?? "",
        variant_id: variant.id,
        component_type: componentType.toUpperCase(),
        price: price?.calculated_amount ?? null,
        currency_code: price?.currency_code ?? "inr",
        weight_g: meta.weight_g ? Number(meta.weight_g) : null,
        metadata: meta,
      };

      const key = componentType.toUpperCase();
      if (!grouped[key]) grouped[key] = [];
      // If already present, don't duplicate fallback id
      const exists = grouped[key].some((c) => c.variant_id === component.variant_id || c.title === component.title);
      if (!exists) {
        grouped[key].unshift(component);
      }
    }
  } catch (error) {
    console.warn("Could not retrieve live store products for UAV configurator, utilizing certified engineering fallback catalog:", error);
  }

  return grouped;
}
