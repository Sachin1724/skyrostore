"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
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
  | "camera"
  | "payload"
  | "power_module";

const ALL_STEPS: { slot: Slot; label: string; componentType: string; required: boolean }[] = [
  { slot: "frame", label: "Frame", componentType: "FRAME", required: true },
  { slot: "motor", label: "Motors", componentType: "MOTOR", required: true },
  { slot: "esc", label: "ESC", componentType: "ESC", required: true },
  { slot: "flight_controller", label: "Flight Controller", componentType: "FLIGHT_CONTROLLER", required: true },
  { slot: "propeller", label: "Propellers", componentType: "PROPELLER", required: true },
  { slot: "battery", label: "Battery", componentType: "BATTERY", required: true },
  { slot: "gps", label: "GPS", componentType: "GPS", required: false },
  { slot: "receiver", label: "Receiver", componentType: "RECEIVER", required: false },
  { slot: "telemetry", label: "Telemetry", componentType: "TELEMETRY", required: false },
  { slot: "camera", label: "Camera", componentType: "CAMERA", required: false },
  { slot: "payload", label: "Payload", componentType: "PAYLOAD", required: false },
  { slot: "power_module", label: "Power Module", componentType: "POWER_MODULE", required: false },
];

const SPEC_LABELS: Record<string, string> = {
  motor_count: "Motor Count",
  wheelbase_mm: "Wheelbase",
  max_propeller_size_in: "Max Prop Size",
  max_takeoff_weight_g: "Max Takeoff Weight",
  continuous_current_a: "Cont. Current",
  peak_current_a: "Peak Current",
  cell_count_min: "Min Cells",
  cell_count_max: "Max Cells",
  kv: "KV Rating",
  max_current_a: "Max Current",
  recommended_voltage_min_v: "Min Voltage",
  recommended_voltage_max_v: "Max Voltage",
  recommended_propeller_min_in: "Min Prop",
  recommended_propeller_max_in: "Max Prop",
  diameter_in: "Diameter",
  pitch_in: "Pitch",
  cell_count: "Cells",
  voltage_v: "Voltage",
  capacity_mah: "Capacity",
  continuous_discharge_a: "Max Discharge",
};

const SPEC_UNITS: Record<string, string> = {
  wheelbase_mm: "mm", max_propeller_size_in: '"', max_takeoff_weight_g: "g",
  continuous_current_a: "A", peak_current_a: "A", max_current_a: "A",
  recommended_voltage_min_v: "V", recommended_voltage_max_v: "V",
  recommended_propeller_min_in: '"', recommended_propeller_max_in: '"',
  diameter_in: '"', pitch_in: '"', voltage_v: "V",
  capacity_mah: "mAh", continuous_discharge_a: "A",
};

const SKIP_META = new Set(["component_type", "weight_g", "processor", "firmware_support", "constellations", "update_rate_hz"]);

interface Check {
  code: string;
  severity: "PASS" | "WARNING" | "ERROR";
  message: string;
}

interface ValidationResult {
  valid: boolean;
  errors: Check[];
  warnings: Check[];
  checks: Check[];
  estimates: {
    weight_g: number | null;
    flight_time_min: number | null;
    payload_capacity_g: number | null;
    price: number | null;
  };
  configuration_id?: string;
}

export function BuilderView({
  components,
}: {
  components: Record<string, UAVComponent[]>;
}) {
  const router = useRouter();
  // Only show steps that have available components (required steps always show)
  const steps = ALL_STEPS.filter(
    (s) => s.required || (components[s.componentType] && components[s.componentType].length > 0)
  );

  const emptySelected: Record<Slot, string | null> = {
    frame: null, motor: null, esc: null, flight_controller: null,
    propeller: null, battery: null, gps: null, receiver: null,
    telemetry: null, camera: null, payload: null, power_module: null,
  };

  const [activeStep, setActiveStep] = useState(0);
  const [selected, setSelected] = useState<Record<Slot, string | null>>(emptySelected);
  const [payloadGrams, setPayloadGrams] = useState(0);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [validating, setValidating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartAdded, setCartAdded] = useState(false);

  const selectedCount = Object.values(selected).filter(Boolean).length;

  const runValidation = useCallback(async () => {
    const body: Record<string, string | number> = {};
    for (const step of ALL_STEPS) {
      const vid = selected[step.slot];
      if (vid) body[`${step.slot}_variant_id`] = vid;
    }
    if (payloadGrams > 0) body.payload_grams = payloadGrams;
    if (Object.keys(body).length === 0) { setValidation(null); return; }

    setValidating(true);
    try {
      const res = await fetch("/api/uav/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      setValidation(await res.json());
    } catch { setValidation(null); }
    finally { setValidating(false); }
  }, [selected, payloadGrams]);

  useEffect(() => {
    if (selectedCount === 0) return;
    const timer = setTimeout(runValidation, 500);
    return () => clearTimeout(timer);
  }, [selectedCount, runValidation]);

  function selectComponent(slot: Slot, variantId: string) {
    setSelected((prev) => ({ ...prev, [slot]: prev[slot] === variantId ? null : variantId }));
    setSavedId(null);
    setCartAdded(false);
  }

  async function saveConfiguration() {
    const body: Record<string, string | number> = { name: "Custom UAV Build" };
    for (const step of ALL_STEPS) {
      const vid = selected[step.slot];
      if (vid) body[`${step.slot}_variant_id`] = vid;
    }
    if (payloadGrams > 0) body.payload_grams = payloadGrams;
    setSaving(true);
    try {
      const res = await fetch("/api/uav/configurations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.configuration_id) setSavedId(data.configuration_id);
    } catch { /* silent */ }
    finally { setSaving(false); }
  }

  async function addToCart() {
    const selections: Record<string, string> = {};
    for (const step of ALL_STEPS) {
      const vid = selected[step.slot];
      if (vid) selections[step.slot] = vid;
    }
    setAddingToCart(true);
    try {
      const cartId = typeof window !== "undefined" ? localStorage.getItem("cart_id") : null;
      const res = await fetch("/api/uav/add-to-cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selections, cart_id: cartId }),
      });
      const data = await res.json();
      if (data.cart_id) {
        localStorage.setItem("cart_id", data.cart_id);
        setCartAdded(true);
      }
    } catch { /* silent */ }
    finally { setAddingToCart(false); }
  }

  function getComponentForSlot(slot: Slot): UAVComponent | null {
    const vid = selected[slot];
    if (!vid) return null;
    const step = ALL_STEPS.find((s) => s.slot === slot);
    if (!step) return null;
    return (components[step.componentType] || []).find((c) => c.variant_id === vid) || null;
  }

  function getSpecEntries(comp: UAVComponent): [string, string][] {
    const entries: [string, string][] = [];
    for (const [key, value] of Object.entries(comp.metadata)) {
      if (SKIP_META.has(key) || !value) continue;
      const label = SPEC_LABELS[key] || key.replace(/_/g, " ");
      const unit = SPEC_UNITS[key] || "";
      entries.push([label, `${value}${unit}`]);
    }
    return entries;
  }

  const currentStep = steps[activeStep];
  const availableComponents = currentStep ? components[currentStep.componentType] || [] : [];
  const isReview = activeStep === steps.length;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      {/* Main panel */}
      <div>
        {/* Step nav */}
        <div className="mb-6 flex flex-wrap gap-2">
          {steps.map((step, i) => {
            const isSelected = !!selected[step.slot];
            const isActive = activeStep === i;
            return (
              <button
                key={step.slot}
                onClick={() => setActiveStep(i)}
                className={`text-[12px] font-medium transition-colors ${
                  isActive
                    ? "bg-graphite text-white"
                    : isSelected
                      ? "bg-success-soft text-success"
                      : "bg-surface-muted text-text-secondary hover:text-graphite"
                }`}
                style={{
                  borderRadius: "var(--radius-sm)",
                  padding: "6px 12px",
                  border: isActive ? "none" : "1px solid var(--color-border)",
                }}
              >
                {step.label}{isSelected && " ✓"}
              </button>
            );
          })}
          <button
            onClick={() => setActiveStep(steps.length)}
            className={`text-[12px] font-medium transition-colors ${
              isReview ? "bg-graphite text-white" : "bg-surface-muted text-text-secondary hover:text-graphite"
            }`}
            style={{
              borderRadius: "var(--radius-sm)",
              padding: "6px 12px",
              border: isReview ? "none" : "1px solid var(--color-border)",
            }}
          >
            Review
          </button>
        </div>

        {/* Component selection */}
        {!isReview && currentStep && (
          <div>
            <h2 className="mb-4 text-[18px] font-bold tracking-[-0.025em] text-graphite">
              Select {currentStep.label}
              {!currentStep.required && (
                <span className="ml-2 text-[11px] font-normal text-text-muted">Optional</span>
              )}
            </h2>
            {availableComponents.length === 0 ? (
              <p className="text-[13px] text-text-muted">
                No {currentStep.label.toLowerCase()} components available.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {availableComponents.map((comp) => {
                  const isChosen = selected[currentStep.slot] === comp.variant_id;
                  const specs = getSpecEntries(comp);
                  return (
                    <button
                      key={comp.variant_id}
                      onClick={() => selectComponent(currentStep.slot, comp.variant_id)}
                      className={`p-4 text-left transition-colors ${
                        isChosen ? "bg-accent-soft" : "bg-surface hover:bg-surface-soft"
                      }`}
                      style={{
                        borderRadius: "var(--radius-md)",
                        border: isChosen
                          ? "1px solid var(--color-accent)"
                          : "1px solid var(--color-border)",
                      }}
                    >
                      <div className="text-[14px] font-semibold text-graphite">
                        {comp.title.replace("[DEV] ", "")}
                      </div>
                      {comp.weight_g && (
                        <div className="mt-1 text-[11px] text-text-muted">{comp.weight_g}g</div>
                      )}
                      {specs.length > 0 && (
                        <div className="mt-2 space-y-0.5">
                          {specs.map(([label, value]) => (
                            <div key={label} className="flex justify-between text-[11px]">
                              <span className="text-text-muted">{label}</span>
                              <span className="font-medium text-text-secondary">{value}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {comp.price != null && (
                        <div className="mt-2 text-[15px] font-semibold text-graphite">
                          {formatPrice(comp.price, comp.currency_code)}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {currentStep.slot === "battery" && (
              <div className="mt-6">
                <label className="block text-[12px] font-semibold text-graphite">
                  Additional Payload (grams)
                </label>
                <input
                  type="number"
                  min={0}
                  value={payloadGrams}
                  onChange={(e) => setPayloadGrams(Math.max(0, Number(e.target.value)))}
                  className="mt-1 w-32 px-3 py-2 text-[13px] text-graphite"
                  style={{
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--color-border-strong)",
                    background: "var(--color-surface)",
                  }}
                />
              </div>
            )}

            <div className="mt-6 flex gap-3">
              {activeStep > 0 && (
                <button
                  onClick={() => setActiveStep(activeStep - 1)}
                  className="bg-surface px-5 py-2.5 text-[13px] font-semibold text-graphite transition-colors hover:bg-surface-muted"
                  style={{ borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border-strong)" }}
                >
                  Back
                </button>
              )}
              <button
                onClick={() => setActiveStep(activeStep + 1)}
                className="bg-graphite px-5 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-graphite-soft"
                style={{ borderRadius: "var(--radius-sm)" }}
              >
                {activeStep < steps.length - 1 ? "Next" : "Review"}
              </button>
            </div>
          </div>
        )}

        {/* Review */}
        {isReview && (
          <div>
            <h2 className="mb-4 text-[18px] font-bold tracking-[-0.025em] text-graphite">
              Configuration Review
            </h2>
            <div className="space-y-3">
              {steps.map((step) => {
                const comp = getComponentForSlot(step.slot);
                return (
                  <div
                    key={step.slot}
                    className="flex items-center justify-between p-3"
                    style={{ borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)" }}
                  >
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.04em] text-text-muted">
                        {step.label}
                        {!step.required && !comp && (
                          <span className="ml-1 font-normal">(optional)</span>
                        )}
                      </div>
                      <div className="text-[13px] font-medium text-graphite">
                        {comp ? comp.title.replace("[DEV] ", "") : step.required ? "Not selected" : "—"}
                      </div>
                    </div>
                    {comp?.price != null && (
                      <div className="text-[14px] font-semibold text-graphite">
                        {formatPrice(comp.price, comp.currency_code)}
                      </div>
                    )}
                  </div>
                );
              })}
              {payloadGrams > 0 && (
                <div className="p-3" style={{ borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)" }}>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.04em] text-text-muted">Additional Payload</div>
                  <div className="text-[13px] font-medium text-graphite">{payloadGrams}g</div>
                </div>
              )}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => setActiveStep(steps.length - 1)}
                className="bg-surface px-5 py-2.5 text-[13px] font-semibold text-graphite transition-colors hover:bg-surface-muted"
                style={{ borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border-strong)" }}
              >
                Back
              </button>
              {validation?.valid && !cartAdded && (
                <>
                  <button
                    onClick={saveConfiguration}
                    disabled={saving || !!savedId}
                    className="px-5 py-2.5 text-[13px] font-semibold text-graphite transition-colors disabled:opacity-50"
                    style={{
                      borderRadius: "var(--radius-sm)",
                      background: savedId ? "var(--color-success-soft)" : "var(--color-surface-muted)",
                      border: "1px solid var(--color-border)",
                    }}
                  >
                    {savedId ? "Saved ✓" : saving ? "Saving..." : "Save Configuration"}
                  </button>
                  <button
                    onClick={addToCart}
                    disabled={addingToCart}
                    className="px-5 py-2.5 text-[13px] font-semibold text-graphite transition-colors hover:bg-accent-hover disabled:opacity-50"
                    style={{
                      borderRadius: "var(--radius-sm)",
                      background: "var(--color-accent)",
                    }}
                  >
                    {addingToCart ? "Adding..." : "Add to Cart"}
                  </button>
                </>
              )}
              {cartAdded && (
                <button
                  onClick={() => router.push("/cart")}
                  className="px-5 py-2.5 text-[13px] font-semibold text-white bg-graphite transition-colors hover:bg-graphite-soft"
                  style={{ borderRadius: "var(--radius-sm)" }}
                >
                  View Cart
                </button>
              )}
            </div>

            {cartAdded && (
              <div
                className="mt-4 p-3 text-[13px] font-medium text-success"
                style={{ borderRadius: "var(--radius-sm)", background: "var(--color-success-soft)" }}
              >
                Components added to cart.
              </div>
            )}

            {savedId && (
              <div
                className="mt-4 p-3 text-[13px] font-medium text-success"
                style={{ borderRadius: "var(--radius-sm)", background: "var(--color-success-soft)" }}
              >
                Configuration saved: {savedId}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sidebar */}
      <div className="space-y-4">
        <div className="p-4" style={{ borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}>
          <h3 className="text-[13px] font-semibold text-graphite">Configuration</h3>
          <div className="mt-3 space-y-2">
            {steps.map((step) => {
              const comp = getComponentForSlot(step.slot);
              return (
                <div key={step.slot} className="flex items-center justify-between text-[12px]">
                  <span className="text-text-muted">{step.label}</span>
                  <span className={comp ? "font-medium text-success" : step.required ? "text-text-disabled" : "text-text-disabled"}>
                    {comp ? "✓" : "—"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {validation && (
          <div className="p-4" style={{ borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}>
            <h3 className="text-[13px] font-semibold text-graphite">Estimates</h3>
            <div className="mt-3 space-y-2 text-[13px]">
              {validation.estimates.weight_g != null && (
                <div className="flex justify-between">
                  <span className="text-text-secondary">Weight</span>
                  <span className="font-medium text-graphite">
                    {(validation.estimates.weight_g / 1000).toFixed(2)} kg
                  </span>
                </div>
              )}
              {validation.estimates.flight_time_min != null && (
                <div className="flex justify-between">
                  <span className="text-text-secondary">Flight Time</span>
                  <span className="font-medium text-graphite">
                    ~{validation.estimates.flight_time_min} min
                  </span>
                </div>
              )}
              {validation.estimates.payload_capacity_g != null && (
                <div className="flex justify-between">
                  <span className="text-text-secondary">Payload Capacity</span>
                  <span className="font-medium text-graphite">
                    {validation.estimates.payload_capacity_g}g
                  </span>
                </div>
              )}
            </div>
            <p className="mt-3 text-[11px] text-text-disabled">
              Estimated from component specifications
            </p>
          </div>
        )}

        {validation && validation.checks.length > 0 && (
          <div className="p-4" style={{ borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}>
            <h3 className="text-[13px] font-semibold text-graphite">
              Compatibility {validating && <span className="font-normal text-text-muted">(checking...)</span>}
            </h3>
            <div className="mt-3 space-y-2">
              {validation.checks.map((c) => (
                <div key={c.code} className="text-[12px]">
                  <span
                    className={
                      c.severity === "PASS"
                        ? "text-success"
                        : c.severity === "WARNING"
                          ? "text-warning"
                          : "text-error"
                    }
                  >
                    {c.severity === "PASS" ? "✓" : c.severity === "WARNING" ? "⚠" : "✗"}{" "}
                    {c.message}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {validation && !validation.valid && (
          <div
            className="p-3 text-[12px] font-medium text-error"
            style={{ borderRadius: "var(--radius-sm)", background: "var(--color-error-soft)" }}
          >
            Configuration has errors. Fix before adding to cart.
          </div>
        )}
      </div>
    </div>
  );
}
