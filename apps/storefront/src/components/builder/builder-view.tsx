"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ChevronRight, ChevronLeft, AlertTriangle, XCircle, ShoppingCart, Save } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { cleanName } from "@/lib/data/catalog";
import { ProductTile } from "@/components/product/product-tile";
import { ProductMediaFallback } from "@/components/product/product-media-fallback";
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
  resumeItems,
}: {
  components: Record<string, UAVComponent[]>;
  resumeItems?: { product_variant_id: string; component_type: string }[] | null;
}) {
  const router = useRouter();

  const resumedParts = useMemo<Record<string, UAVComponent | null>>(() => {
    if (!resumeItems?.length) return {};
    const out: Record<string, UAVComponent | null> = {};
    for (const step of BUILDER_STEPS) {
      const item = resumeItems.find((it) => it.component_type === step.componentType);
      const match = item && components[step.componentType]?.find((c) => c.variant_id === item.product_variant_id);
      if (match) out[step.id] = match;
    }
    return out;
  }, [resumeItems, components]);

  const firstIncompleteStepIdx = useMemo(() => {
    if (!resumeItems?.length) return 0;
    const idx = BUILDER_STEPS.findIndex((s) => s.required && !resumedParts[s.id]);
    return idx === -1 ? BUILDER_STEPS.length - 1 : idx;
  }, [resumeItems, resumedParts]);

  const [activeStepIdx, setActiveStepIdx] = useState(firstIncompleteStepIdx);
  const [stepDir, setStepDir] = useState<"fwd" | "back">("fwd");
  const goToStep = (idx: number) => {
    setStepDir(idx >= activeStepIdx ? "fwd" : "back");
    setActiveStepIdx(idx);
  };

  const [selectedParts, setSelectedParts] = useState<Record<string, UAVComponent | null>>(resumedParts);

  const [frameFilter, setFrameFilter] = useState("all");
  const [cartAdding, setCartAdding] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ ok: boolean; text: string } | null>(null);

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

  async function handleSaveConfiguration() {
    setSavingConfig(true);
    setSaveMessage(null);
    try {
      const body: Record<string, unknown> = {};
      if (selectedParts.frame) body.frame_variant_id = selectedParts.frame.variant_id;
      if (selectedParts.flight_controller) body.flight_controller_variant_id = selectedParts.flight_controller.variant_id;
      if (selectedParts.esc) body.esc_variant_id = selectedParts.esc.variant_id;
      if (selectedParts.motor) body.motor_variant_id = selectedParts.motor.variant_id;
      if (selectedParts.propeller) body.propeller_variant_id = selectedParts.propeller.variant_id;
      if (selectedParts.battery) body.battery_variant_id = selectedParts.battery.variant_id;
      if (selectedParts.gps) body.gps_variant_id = selectedParts.gps.variant_id;

      const res = await fetch("/api/uav/configurations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        setSaveMessage({ ok: false, text: "Sign in to save this build to your account." });
        return;
      }
      if (!res.ok) {
        setSaveMessage({ ok: false, text: data.error || "Could not save this build." });
        return;
      }
      setSaveMessage({ ok: true, text: "Saved — view it under Account > Saved builds." });
    } catch {
      setSaveMessage({ ok: false, text: "Could not save this build." });
    } finally {
      setSavingConfig(false);
    }
  }

  const visibleParts = (components[currentStep.componentType] || []).filter((comp) => {
    if (currentStep.id === "frame" && frameFilter !== "all") {
      const motorC = Number(comp.metadata?.motor_count) || 4;
      if (frameFilter === "quad") return motorC === 4;
      if (frameFilter === "hexa") return motorC === 6;
      if (frameFilter === "octo") return motorC >= 8;
    }
    return true;
  });
  const isReview = currentStep.id === "review";
  const isLast = activeStepIdx === BUILDER_STEPS.length - 1;
  const hasPart = !!selectedParts[currentStep.id];

  return (
    <div>
      {/* Progress: one row, scrolls sideways on phones */}
      <nav aria-label="Build steps" className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 text-[13px] [scrollbar-width:none]">
        {BUILDER_STEPS.map((step, idx) => {
          const current = activeStepIdx === idx;
          const done = !!selectedParts[step.id];
          return (
            <button
              key={step.id}
              type="button"
              aria-current={current ? "step" : undefined}
              onClick={() => goToStep(idx)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 font-medium ${
                current ? "bg-navy text-white" : "bg-white text-text-secondary hover:text-navy"
              }`}
            >
              {done && !current && <Check className="h-3.5 w-3.5 text-success" strokeWidth={3} aria-hidden />}
              {step.label}
            </button>
          );
        })}
      </nav>

      <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* Main: one step at a time */}
        <section key={currentStep.id} className={`${stepDir === "back" ? "step-in-back" : "step-in"} rounded-xl bg-white p-6 md:p-8`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-navy">
                {isReview ? "Review your build" : `Choose ${currentStep.label.toLowerCase()}`}
              </h2>
              <p className="mt-1 text-[14px] text-text-secondary">
                {isReview
                  ? "Check the parts and prices, then add everything to your cart."
                  : currentStep.required
                  ? "Required for a complete build."
                  : "Optional. Skip it if you don't need it."}
              </p>
            </div>
            {!isReview && hasPart && (
              <button type="button" onClick={() => handleClearPart(currentStep.id)} className="shrink-0 text-[13px] font-medium text-text-secondary hover:text-navy">
                Clear
              </button>
            )}
          </div>

          {isReview ? (
            <div className="mt-6">
              {hasBlockingErrors && (
                <p className="mb-4 rounded-lg bg-error-soft p-3 text-[13px] text-error">Fix the compatibility issues listed on the right before adding to cart.</p>
              )}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[14px]">
                  <thead className="text-[13px] text-text-muted">
                    <tr className="border-b border-border">
                      <th className="py-2 pr-3 font-medium">Part</th>
                      <th className="px-3 py-2 text-center font-medium">Qty</th>
                      <th className="py-2 pl-3 text-right font-medium">Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {bomLines.map((line) => (
                      <tr key={line.slot}>
                        <td className="py-3 pr-3">
                          <span className="block font-medium text-navy">{line.part.title}</span>
                          <span className="text-[13px] text-text-muted">{line.stepLabel}</span>
                        </td>
                        <td className="px-3 py-3 text-center tabular-nums">{line.qty}</td>
                        <td className="py-3 pl-3 text-right tabular-nums text-navy">{formatPrice(line.lineTotal, "INR")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {bomLines.length === 0 && <p className="py-8 text-center text-[14px] text-text-muted">No parts chosen yet.</p>}
            </div>
          ) : (
            <>
              {currentStep.id === "frame" && (
                <div className="mt-5 flex gap-2 overflow-x-auto text-[13px]">
                  {[
                    { id: "all", label: "All" },
                    { id: "quad", label: "Quadcopter" },
                    { id: "hexa", label: "Hexacopter" },
                    { id: "octo", label: "Heavy-lift" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setFrameFilter(tab.id)}
                      className={`rounded-full px-3.5 py-1.5 font-medium ${frameFilter === tab.id ? "bg-navy text-white" : "bg-surface-soft text-text-secondary hover:text-navy"}`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              )}

              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
                {visibleParts.map((comp) => {
                  const isSelected = selectedParts[currentStep.id]?.variant_id === comp.variant_id;
                  const qty = partQuantities[currentStep.id as keyof typeof partQuantities] || 1;
                  const specs = partSpecs(comp);
                  return (
                    <ProductTile
                      key={comp.variant_id}
                      image={comp.metadata?.thumbnail as string | undefined}
                      fallback={<ProductMediaFallback componentType={comp.component_type} title={comp.title} />}
                      title={cleanName(comp.title)}
                      spec={specs.join(" · ") || undefined}
                      price={<p className="text-[16px] font-semibold tabular-nums text-navy">{formatPrice(comp.price || 0, comp.currency_code)}</p>}
                      status={qty > 1 ? <p className="text-[13px] text-text-muted">{qty} needed</p> : null}
                      selected={isSelected}
                      action={
                        <button
                          type="button"
                          aria-pressed={isSelected}
                          onClick={() => handleSelectPart(currentStep.id, comp)}
                          className={`btn btn-sm ${isSelected ? "btn-primary" : "btn-secondary"}`}
                        >
                          {isSelected ? "Selected" : "Select"}
                        </button>
                      }
                    />
                  );
                })}
              </div>
              {visibleParts.length === 0 && <p className="mt-8 text-center text-[14px] text-text-muted">Nothing available here yet.</p>}
            </>
          )}

          <div className="mt-8 flex items-center justify-between border-t border-border pt-5">
            <button
              type="button"
              disabled={activeStepIdx === 0}
              onClick={() => goToStep(activeStepIdx - 1)}
              className="flex items-center gap-1 text-[14px] font-medium text-text-secondary hover:text-navy disabled:opacity-0"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden /> Back
            </button>
            {!isLast && (
              <button
                type="button"
                onClick={() => goToStep(activeStepIdx + 1)}
                className="flex items-center gap-1 rounded-full bg-navy px-5 py-2 text-[14px] font-medium text-white hover:bg-brand"
              >
                {!hasPart && !currentStep.required ? "Skip" : "Next"} <ChevronRight className="h-4 w-4" aria-hidden />
              </button>
            )}
          </div>
        </section>

        {/* Summary: sticky, one primary action */}
        <aside className="self-start rounded-xl bg-white p-5 lg:sticky lg:top-24">
          <h3 className="text-[16px] font-semibold text-navy">Your build</h3>

          {bomLines.length === 0 ? (
            <p className="mt-3 text-[14px] text-text-muted">Parts you choose appear here.</p>
          ) : (
            <ul className="mt-3 divide-y divide-border text-[13px]">
              {bomLines.map((line) => (
                <li key={line.slot} className="flex items-baseline justify-between gap-3 py-2">
                  <span className="min-w-0 truncate text-navy">
                    {line.qty > 1 && <span className="text-text-muted">{line.qty}× </span>}
                    {line.part.title}
                  </span>
                  <span className="shrink-0 tabular-nums text-text-secondary">{formatPrice(line.lineTotal, "INR")}</span>
                </li>
              ))}
            </ul>
          )}

          {bomLines.length > 0 && (
            <dl className="mt-4 grid grid-cols-3 gap-2 rounded-lg bg-surface-soft p-3 text-center">
              <div>
                <dd className="text-[16px] font-semibold tabular-nums text-navy">{telemetry.auwKg.toFixed(2)} kg</dd>
                <dt className="text-[13px] text-text-muted">Weight</dt>
              </div>
              <div>
                <dd className="text-[16px] font-semibold tabular-nums text-navy">{telemetry.twr > 0 ? `${telemetry.twr}:1` : "–"}</dd>
                <dt className="text-[13px] text-text-muted">Thrust ratio</dt>
              </div>
              <div>
                <dd className="text-[16px] font-semibold tabular-nums text-navy">{telemetry.flightTimeMinutes > 0 ? `~${telemetry.flightTimeMinutes} min` : "–"}</dd>
                <dt className="text-[13px] text-text-muted">Flight time</dt>
              </div>
            </dl>
          )}

          {validationAlerts.length > 0 && (
            <ul className="mt-4 space-y-2">
              {validationAlerts.map((alert, idx) => (
                <li key={idx} className={`flex items-start gap-2 rounded-lg p-3 text-[13px] leading-snug ${alert.type === "error" ? "bg-error-soft text-error" : "bg-warning-soft text-warning-strong"}`}>
                  {alert.type === "error" ? <XCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> : <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />}
                  {alert.message}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 flex items-baseline justify-between border-t border-border pt-4">
            <span className="text-[14px] text-text-secondary">Total</span>
            <span className="text-[20px] font-semibold tabular-nums text-navy">{formatPrice(subtotal, "INR")}</span>
          </div>
          <p className="mt-0.5 text-right text-[13px] text-text-muted">Includes GST</p>

          <button
            type="button"
            disabled={bomLines.length === 0 || cartAdding || (isReview && hasBlockingErrors)}
            onClick={() => (isReview ? handleBatchAddToCart() : goToStep(BUILDER_STEPS.length - 1))}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-navy py-3 text-[14px] font-medium text-white hover:bg-brand disabled:opacity-40"
          >
            {isReview ? (
              <>
                <ShoppingCart className="h-4 w-4" aria-hidden />
                {cartAdding ? "Adding…" : "Add build to cart"}
              </>
            ) : (
              "Review build"
            )}
          </button>

          {isReview && bomLines.length > 0 && (
            <>
              <button
                type="button"
                disabled={savingConfig}
                onClick={handleSaveConfiguration}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-full border border-border py-3 text-[14px] font-medium text-navy hover:border-brand disabled:opacity-40"
              >
                <Save className="h-4 w-4" aria-hidden />
                {savingConfig ? "Saving…" : "Save configuration"}
              </button>
              {saveMessage && (
                <p className={`mt-2 text-[13px] ${saveMessage.ok ? "text-success" : "text-error"}`}>{saveMessage.text}</p>
              )}
            </>
          )}
        </aside>
      </div>
    </div>
  );
}

/** Up to three short spec lines for a part card. */
function partSpecs(c: UAVComponent): string[] {
  const m = c.metadata ?? {};
  const out: string[] = [];
  if (m.wheelbase_mm) out.push(`${m.wheelbase_mm} mm wheelbase`);
  if (m.max_prop_size_in) out.push(`up to ${m.max_prop_size_in}" props`);
  if (m.kv) out.push(`${m.kv} KV`);
  if (m.max_thrust_g) out.push(`${m.max_thrust_g} g thrust`);
  if (m.continuous_current_a) out.push(`${m.continuous_current_a} A`);
  if (m.capacity_mah) out.push(`${m.capacity_mah} mAh ${m.voltage_v ?? ""}V`.trim());
  if (c.weight_g) out.push(`${c.weight_g} g`);
  return out.slice(0, 3);
}
