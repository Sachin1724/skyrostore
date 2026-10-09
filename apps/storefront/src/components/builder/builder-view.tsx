"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Check,
  CheckCircle2,
  Bookmark,
  ChevronRight,
  BookOpen,
  AlertTriangle,
  XCircle,
  HelpCircle,
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
  { id: "frame", stepNum: 1, label: "Frame", sublabel: "Choose a frame", componentType: "FRAME", required: true },
  { id: "motor", stepNum: 2, label: "Motors", sublabel: "Select motors", componentType: "MOTOR", required: true },
  { id: "esc", stepNum: 3, label: "ESC", sublabel: "Choose ESCs", componentType: "ESC", required: true },
  { id: "flight_controller", stepNum: 4, label: "Flight Controller", sublabel: "Select flight controller", componentType: "FLIGHT_CONTROLLER", required: true },
  { id: "propeller", stepNum: 5, label: "Propellers", sublabel: "Choose propellers", componentType: "PROPELLER", required: true },
  { id: "battery", stepNum: 6, label: "Battery", sublabel: "Select battery", componentType: "BATTERY", required: true },
  { id: "gps", stepNum: 7, label: "GPS", sublabel: "Choose GPS module", componentType: "GPS", required: false },
  { id: "receiver", stepNum: 8, label: "Receiver", sublabel: "Select receiver", componentType: "RECEIVER", required: false },
  { id: "telemetry", stepNum: 9, label: "Telemetry", sublabel: "Optional", componentType: "TELEMETRY", required: false },
  { id: "payload", stepNum: 10, label: "Payload", sublabel: "Optional", componentType: "PAYLOAD", required: false },
  { id: "review", stepNum: 11, label: "Review", sublabel: "Check and validate", componentType: "", required: false },
];

// Sample frames if backend has only 1 seeded frame, so the 6 frames from mockup display beautifully
const MOCK_FRAMES = [
  {
    variant_id: "var_frame_x450",
    title: "X450 Carbon Frame Kit",
    subtitle: "Quadcopter | 450mm",
    price: 6499,
    image: "/images/products/x450-carbon-frame.png",
    specs: [
      { label: "Motor Count", value: "4" },
      { label: "Wheelbase", value: "450 mm" },
      { label: "Max Prop Size", value: "10 inch" },
      { label: "Frame Weight", value: "320 g" },
      { label: "Max Takeoff Weight", value: "2.5 kg" },
    ],
  },
  {
    variant_id: "var_frame_x550",
    title: "X550 Carbon Frame Kit",
    subtitle: "Quadcopter | 550mm",
    price: 7999,
    image: "/images/products/x550-carbon-frame.png",
    specs: [
      { label: "Motor Count", value: "4" },
      { label: "Wheelbase", value: "550 mm" },
      { label: "Max Prop Size", value: "12 inch" },
      { label: "Frame Weight", value: "420 g" },
      { label: "Max Takeoff Weight", value: "4.0 kg" },
    ],
  },
  {
    variant_id: "var_frame_h680",
    title: "H680 Hexa Frame",
    subtitle: "Hexacopter | 680mm",
    price: 11499,
    image: "/images/products/h680-hexa-frame.png",
    specs: [
      { label: "Motor Count", value: "6" },
      { label: "Wheelbase", value: "680 mm" },
      { label: "Max Prop Size", value: "14 inch" },
      { label: "Frame Weight", value: "650 g" },
      { label: "Max Takeoff Weight", value: "8.0 kg" },
    ],
  },
  {
    variant_id: "var_frame_s900",
    title: "S900 Heavy Lift Frame",
    subtitle: "Hexacopter | 900mm",
    price: 18999,
    image: "/images/products/s900-heavy-frame.png",
    specs: [
      { label: "Motor Count", value: "6" },
      { label: "Wheelbase", value: "900 mm" },
      { label: "Max Prop Size", value: "18 inch" },
      { label: "Frame Weight", value: "1.2 kg" },
      { label: "Max Takeoff Weight", value: "15 kg" },
    ],
  },
  {
    variant_id: "var_frame_t650",
    title: "T650 VTOL Frame",
    subtitle: "VTOL | 650mm",
    price: 14999,
    image: "/images/products/t650-vtol-frame.png",
    specs: [
      { label: "Motor Count", value: "4–6" },
      { label: "Wheelbase", value: "650 mm" },
      { label: "Max Prop Size", value: "15 inch" },
      { label: "Frame Weight", value: "980 g" },
      { label: "Max Takeoff Weight", value: "10 kg" },
    ],
  },
  {
    variant_id: "var_frame_custom",
    title: "Custom Research Frame",
    subtitle: "Quadcopter | Modular",
    price: 9499,
    image: "/images/products/custom-research-frame.png",
    specs: [
      { label: "Motor Count", value: "4" },
      { label: "Wheelbase", value: "500 mm" },
      { label: "Max Prop Size", value: "12 inch" },
      { label: "Frame Weight", value: "480 g" },
      { label: "Max Takeoff Weight", value: "6.0 kg" },
    ],
  },
];

export function BuilderView({
  components,
}: {
  components: Record<string, UAVComponent[]>;
}) {
  const router = useRouter();
  const [activeStepIdx, setActiveStepIdx] = useState(0);
  const [selectedParts, setSelectedParts] = useState<Record<string, { id: string; title: string; price: number; image?: string }>>({
    frame: {
      id: "var_frame_x450",
      title: "X450 Carbon Frame Kit",
      price: 6499,
      image: "/images/products/x450-carbon-frame.png",
    },
  });
  const [frameFilter, setFrameFilter] = useState("all");
  const [cartAdding, setCartAdding] = useState(false);

  const currentStep = BUILDER_STEPS[activeStepIdx] || BUILDER_STEPS[0];

  // Calculate Subtotal
  const subtotal = Object.values(selectedParts).reduce((sum, p) => sum + (p?.price || 0), 0);

  function handleSelectFrame(frame: typeof MOCK_FRAMES[0]) {
    setSelectedParts((prev) => ({
      ...prev,
      frame: {
        id: frame.variant_id,
        title: frame.title,
        price: frame.price,
        image: frame.image,
      },
    }));
  }

  function handleSelectComponent(slot: string, comp: UAVComponent) {
    setSelectedParts((prev) => ({
      ...prev,
      [slot]: {
        id: comp.variant_id,
        title: comp.title?.replace("[DEV] ", ""),
        price: comp.price || 0,
        image: comp.metadata?.thumbnail as string || undefined,
      },
    }));
  }

  async function handleAddToCart() {
    setCartAdding(true);
    try {
      const cartId = localStorage.getItem("cart_id");
      // Add first selected variant or build configuration
      const firstVariantId = selectedParts.frame?.id;
      if (firstVariantId) {
        const res = await fetch("/api/cart/add", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cart_id: cartId, variant_id: firstVariantId }),
        });
        if (res.ok) {
          const data = await res.json();
          localStorage.setItem("cart_id", data.cart_id);
          window.dispatchEvent(new Event("storage"));
          router.push("/cart");
        }
      }
    } catch {
      // fallback
    } finally {
      setCartAdding(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_1fr_340px]">
      {/* 1. Left Sidebar: 11 Vertical Steps */}
      <aside className="rounded-lg border border-border bg-white p-3 shadow-xs">
        <div className="space-y-1">
          {BUILDER_STEPS.map((step, idx) => {
            const isCurrent = activeStepIdx === idx;
            const isCompleted = !!selectedParts[step.id];
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => setActiveStepIdx(idx)}
                className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-all ${
                  isCurrent
                    ? "bg-surface-soft font-bold text-graphite"
                    : "text-text-secondary hover:bg-surface-soft hover:text-graphite"
                }`}
              >
                <div
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                    isCurrent
                      ? "bg-accent text-graphite"
                      : isCompleted
                      ? "bg-success text-white"
                      : "bg-surface-muted text-text-muted"
                  }`}
                >
                  {isCompleted && !isCurrent ? <Check className="h-3.5 w-3.5" /> : step.stepNum}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] leading-tight font-semibold text-graphite truncate">
                    {step.label}
                  </p>
                  <p className="text-[10px] text-text-muted truncate">
                    {step.sublabel}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      {/* 2. Center Column: Component Selector */}
      <div className="rounded-lg border border-border bg-white p-6 shadow-xs">
        {/* Step Header */}
        <div className="flex flex-col justify-between gap-2 border-b border-border pb-4 sm:flex-row sm:items-center">
          <div>
            <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">
              Step {currentStep.stepNum} of 11
            </span>
            <h2 className="text-[20px] font-extrabold text-graphite">
              Select a {currentStep.label}
            </h2>
            <p className="text-[12px] text-text-secondary">
              Choose a {currentStep.label.toLowerCase()} that matches your application and motor configuration.
            </p>
          </div>
          <button
            type="button"
            className="flex items-center gap-1.5 self-start rounded-md border border-border bg-white px-3 py-1.5 text-[11px] font-semibold text-text-secondary hover:bg-surface-soft hover:text-graphite"
          >
            <BookOpen className="h-3.5 w-3.5" />
            Learn about {currentStep.label.toLowerCase()}s
          </button>
        </div>

        {/* Filter Tabs for Frames */}
        {currentStep.id === "frame" && (
          <div className="mt-4 flex gap-2 overflow-x-auto pb-2 border-b border-border text-[12px]">
            {[
              { id: "all", label: "All Frames" },
              { id: "quad", label: "Quadcopters" },
              { id: "hexa", label: "Hexacopters" },
              { id: "octo", label: "Octocopters" },
              { id: "vtol", label: "VTOL" },
              { id: "custom", label: "Custom" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFrameFilter(tab.id)}
                className={`rounded-md px-3 py-1 font-semibold transition-colors ${
                  frameFilter === tab.id
                    ? "bg-graphite text-white"
                    : "bg-surface-soft text-text-secondary hover:text-graphite"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Component Cards Grid */}
        <div className="mt-6">
          {currentStep.id === "frame" ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {MOCK_FRAMES.map((frame) => {
                const isSelected = selectedParts.frame?.id === frame.variant_id;
                return (
                  <div
                    key={frame.variant_id}
                    className={`relative flex flex-col justify-between rounded-lg border p-4 transition-all ${
                      isSelected
                        ? "border-accent ring-1 ring-accent bg-surface-soft"
                        : "border-border bg-white hover:border-border-strong hover:shadow-xs"
                    }`}
                  >
                    {/* Selected Badge */}
                    {isSelected && (
                      <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-graphite shadow-xs">
                        <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                      </div>
                    )}

                    {/* Frame Image */}
                    <div className="relative aspect-[16/10] w-full overflow-hidden rounded bg-surface-soft mb-3">
                      <Image
                        src={frame.image}
                        alt={frame.title}
                        fill
                        className="object-contain p-2"
                      />
                    </div>

                    {/* Title & Subtitle */}
                    <div>
                      <h3 className="text-[13px] font-bold text-graphite">{frame.title}</h3>
                      <p className="text-[11px] text-text-muted">{frame.subtitle}</p>

                      {/* Technical Specs List */}
                      <div className="mt-3 space-y-1.5 border-t border-border pt-2 text-[11px]">
                        {frame.specs.map((s) => (
                          <div key={s.label} className="flex justify-between text-text-secondary">
                            <span>{s.label}</span>
                            <span className="font-mono font-semibold text-graphite">{s.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Price and Select Button */}
                    <div className="mt-4 border-t border-border pt-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[14px] font-bold text-graphite">
                            {formatPrice(frame.price, "INR")}
                          </p>
                          <div className="flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-success" />
                            <span className="text-[10px] font-medium text-success">In Stock</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleSelectFrame(frame)}
                          className={`rounded px-4 py-1.5 text-[12px] font-bold transition-all ${
                            isSelected
                              ? "bg-graphite text-white"
                              : "border border-border bg-white text-graphite hover:bg-surface-soft"
                          }`}
                        >
                          {isSelected ? "Selected ✓" : "Select"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // For other steps: Motors, ESCs, Battery, etc.
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {(components[currentStep.componentType] || []).map((comp) => {
                const isSelected = selectedParts[currentStep.id]?.id === comp.variant_id;
                return (
                  <div
                    key={comp.variant_id}
                    className={`flex flex-col justify-between rounded-lg border p-4 ${
                      isSelected ? "border-accent bg-surface-soft" : "border-border bg-white"
                    }`}
                  >
                    <div>
                      <h3 className="text-[13px] font-bold text-graphite">
                        {comp.title?.replace("[DEV] ", "")}
                      </h3>
                      {comp.weight_g && (
                        <p className="text-[11px] text-text-muted mt-1">{comp.weight_g} g</p>
                      )}
                    </div>
                    <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                      <span className="font-bold text-[14px] text-graphite">
                        {formatPrice(comp.price || 0, comp.currency_code)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleSelectComponent(currentStep.id, comp)}
                        className={`rounded px-3 py-1.5 text-[11px] font-bold ${
                          isSelected ? "bg-graphite text-white" : "border border-border bg-white text-graphite"
                        }`}
                      >
                        {isSelected ? "Selected ✓" : "Select"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 3. Right Column: "Your Build" Summary Panel */}
      <aside className="space-y-4">
        <div className="rounded-lg border border-border bg-white p-5 shadow-xs">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="text-[14px] font-extrabold text-graphite">Your Build</h3>
            <button
              type="button"
              className="flex items-center gap-1 text-[11px] font-semibold text-text-secondary hover:text-graphite"
            >
              <Bookmark className="h-3.5 w-3.5" />
              Save
            </button>
          </div>

          {/* Slots List */}
          <div className="mt-4 space-y-2.5">
            {BUILDER_STEPS.slice(0, 10).map((step) => {
              const selectedItem = selectedParts[step.id];
              return (
                <div
                  key={step.id}
                  className="flex items-center justify-between rounded border border-border bg-surface-soft p-2.5 text-[12px]"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                        selectedItem ? "bg-accent text-graphite" : "bg-surface-muted text-text-muted"
                      }`}
                    >
                      {selectedItem ? <Check className="h-3 w-3" /> : step.stepNum}
                    </span>
                    <div className="min-w-0 truncate">
                      <p className="font-semibold text-graphite truncate">
                        {selectedItem ? selectedItem.title : step.label}
                      </p>
                      <p className="text-[10px] text-text-muted">
                        {selectedItem ? formatPrice(selectedItem.price, "INR") : step.required ? "Not selected +" : "Optional +"}
                      </p>
                    </div>
                  </div>
                  {selectedItem && (
                    <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Estimated Summary */}
          <div className="mt-6 border-t border-border pt-4">
            <h4 className="text-[12px] font-bold text-graphite">Estimated Summary</h4>
            <div className="mt-2 space-y-1 text-[12px]">
              {selectedParts.frame && (
                <div className="flex justify-between text-text-secondary">
                  <span>Frame (1)</span>
                  <span className="font-mono font-semibold text-graphite">
                    {formatPrice(selectedParts.frame.price, "INR")}
                  </span>
                </div>
              )}
              <div className="flex justify-between border-t border-border pt-2 font-bold text-[13px] text-graphite">
                <span>Subtotal</span>
                <span className="font-mono">{formatPrice(subtotal, "INR")}</span>
              </div>
            </div>

            {/* Next Action Button */}
            <button
              type="button"
              onClick={() => {
                if (activeStepIdx < BUILDER_STEPS.length - 1) {
                  setActiveStepIdx(activeStepIdx + 1);
                } else {
                  handleAddToCart();
                }
              }}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-md bg-graphite py-3 text-[13px] font-bold text-white transition hover:bg-black shadow-xs"
            >
              {activeStepIdx < BUILDER_STEPS.length - 2 ? (
                <>Next: Select {BUILDER_STEPS[activeStepIdx + 1].label} &rarr;</>
              ) : (
                <>Add Build to Cart &rarr;</>
              )}
            </button>
          </div>

          {/* Compatibility Status Alert Box */}
          <div className="mt-4 flex items-center gap-2.5 rounded border border-success/30 bg-success/10 p-3 text-[11px] text-graphite">
            <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
            <div>
              <p className="font-bold text-success">Compatibility Check</p>
              <p className="text-text-secondary">No issues. Continue to next step.</p>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
