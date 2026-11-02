import React from "react";
import {
  Cpu,
  RotateCw,
  BatteryCharging,
  Zap,
  Fan,
  Box,
  Compass,
  Plane,
  Radio,
  Camera,
  Layers,
} from "lucide-react";

interface ProductMediaFallbackProps {
  componentType?: string | null;
  category?: string | null;
  title?: string;
  className?: string;
}

export function ProductMediaFallback({
  componentType,
  category,
  title,
  className = "",
}: ProductMediaFallbackProps) {
  // Infer component type from category or title if not explicitly set
  const rawType = (componentType || category || title || "").toUpperCase();

  let IconComponent = Layers;
  let typeLabel = "HARDWARE";

  if (rawType.includes("MOTOR") || rawType.includes("PROPULSION")) {
    IconComponent = RotateCw;
    typeLabel = "BRUSHLESS MOTOR";
  } else if (rawType.includes("BATTER") || rawType.includes("LIPO") || rawType.includes("POWER")) {
    IconComponent = BatteryCharging;
    typeLabel = "POWER SYSTEM";
  } else if (rawType.includes("CONTROLLER") || rawType.includes("AUTOPILOT") || rawType.includes("FC")) {
    IconComponent = Cpu;
    typeLabel = "AUTOPILOT / FC";
  } else if (rawType.includes("ESC") || rawType.includes("SPEED CONTROLLER")) {
    IconComponent = Zap;
    typeLabel = "SPEED CONTROLLER";
  } else if (rawType.includes("PROP") || rawType.includes("BLADE")) {
    IconComponent = Fan;
    typeLabel = "AERODYNAMICS";
  } else if (rawType.includes("FRAME") || rawType.includes("CHASSIS") || rawType.includes("KIT")) {
    IconComponent = Box;
    typeLabel = "AIRFRAME KIT";
  } else if (rawType.includes("GPS") || rawType.includes("GNSS") || rawType.includes("NAV")) {
    IconComponent = Compass;
    typeLabel = "GNSS / NAVIGATION";
  } else if (rawType.includes("UAV") || rawType.includes("DRONE") || rawType.includes("QUADCOPTER")) {
    IconComponent = Plane;
    typeLabel = "AERIAL PLATFORM";
  } else if (rawType.includes("RECEIVER") || rawType.includes("TELEMETRY") || rawType.includes("RADIO")) {
    IconComponent = Radio;
    typeLabel = "TELEMETRY / LINK";
  } else if (rawType.includes("CAMERA") || rawType.includes("PAYLOAD") || rawType.includes("SENSOR")) {
    IconComponent = Camera;
    typeLabel = "PAYLOAD / OPTICS";
  }

  return (
    <div
      className={`relative flex h-full w-full flex-col items-center justify-center p-6 text-center select-none bg-brand-soft transition-colors ${className}`}
    >
      {/* Placeholder until the admin uploads a photo: the part's type, drawn flat. */}
      <IconComponent className="h-12 w-12 text-brand stroke-[1.4]" aria-hidden="true" />
      <span className="mt-3 text-[14px] font-medium text-text-secondary">
        {typeLabel.charAt(0) + typeLabel.slice(1).toLowerCase()}
      </span>
    </div>
  );
}
