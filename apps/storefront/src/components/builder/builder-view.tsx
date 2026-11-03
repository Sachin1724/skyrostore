"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
  XCircle,
  HelpCircle,
  ShoppingCart,
  Download,
  ShieldCheck,
  Zap,
  Clock,
  Gauge,
  Weight,
  Cpu,
  Layers,
  ArrowRight,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type { UAVComponent } from "@/lib/data/uav-components";

type Slot =
  | "frame"
  | "motor"
  | "esc"
  | "flight_controller"
  | "propeller"
  | "battery"
  | "gps"
  | "receiver"
  | "telemetry"
  | "payload"
  | "review";

interface StepConfig {
  id: Slot;
  stepNum: number;
  label: string;
  sublabel: string;
  componentType: string;
  required: boolean;
}

const BUILDER_STEPS: StepConfig[] = [
  { id: "frame", stepNum: 1, label: "Frame", sublabel: "Airframe platform", componentType: "FRAME", required: true },
  { id: "motor", stepNum: 2, label: "Motors", sublabel: "Brushless propulsion", componentType: "MOTOR", required: true },
  { id: "esc", stepNum: 3, label: "ESC", sublabel: "Speed controllers", componentType: "ESC", required: true },
  { id: "flight_controller", stepNum: 4, label: "Flight Controller", sublabel: "Autopilot computer", componentType: "FLIGHT_CONTROLLER", required: true },
  { id: "propeller", stepNum: 5, label: "Propellers", sublabel: "Aerodynamic blades", componentType: "PROPELLER", required: true },
  { id: "battery", stepNum: 6, label: "Battery", sublabel: "Power source", componentType: "BATTERY", required: true },
  { id: "gps", stepNum: 7, label: "GNSS / RTK", sublabel: "Positioning module", componentType: "GPS", required: false },
  { id: "receiver", stepNum: 8, label: "RC Receiver", sublabel: "Control link", componentType: "RECEIVER", required: false },
  { id: "telemetry", stepNum: 9, label: "Telemetry", sublabel: "Ground link", componentType: "TELEMETRY", required: false },
  { id: "payload", stepNum: 10, label: "Payload", sublabel: "Sensor & Gimbal", componentType: "PAYLOAD", required: false },
  { id: "review", stepNum: 11, label: "Review & BOM", sublabel: "Verify & order", componentType: "", required: false },
];

export function BuilderView({
  components,
}: {
  components: Record<string, UAVComponent[]>;
}) {
  const router = useRouter();
  const [activeStepIdx, setActiveStepIdx] = useState(0);

  // Initialize with the first available frame if available
  const initialFrame = components.FRAME?.[0];
  const [selectedParts, setSelectedParts] = useState<Record<string, UAVComponent | null>>({
    frame: initialFrame || null,
    motor: components.MOTOR?.[0] || null,
    esc: components.ESC?.[0] || null,
    flight_controller: components.FLIGHT_CONTROLLER?.[0] || null,
    propeller: components.PROPELLER?.[0] || null,
    battery: components.BATTERY?.[0] || null,
    gps: components.GPS?.[0] || null,
    receiver: components.RECEIVER?.[0] || null,
    telemetry: null,
    payload: null,
  });

  const [frameFilter, setFrameFilter] = useState("all");
  const [cartAdding, setCartAdding] = useState(false);

  const currentStep = BUILDER_STEPS[activeStepIdx] || BUILDER_STEPS[0];

  // Derive frame motor count: Quad = 4, Hexa = 6, Octo = 8. Default to 4.
  const motorCount = useMemo(() => {
    const frame = selectedParts.frame;
    if (!frame) return 4;
    const count = Number(frame.metadata?.motor_count);
    return count && count > 0 ? count : 4;
  }, [selectedParts.frame]);

  // Derive quantity multipliers based on multi-rotor mechanics
  const partQuantities = useMemo(() => {
    return {
      frame: 1,
      motor: motorCount,
      esc: motorCount,
      propeller: Math.max(1, Math.round(motorCount / 2)), // Propellers sold in matched CW+CCW pairs
      flight_controller: 1,
      battery: 1,
      gps: selectedParts.gps ? 1 : 0,
      receiver: selectedParts.receiver ? 1 : 0,
      telemetry: selectedParts.telemetry ? 1 : 0,
      payload: selectedParts.payload ? 1 : 0,
    };
  }, [motorCount, selectedParts]);

  // Compute Bill of Materials itemized lines
  const bomLines = useMemo(() => {
    return BUILDER_STEPS.slice(0, 10)
      .map((step) => {
        const part = selectedParts[step.id];
        if (!part) return null;
        const qty = partQuantities[step.id as keyof typeof partQuantities] || 1;
        const unitPrice = part.price || 0;
        const lineTotal = unitPrice * qty;
        const unitWeight = part.weight_g || 0;
        const totalWeight = unitWeight * qty;
        return {
          slot: step.id,
          stepLabel: step.label,
          part,
          qty,
          unitPrice,
          lineTotal,
          unitWeight,
          totalWeight,
        };
      })
      .filter(Boolean) as Array<{
      slot: string;
      stepLabel: string;
      part: UAVComponent;
      qty: number;
      unitPrice: number;
      lineTotal: number;
      unitWeight: number;
      totalWeight: number;
    }>;
  }, [selectedParts, partQuantities]);

  // Subtotal & Financials
  const subtotal = useMemo(() => {
    return bomLines.reduce((sum, item) => sum + item.lineTotal, 0);
  }, [bomLines]);

  const gstITC = Math.round((subtotal * 18) / 118);

  // Live Physical Telemetry Calculations
  const telemetry = useMemo(() => {
    const wiringAllowanceG = 85; // Standard harness, zip ties, power distribution board
    const hardwareWeightG = bomLines.reduce((sum, item) => sum + item.totalWeight, 0);
    const auwG = hardwareWeightG + wiringAllowanceG;
    const auwKg = auwG / 1000;

    // Max Thrust
    const motor = selectedParts.motor;
    const motorMaxThrustG = Number(motor?.metadata?.max_thrust_g) || 1200;
    const totalMaxThrustG = motorCount * motorMaxThrustG;
    const totalMaxThrustKg = totalMaxThrustG / 1000;

    // Thrust to Weight Ratio (TWR)
    const twr = auwG > 0 ? Number((totalMaxThrustG / auwG).toFixed(2)) : 0;

    // Hover Throttle %
    const hoverThrottlePct = twr > 0 ? Math.min(100, Math.max(15, Math.round((1 / twr) * 100))) : 0;

    // Estimated Flight Time
    const battery = selectedParts.battery;
    const capMah = Number(battery?.metadata?.capacity_mah) || 5200;
    const voltV = Number(battery?.metadata?.voltage_v) || 14.8;
    const totalWh = (capMah / 1000) * voltV;
    const usableWh = totalWh * 0.82; // 82% depth of discharge with safe 18% reserve
    const hoverPowerW = auwKg * 165; // ~6.0 g/W commercial multi-rotor efficiency index
    const flightTimeMinutes = hoverPowerW > 0 ? Math.round((usableWh / hoverPowerW) * 60) : 0;

    return {
      hardwareWeightG,
      wiringAllowanceG,
      auwG,
      auwKg,
      totalMaxThrustG,
      totalMaxThrustKg,
      twr,
      hoverThrottlePct,
      flightTimeMinutes,
    };
  }, [bomLines, motorCount, selectedParts.motor, selectedParts.battery]);

  // Compatibility Rule Engine & Validation Guardrails
  const validationAlerts = useMemo(() => {
    const alerts: Array<{ type: "error" | "warning"; message: string }> = [];

    const frame = selectedParts.frame;
    const motor = selectedParts.motor;
    const esc = selectedParts.esc;
    const prop = selectedParts.propeller;
    const battery = selectedParts.battery;

    // 1. Propeller vs Frame clearance
    if (frame && prop) {
      const maxPropSize = Number(frame.metadata?.max_prop_size_in);
      const propDiam = Number(prop.metadata?.diameter_in);
      if (maxPropSize && propDiam && propDiam > maxPropSize) {
        alerts.push({
          type: "error",
          message: `Propeller diameter (${propDiam}") exceeds frame clearance limit (${maxPropSize}"). Blades will collide with adjacent arms.`,
        });
      }
    }

    // 2. Motor Peak Current vs ESC Rating
    if (motor && esc) {
      const motorMaxA = Number(motor.metadata?.max_current_a);
      const escContA = Number(esc.metadata?.continuous_current_a);
      if (motorMaxA && escContA && motorMaxA > escContA) {
        alerts.push({
          type: "error",
          message: `Motor peak draw (${motorMaxA}A) exceeds ESC rating (${escContA}A). Severe risk of thermal shutdown during climb.`,
        });
      }
    }

    // 3. Battery Voltage vs Motor Voltage Window
    if (motor && battery) {
      const battVolt = Number(battery.metadata?.voltage_v);
      const motorMinV = Number(motor.metadata?.recommended_voltage_min_v);
      const motorMaxV = Number(motor.metadata?.recommended_voltage_max_v);
      if (battVolt && motorMaxV && battVolt > motorMaxV) {
        alerts.push({
          type: "error",
          message: `Battery voltage (${battVolt}V) exceeds motor maximum operating threshold (${motorMaxV}V). Motor coil burnout risk.`,
        });
      } else if (battVolt && motorMinV && battVolt < motorMinV) {
        alerts.push({
          type: "warning",
          message: `Battery voltage (${battVolt}V) is below recommended motor voltage (${motorMinV}V). Expect reduced thrust and sluggish responsiveness.`,
        });
      }
    }

    // 4. AUW vs Frame Maximum Takeoff Weight (MTOW)
    if (frame && telemetry.auwKg > 0) {
      const mtowKg = Number(frame.metadata?.max_takeoff_weight_kg);
      if (mtowKg && telemetry.auwKg > mtowKg) {
        alerts.push({
          type: "error",
          message: `All-Up Weight (${telemetry.auwKg.toFixed(2)} kg) exceeds frame structural limit (${mtowKg} kg). High risk of arm deformation.`,
        });
      }
    }

    // 5. Thrust-to-Weight Ratio checks
    if (telemetry.twr > 0 && telemetry.twr < 1.4) {
      alerts.push({
        type: "error",
        message: `Thrust-to-weight ratio (${telemetry.twr}:1) is below 1.4:1. Aircraft cannot overcome moderate wind gusts or maintain stable altitude.`,
      });
    } else if (telemetry.twr >= 1.4 && telemetry.twr < 1.7) {
      alerts.push({
        type: "warning",
        message: `Thrust-to-weight ratio (${telemetry.twr}:1) is marginal. Recommended for calm-weather survey payloads only.`,
      });
    }

    return alerts;
  }, [selectedParts, telemetry]);

  const hasBlockingErrors = validationAlerts.some((a) => a.type === "error");

  function handleSelectPart(slot: Slot, part: UAVComponent) {
    setSelectedParts((prev) => ({
      ...prev,
      [slot]: part,
    }));
  }

  function handleClearPart(slot: Slot) {
    setSelectedParts((prev) => ({
      ...prev,
      [slot]: null,
    }));
  }

  async function handleBatchAddToCart() {
    setCartAdding(true);
    try {
      const cartId = localStorage.getItem("cart_id");

      // Prepare array of all active components with required quantities
      const itemsToAdd = bomLines.map((line) => ({
        variant_id: line.part.variant_id,
        quantity: line.qty,
      }));

      const res = await fetch("/api/cart/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cart_id: cartId,
          items: itemsToAdd,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.cart_id) {
          localStorage.setItem("cart_id", data.cart_id);
          window.dispatchEvent(new Event("storage"));
        }
        router.push("/cart");
      }
    } catch (err) {
      console.error("Batch add to cart failed:", err);
    } finally {
      setCartAdding(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_minmax(0,1fr)_340px]">
      {/* 1. Left Sidebar: 11-Step Navigation */}
      <aside className="rounded-xl border border-border bg-white p-3 shadow-sm self-start">
        <div className="border-b border-border pb-3 px-3">
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-text-muted">
            Configurator Steps
          </p>
          <p className="text-[13px] font-bold text-navy mt-0.5">
            Step {activeStepIdx + 1} of {BUILDER_STEPS.length}
          </p>
        </div>

        <nav className="mt-2 space-y-1" aria-label="Build Steps">
          {BUILDER_STEPS.map((step, idx) => {
            const isCurrent = activeStepIdx === idx;
            const isSelected = !!selectedParts[step.id];

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => setActiveStepIdx(idx)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors ${
                  isCurrent
                    ? "bg-navy text-white font-bold"
                    : isSelected
                    ? "text-navy hover:bg-surface-soft"
                    : "text-text-secondary hover:bg-surface-soft hover:text-navy"
                }`}
              >
                <div
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[12px] font-mono font-bold transition-colors ${
                    isCurrent
                      ? "bg-brand text-white"
                      : isSelected
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-surface-muted text-text-muted"
                  }`}
                >
                  {isSelected && !isCurrent ? (
                    <Check className="h-3.5 w-3.5 stroke-[3]" aria-hidden />
                  ) : (
                    step.stepNum
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-[13px] leading-tight font-semibold truncate">
                      {step.label}
                    </p>
                    {step.required && !isSelected && !isCurrent && (
                      <span className="text-[10px] text-text-muted uppercase">Req</span>
                    )}
                  </div>
                  <p
                    className={`text-[11px] truncate ${
                      isCurrent ? "text-slate-300" : "text-text-muted"
                    }`}
                  >
                    {step.sublabel}
                  </p>
                </div>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* 2. Center Column: Component Selection Workspace */}
      <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
        {/* Step Header */}
        <div className="flex flex-col justify-between gap-3 border-b border-border pb-5 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded bg-brand/10 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-brand">
                Step {currentStep.stepNum} of 11
              </span>
              {currentStep.required ? (
                <span className="text-[11px] font-semibold text-rose-600">Mandatory Component</span>
              ) : (
                <span className="text-[11px] font-semibold text-text-muted">Optional Peripheral</span>
              )}
            </div>
            <h2 className="mt-1 text-[22px] font-extrabold tracking-tight text-navy">
              {currentStep.id === "review"
                ? "Bill of Materials & System Review"
                : `Select ${currentStep.label}`}
            </h2>
            <p className="mt-0.5 text-[13px] text-text-secondary">
              {currentStep.id === "review"
                ? "Review total hardware line items, verified physical parameters, and 18% GST tax credit before checkout."
                : `Choose an avionics-grade ${currentStep.label.toLowerCase()} compatible with your airframe and payload.`}
            </p>
          </div>

          {currentStep.id !== "review" && (
            <div className="flex items-center gap-2">
              {selectedParts[currentStep.id] && (
                <button
                  type="button"
                  onClick={() => handleClearPart(currentStep.id)}
                  className="rounded border border-border px-3 py-1.5 text-[12px] font-semibold text-text-secondary hover:border-rose-300 hover:text-rose-600"
                >
                  Clear Selection
                </button>
              )}
            </div>
          )}
        </div>

        {/* Step 11: Full Review & BOM Mode */}
        {currentStep.id === "review" ? (
          <div className="mt-6 space-y-6">
            {/* System Status Banner */}
            <div
              className={`rounded-xl border p-4 text-[13px] ${
                hasBlockingErrors
                  ? "border-rose-300 bg-rose-50 text-rose-900"
                  : validationAlerts.length > 0
                  ? "border-amber-300 bg-amber-50 text-amber-900"
                  : "border-emerald-300 bg-emerald-50 text-emerald-900"
              }`}
            >
              <div className="flex items-start gap-3">
                {hasBlockingErrors ? (
                  <XCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" aria-hidden />
                ) : validationAlerts.length > 0 ? (
                  <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" aria-hidden />
                ) : (
                  <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" aria-hidden />
                )}
                <div>
                  <p className="font-extrabold text-[14px]">
                    {hasBlockingErrors
                      ? "Configuration Conflicts Detected"
                      : validationAlerts.length > 0
                      ? "Configuration Advisory"
                      : "Aerodynamic & Propulsion Verification Passed"}
                  </p>
                  <p className="mt-0.5 text-[12px] opacity-90">
                    {hasBlockingErrors
                      ? "Resolve the highlighted physical parameter mismatches below before proceeding to cart."
                      : validationAlerts.length > 0
                      ? "Hardware will fly, but operate with the listed operational precautions."
                      : "All propulsion ratings, voltage bands, propeller clearances, and AUW limits satisfy aeronautical tolerances."}
                  </p>
                </div>
              </div>
            </div>

            {/* Bill of Materials Table */}
            <div>
              <h3 className="text-[14px] font-extrabold text-navy uppercase tracking-wider">
                Itemized Bill of Materials (BOM)
              </h3>
              <div className="mt-3 overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-left text-[13px]">
                  <thead className="border-b border-border bg-surface-soft text-[11px] font-extrabold uppercase text-text-secondary">
                    <tr>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Component Description</th>
                      <th className="px-4 py-3 text-center">Qty</th>
                      <th className="px-4 py-3 text-right">Unit Price</th>
                      <th className="px-4 py-3 text-right">Total (Inc. GST)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {bomLines.map((line) => (
                      <tr key={line.slot} className="hover:bg-surface-soft/60">
                        <td className="px-4 py-3 font-semibold text-text-muted text-[12px]">
                          {line.stepLabel}
                        </td>
                        <td className="px-4 py-3 font-medium text-navy">
                          {line.part.title}
                          {line.unitWeight > 0 && (
                            <span className="block text-[11px] text-text-muted font-mono">
                              Weight: {line.unitWeight}g each ({line.totalWeight}g line total)
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center font-mono font-semibold text-navy">
                          {line.qty}x
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-text-secondary">
                          {formatPrice(line.unitPrice, "INR")}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-navy">
                          {formatPrice(line.lineTotal, "INR")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t-2 border-border bg-surface-soft font-bold text-navy">
                    <tr>
                      <td colSpan={4} className="px-4 py-3 text-right">
                        Configuration Subtotal (18% GST Included):
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-[15px]">
                        {formatPrice(subtotal, "INR")}
                      </td>
                    </tr>
                    <tr className="text-[12px] text-emerald-800">
                      <td colSpan={4} className="px-4 py-2 text-right">
                        Estimated B2B Input Tax Credit (ITC):
                      </td>
                      <td className="px-4 py-2 text-right font-mono">
                        {formatPrice(gstITC, "INR")}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border pt-5">
              <button
                type="button"
                onClick={() => setActiveStepIdx(activeStepIdx - 1)}
                className="flex items-center gap-1.5 rounded-lg border border-border px-4 py-2.5 text-[13px] font-bold text-text-secondary hover:bg-surface-soft hover:text-navy w-full sm:w-auto justify-center"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden />
                Back to {BUILDER_STEPS[activeStepIdx - 1]?.label}
              </button>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 rounded-lg border border-border px-4 py-2.5 text-[13px] font-bold text-navy hover:bg-surface-soft"
                >
                  <Download className="h-4 w-4" aria-hidden />
                  Export BOM
                </button>

                <button
                  type="button"
                  disabled={cartAdding || hasBlockingErrors || bomLines.length === 0}
                  onClick={handleBatchAddToCart}
                  className="flex flex-1 sm:flex-none items-center justify-center gap-2 rounded-lg bg-navy px-6 py-2.5 text-[14px] font-extrabold text-white transition hover:bg-brand disabled:opacity-50 shadow-sm"
                >
                  <ShoppingCart className="h-4 w-4" aria-hidden />
                  {cartAdding ? "Adding All Items to Cart..." : "Add Entire Verified Build to Cart"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Steps 1 to 10: Component Selection Grid */
          <div className="mt-6">
            {/* Step 1: Filter tabs for frames */}
            {currentStep.id === "frame" && (
              <div className="mb-5 flex gap-2 overflow-x-auto pb-1 text-[13px]">
                {[
                  { id: "all", label: "All Frames" },
                  { id: "quad", label: "Quadcopters" },
                  { id: "hexa", label: "Hexacopters" },
                  { id: "octo", label: "Industrial / Heavy" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setFrameFilter(tab.id)}
                    className={`rounded-md px-3 py-1.5 font-bold transition-colors ${
                      frameFilter === tab.id
                        ? "bg-navy text-white"
                        : "bg-surface-soft text-text-secondary hover:text-navy"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )}

            {/* Component Cards Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {(components[currentStep.componentType] || [])
                .filter((comp) => {
                  if (currentStep.id === "frame" && frameFilter !== "all") {
                    const motorC = Number(comp.metadata?.motor_count) || 4;
                    if (frameFilter === "quad") return motorC === 4;
                    if (frameFilter === "hexa") return motorC === 6;
                    if (frameFilter === "octo") return motorC >= 8;
                  }
                  return true;
                })
                .map((comp) => {
                  const isSelected = selectedParts[currentStep.id]?.variant_id === comp.variant_id;
                  const qtyMultiplier = partQuantities[currentStep.id as keyof typeof partQuantities] || 1;
                  const unitPrice = comp.price || 0;
                  const linePrice = unitPrice * qtyMultiplier;

                  return (
                    <div
                      key={comp.variant_id}
                      className={`relative flex flex-col justify-between rounded-xl border p-4 transition-all ${
                        isSelected
                          ? "border-navy ring-2 ring-navy/20 bg-surface-soft/60 shadow-sm"
                          : "border-border bg-white hover:border-slate-300 hover:shadow-xs"
                      }`}
                    >
                      {/* Selected Pill */}
                      {isSelected && (
                        <div className="absolute right-3 top-3 flex items-center gap-1 rounded bg-navy px-2 py-0.5 text-[11px] font-extrabold text-white">
                          <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
                          Selected
                        </div>
                      )}

                      {/* Content */}
                      <div>
                        {/* Image preview if available */}
                        {Boolean(comp.metadata?.thumbnail) && (
                          <div className="relative aspect-[16/9] w-full mb-3 overflow-hidden rounded-lg bg-surface-soft border border-border">
                            <Image
                              src={comp.metadata?.thumbnail as string}
                              alt={comp.title}
                              fill
                              className="object-contain p-2"
                            />
                          </div>
                        )}

                        <h3 className="text-[14px] font-extrabold leading-tight text-navy pr-16">
                          {comp.title}
                        </h3>

                        {/* Specs Highlights */}
                        <div className="mt-3 space-y-1 rounded-lg bg-surface-soft p-2.5 text-[12px]">
                          {Boolean(comp.metadata?.wheelbase_mm) && (
                            <div className="flex justify-between text-text-secondary">
                              <span>Wheelbase</span>
                              <span className="font-mono font-semibold text-navy">
                                {String(comp.metadata.wheelbase_mm)} mm
                              </span>
                            </div>
                          )}
                          {Boolean(comp.metadata?.max_prop_size_in) && (
                            <div className="flex justify-between text-text-secondary">
                              <span>Max Prop Clearance</span>
                              <span className="font-mono font-semibold text-navy">
                                {String(comp.metadata.max_prop_size_in)}&quot;
                              </span>
                            </div>
                          )}
                          {Boolean(comp.metadata?.kv) && (
                            <div className="flex justify-between text-text-secondary">
                              <span>Velocity Constant (KV)</span>
                              <span className="font-mono font-semibold text-navy">
                                {String(comp.metadata.kv)} RPM/V
                              </span>
                            </div>
                          )}
                          {Boolean(comp.metadata?.max_thrust_g) && (
                            <div className="flex justify-between text-text-secondary">
                              <span>Max Thrust (Per Motor)</span>
                              <span className="font-mono font-semibold text-navy">
                                {String(comp.metadata.max_thrust_g)} g
                              </span>
                            </div>
                          )}
                          {Boolean(comp.metadata?.continuous_current_a) && (
                            <div className="flex justify-between text-text-secondary">
                              <span>Continuous Current</span>
                              <span className="font-mono font-semibold text-navy">
                                {String(comp.metadata.continuous_current_a)} A
                              </span>
                            </div>
                          )}
                          {Boolean(comp.metadata?.capacity_mah) && (
                            <div className="flex justify-between text-text-secondary">
                              <span>Capacity &amp; Voltage</span>
                              <span className="font-mono font-semibold text-navy">
                                {String(comp.metadata.capacity_mah)} mAh ({String(comp.metadata.voltage_v)}V)
                              </span>
                            </div>
                          )}
                          {Boolean(comp.weight_g) && (
                            <div className="flex justify-between text-text-secondary">
                              <span>Unit Weight</span>
                              <span className="font-mono font-semibold text-navy">
                                {comp.weight_g} g
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Price and Select Action */}
                      <div className="mt-4 border-t border-border pt-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-[15px] font-extrabold font-mono text-navy">
                              {formatPrice(unitPrice, comp.currency_code)}
                            </p>
                            {qtyMultiplier > 1 && (
                              <p className="text-[11px] text-text-muted">
                                {qtyMultiplier}x required = {formatPrice(linePrice, comp.currency_code)}
                              </p>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => handleSelectPart(currentStep.id, comp)}
                            className={`rounded-lg px-3.5 py-1.5 text-[13px] font-extrabold transition-all ${
                              isSelected
                                ? "bg-navy text-white shadow-xs"
                                : "border border-border bg-white text-navy hover:bg-surface-soft hover:border-slate-400"
                            }`}
                          >
                            {isSelected ? "Selected" : "Select"}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Stepper Navigation Buttons */}
            <div className="mt-8 flex items-center justify-between border-t border-border pt-5">
              <button
                type="button"
                disabled={activeStepIdx === 0}
                onClick={() => setActiveStepIdx(Math.max(0, activeStepIdx - 1))}
                className="flex items-center gap-1 rounded-lg border border-border px-4 py-2 text-[13px] font-bold text-text-secondary hover:bg-surface-soft disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden />
                Previous Step
              </button>

              <button
                type="button"
                onClick={() => setActiveStepIdx(Math.min(BUILDER_STEPS.length - 1, activeStepIdx + 1))}
                className="flex items-center gap-1 rounded-lg bg-navy px-5 py-2 text-[13px] font-extrabold text-white hover:bg-brand"
              >
                Next: {BUILDER_STEPS[activeStepIdx + 1]?.label || "Review"}
                <ChevronRight className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. Right Column: Real-Time Telemetry & Build Summary */}
      <aside className="space-y-4">
        {/* Telemetry HUD */}
        <div className="rounded-xl border border-navy/20 bg-navy p-5 text-white shadow-sm">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Gauge className="h-4 w-4 text-brand-cyan" aria-hidden />
              <h3 className="text-[13px] font-extrabold tracking-wider uppercase text-white">
                Live Flight Telemetry
              </h3>
            </div>
            <span className="rounded bg-brand/30 px-2 py-0.5 text-[10px] font-mono font-bold text-brand-cyan">
              {motorCount}-ROTOR
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 text-left">
            {/* All-Up Weight */}
            <div className="rounded-lg bg-white/5 p-2.5 border border-white/10">
              <div className="flex items-center gap-1.5 text-[11px] text-[#A6BFDB]">
                <Weight className="h-3.5 w-3.5 text-brand-cyan" aria-hidden />
                <span>AUW (Total)</span>
              </div>
              <p className="mt-1 font-mono text-[16px] font-extrabold text-white">
                {telemetry.auwKg.toFixed(2)} <span className="text-[11px] font-sans font-normal text-[#A6BFDB]">kg</span>
              </p>
            </div>

            {/* Thrust to Weight Ratio */}
            <div className="rounded-lg bg-white/5 p-2.5 border border-white/10">
              <div className="flex items-center gap-1.5 text-[11px] text-[#A6BFDB]">
                <Zap className="h-3.5 w-3.5 text-brand-cyan" aria-hidden />
                <span>TWR (Thrust:Weight)</span>
              </div>
              <p className="mt-1 font-mono text-[16px] font-extrabold text-brand-cyan">
                {telemetry.twr > 0 ? `${telemetry.twr}:1` : "--"}
              </p>
            </div>

            {/* Hover Throttle */}
            <div className="rounded-lg bg-white/5 p-2.5 border border-white/10">
              <div className="flex items-center gap-1.5 text-[11px] text-[#A6BFDB]">
                <Gauge className="h-3.5 w-3.5 text-brand-cyan" aria-hidden />
                <span>Hover Throttle</span>
              </div>
              <p className="mt-1 font-mono text-[16px] font-extrabold text-white">
                {telemetry.hoverThrottlePct > 0 ? `${telemetry.hoverThrottlePct}%` : "--"}
              </p>
            </div>

            {/* Flight Time */}
            <div className="rounded-lg bg-white/5 p-2.5 border border-white/10">
              <div className="flex items-center gap-1.5 text-[11px] text-[#A6BFDB]">
                <Clock className="h-3.5 w-3.5 text-brand-cyan" aria-hidden />
                <span>Est. Flight Time</span>
              </div>
              <p className="mt-1 font-mono text-[16px] font-extrabold text-emerald-400">
                {telemetry.flightTimeMinutes > 0 ? `~${telemetry.flightTimeMinutes} min` : "--"}
              </p>
            </div>
          </div>

          <div className="mt-4 border-t border-white/10 pt-3 text-[11px] text-[#A6BFDB]">
            <p>
              Calculated on 82% battery depth of discharge and 165 W/kg standard rotor aerodynamic loading.
            </p>
          </div>
        </div>

        {/* Validation Warnings Box */}
        {validationAlerts.length > 0 && (
          <div className="space-y-2">
            {validationAlerts.map((alert, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-2.5 rounded-lg border p-3 text-[12px] ${
                  alert.type === "error"
                    ? "border-rose-300 bg-rose-50 text-rose-900"
                    : "border-amber-300 bg-amber-50 text-amber-900"
                }`}
              >
                {alert.type === "error" ? (
                  <XCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" aria-hidden />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" aria-hidden />
                )}
                <p className="leading-snug">{alert.message}</p>
              </div>
            ))}
          </div>
        )}

        {/* Selected Hardware Summary Card */}
        <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-[13px] font-extrabold text-navy uppercase tracking-wider">
              Selected Configuration
            </h3>
            <span className="text-[11px] font-semibold text-text-muted">
              {bomLines.length} Selected
            </span>
          </div>

          {/* Quick Line Items */}
          <div className="mt-3 space-y-2 max-h-[300px] overflow-y-auto pr-1">
            {BUILDER_STEPS.slice(0, 10).map((step) => {
              const part = selectedParts[step.id];
              const qty = partQuantities[step.id as keyof typeof partQuantities] || 1;

              return (
                <div
                  key={step.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-surface-soft p-2 text-[12px]"
                >
                  <div className="min-w-0 pr-2">
                    <p className="font-extrabold text-navy truncate">
                      {part ? part.title : step.label}
                    </p>
                    <p className="text-[11px] text-text-muted">
                      {part ? `${qty}x @ ${formatPrice(part.price || 0, "INR")}` : step.required ? "Required" : "Optional"}
                    </p>
                  </div>
                  {part ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" aria-hidden />
                  ) : (
                    <span className="text-[10px] text-text-muted uppercase">Empty</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Price Summary */}
          <div className="mt-4 border-t border-border pt-4">
            <div className="flex items-center justify-between text-[13px] text-text-secondary">
              <span>Hardware Subtotal</span>
              <span className="font-mono font-semibold text-navy">
                {formatPrice(subtotal, "INR")}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-emerald-700 mt-1">
              <span>Incl. 18% GST (ITC Claimable)</span>
              <span className="font-mono">
                {formatPrice(gstITC, "INR")}
              </span>
            </div>

            <div className="flex items-center justify-between border-t border-border pt-2.5 mt-2.5 text-[15px] font-extrabold text-navy">
              <span>Total Payable</span>
              <span className="font-mono">{formatPrice(subtotal, "INR")}</span>
            </div>

            {/* Quick Next / Review Action */}
            <button
              type="button"
              onClick={() => {
                if (activeStepIdx < BUILDER_STEPS.length - 1) {
                  setActiveStepIdx(BUILDER_STEPS.length - 1); // Jump straight to review
                } else {
                  handleBatchAddToCart();
                }
              }}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-navy py-3 text-[13px] font-extrabold text-white transition hover:bg-brand"
            >
              {activeStepIdx === BUILDER_STEPS.length - 1 ? (
                <>
                  <ShoppingCart className="h-4 w-4" aria-hidden />
                  Add Build to Cart
                </>
              ) : (
                <>
                  Review &amp; Generate BOM
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </>
              )}
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
