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
      className={`relative flex h-full w-full flex-col items-center justify-center p-6 text-center select-none bg-surface-soft transition-colors ${className}`}
    >
      {/* Precision Blueprint Grid Watermark */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(var(--color-graphite) 1px, transparent 1px)`,
          backgroundSize: "16px 16px",
        }}
      />

      {/* Restrained Technical Icon Badge */}
      <div
        className="relative flex h-14 w-14 items-center justify-center bg-surface shadow-xs transition-transform group-hover:scale-105"
        style={{
          borderRadius: "var(--radius-sm)",
          border: "1px solid var(--color-border)",
        }}
      >
        <IconComponent className="h-6 w-6 text-text-muted stroke-[1.4]" />
      </div>

      {/* Technical Classification Label */}
      <span className="relative mt-3 font-mono text-[10px] font-medium tracking-[0.12em] text-text-muted">
        {typeLabel}
      </span>
    </div>
  );
}
