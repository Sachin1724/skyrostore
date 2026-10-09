"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Boxes,
  Wrench,
  Layers,
  Search,
  Plus,
  X,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Info,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Check,
} from "lucide-react";

function formatINR(val: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(val);
}

interface BulkItem {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  unit_price: number;
  requested_quantity: number;
  product_id?: string;
  category?: string;
}

const DEFAULT_ITEMS: BulkItem[] = [
  {
    id: "item-1",
    title: "T-Motor MN5212 Motor",
    subtitle: "850 KV | 320W",
    image: "/images/products/t-motor-mn5212.png",
    unit_price: 6499,
    requested_quantity: 20,
    category: "Motors",
  },
  {
    id: "item-2",
    title: "Hobbywing 60A ESC",
    subtitle: "6S | BLHeli_32",
    image: "/images/products/hobbywing-60a-esc.png",
    unit_price: 4299,
    requested_quantity: 20,
    category: "ESCs",
  },
  {
    id: "item-3",
    title: "X450 Carbon Frame Kit",
    subtitle: "450mm | 4 Arm",
    image: "/images/products/x450-carbon-frame.png",
    unit_price: 6499,
    requested_quantity: 10,
    category: "Frames",
  },
  {
    id: "item-4",
    title: "LiPo 6S 5000mAh 50C",
    subtitle: "XT60 | 6S | 5000mAh",
    image: "/images/products/lipo-6s-5000mah.png",
    unit_price: 8999,
    requested_quantity: 20,
    category: "Batteries",
  },
];

const AVAILABLE_CATALOG_ITEMS: Omit<BulkItem, "id" | "requested_quantity">[] = [
  {
    title: "Holybro Pixhawk 6X Autopilot",
    subtitle: "Triple IMU | STM32H753",
    image: "/images/products/pixhawk-6x.png",
    unit_price: 24999,
    category: "Flight Controllers",
  },
  {
    title: "Carbon Fiber Propellers 15x5.5",
    subtitle: "Matched CW/CCW Pair",
    image: "/images/products/carbon-fiber-prop-15in.png",
    unit_price: 2199,
    category: "Propellers",
  },
  {
    title: "Here3+ Precision RTK GNSS",
    subtitle: "Dual Compass | Centimeter RTK",
    image: "/images/products/here3-rtk-gps.png",
    unit_price: 18500,
    category: "GPS & Navigation",
  },
  {
    title: "CUAV P9 Long-Range Telemetry Radio",
    subtitle: "840-845MHz | 60km Line-of-sight",
    image: "/images/products/cuav-telemetry-radio.png",
    unit_price: 14200,
    category: "Telemetry",
  },
];

export function BulkOrderRequestForm() {
  const searchParams = useSearchParams();
  const initialProductId = searchParams.get("product") || undefined;
  const initialTitle = searchParams.get("title") || undefined;
  const initialConfigId = searchParams.get("config") || undefined;

  // 1. Request Type
  const [requestType, setRequestType] = useState<"BULK_PURCHASE" | "CUSTOM_BUILD" | "BULK_CUSTOM_BUILD">(
    initialConfigId ? "CUSTOM_BUILD" : "BULK_PURCHASE"
  );

  // Stepper state (1 to 5)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Active Tab in Step 1
  const [activeTab, setActiveTab] = useState<"add" | "saved" | "custom">("add");

  // Filter state for Step 1
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");

  // Selected items list
  const [items, setItems] = useState<BulkItem[]>(() => {
    if (initialTitle) {
      return [
        {
          id: `item-${Date.now()}`,
          title: initialTitle,
          subtitle: "Enterprise Component",
          image: "/images/products/t-motor-mn5212.png",
          unit_price: 7500,
          requested_quantity: 10,
          product_id: initialProductId,
        },
      ];
    }
    return DEFAULT_ITEMS;
  });

  // Step 2: Custom Engineering Requirements
  const [intendedApplication, setIntendedApplication] = useState("LiDAR Mapping & Land Survey");
  const [targetPayloadG, setTargetPayloadG] = useState("1500");
  const [targetFlightTimeMin, setTargetFlightTimeMin] = useState("35");
  const [operatingEnvironment, setOperatingEnvironment] = useState("High Altitude, Dusty (-10°C to +45°C)");
  const [sensorsPayload, setSensorsPayload] = useState("LiDAR scanner + RGB mapping camera");
  const [telemetryRequirements, setTelemetryRequirements] = useState("Encrypted dual 868MHz telemetry + 4G LTE");
  const [targetUnitCount, setTargetUnitCount] = useState("1");
  const [additionalSpecifications, setAdditionalSpecifications] = useState("");

  // Step 3: Contact Details
  const [contactName, setContactName] = useState("Sachin Mallick");
  const [email, setEmail] = useState("sachin@example.com");
  const [phone, setPhone] = useState("+91 98765 43210");
  const [companyName, setCompanyName] = useState("AeroDynamics India Pvt Ltd");
  const [gstin, setGstin] = useState("27AABCA1234F1Z8");

  // Step 4: Delivery & Notes
  const [deliveryCity, setDeliveryCity] = useState("Rourkela");
  const [deliveryState, setDeliveryState] = useState("Odisha");
  const [deliveryPincode, setDeliveryPincode] = useState("769004");
  const [timeframeWeeks, setTimeframeWeeks] = useState("4");
  const [budgetRange, setBudgetRange] = useState("INR 5,00,000 - 15,00,000");

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedData, setSubmittedData] = useState<{
    id: string;
    reference_no: string;
  } | null>(null);

  // Quick Add Catalog modal state
  const [showAddCatalogModal, setShowAddCatalogModal] = useState(false);

  // Calculations
  const totalUnits = items.reduce((sum, item) => sum + item.requested_quantity, 0);
  const totalEstimatedCost = items.reduce(
    (sum, item) => sum + item.unit_price * item.requested_quantity,
    0
  );

  const handleUpdateQuantity = (id: string, delta: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newQty = Math.max(1, item.requested_quantity + delta);
          return { ...item, requested_quantity: newQty };
        }
        return item;
      })
    );
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearAll = () => {
    setItems([]);
  };

  const handleAddCatalogProduct = (product: (typeof AVAILABLE_CATALOG_ITEMS)[0]) => {
    const existing = items.find((i) => i.title === product.title);
    if (existing) {
      handleUpdateQuantity(existing.id, 5);
    } else {
      setItems((prev) => [
        ...prev,
        {
          id: `item-${Date.now()}`,
          ...product,
          requested_quantity: 10,
        },
      ]);
    }
    setShowAddCatalogModal(false);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      if (items.length === 0 && requestType === "BULK_PURCHASE") {
        throw new Error("Please add at least one product to your bulk request.");
      }
      if (!contactName.trim() || !email.trim()) {
        throw new Error("Please fill in contact name and email address.");
      }

      const payload = {
        contact_name: contactName,
        email,
        phone: phone || null,
        company_name: companyName || null,
        gstin: gstin || null,
        request_type: requestType,
        items: items.map((i) => ({
          title: i.title,
          requested_quantity: Number(i.requested_quantity),
          product_id: i.product_id || null,
          notes: i.subtitle || null,
        })),
        intended_application: requestType !== "BULK_PURCHASE" ? intendedApplication : null,
        target_payload_g: requestType !== "BULK_PURCHASE" && targetPayloadG ? Number(targetPayloadG) : null,
        target_flight_time_min: requestType !== "BULK_PURCHASE" && targetFlightTimeMin ? Number(targetFlightTimeMin) : null,
        operating_environment: requestType !== "BULK_PURCHASE" ? operatingEnvironment : null,
        sensors_payload: requestType !== "BULK_PURCHASE" ? sensorsPayload : null,
        telemetry_requirements: requestType !== "BULK_PURCHASE" ? telemetryRequirements : null,
        target_unit_count: requestType !== "BULK_PURCHASE" ? Number(targetUnitCount) || 1 : 1,
        additional_specifications: additionalSpecifications || null,
        delivery_city: deliveryCity || null,
        delivery_state: deliveryState || null,
        delivery_pincode: deliveryPincode || null,
        timeframe_weeks: timeframeWeeks ? Number(timeframeWeeks) : null,
        budget_range: budgetRange || null,
      };

      const res = await fetch("/api/bulk-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit bulk order request.");
      }

      setSubmittedData({
        id: data.request.id,
        reference_no: data.request.reference_no,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.subtitle.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      categoryFilter === "All Categories" || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const nextStepLabel =
    currentStep === 1
      ? "Next: Requirements"
      : currentStep === 2
      ? "Next: Contact Details"
      : currentStep === 3
      ? "Next: Delivery & Notes"
      : currentStep === 4
      ? "Next: Review & Submit"
      : "Submit Formal Request";

  if (submittedData) {
    return (
      <div
        className="rounded-md border border-border bg-white p-8 text-center shadow-sm"
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent/20 text-graphite">
          <CheckCircle2 className="h-8 w-8 stroke-[2.2] text-graphite" />
        </div>
        <h2 className="mt-4 text-[24px] font-bold text-graphite">
          Bulk Order Request Submitted
        </h2>
        <p className="mt-2 text-[14px] text-text-secondary">
          Your formal request has been recorded under reference number:
        </p>
        <div className="mt-3 inline-block rounded border border-border bg-surface-soft px-5 py-2.5 font-mono text-[20px] font-bold tracking-wider text-graphite">
          {submittedData.reference_no}
        </div>
        <p className="mx-auto mt-4 max-w-lg text-[13px] leading-relaxed text-text-muted">
          Our engineering &amp; commercial team is preparing an itemized GST quotation with volume discount tiers and delivery schedules. You will receive an email confirmation and can track updates in your dashboard.
        </p>

        <div className="mt-8 flex justify-center gap-4">
          <Link
            href="/account/orders"
            className="inline-flex items-center gap-2 rounded-sm bg-graphite px-6 py-3 text-[13px] font-semibold text-white transition-colors hover:bg-graphite-soft"
          >
            Go to My Account
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/parts"
            className="inline-flex items-center gap-2 rounded-sm border border-border bg-white px-6 py-3 text-[13px] font-semibold text-graphite transition-colors hover:bg-surface-soft"
          >
            Explore UAV Catalog
          </Link>
        </div>
      </div>
    );
  }

  const inputClass =
    "w-full px-3 py-2 text-[13px] text-graphite bg-surface placeholder:text-text-disabled focus:outline-none focus:ring-1 focus:ring-graphite focus:border-graphite rounded-sm border border-color-border";

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center gap-2.5 rounded-sm border border-rose-200 bg-rose-50 p-4 text-[13px] text-rose-800">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* TOP 3-CARD REQUEST TYPE SWITCHER */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Card 1: Bulk Purchase */}
        <button
          type="button"
          onClick={() => setRequestType("BULK_PURCHASE")}
          className={`relative flex items-center justify-between rounded-lg border p-5 text-left transition-all ${
            requestType === "BULK_PURCHASE"
              ? "border-[#84cc16] bg-[#f7fee7] ring-1 ring-[#84cc16]"
              : "border-border bg-white hover:border-gray-300"
          }`}
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-surface-soft text-graphite">
              <Boxes className="h-6 w-6 stroke-[1.8]" />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-graphite">Bulk Purchase</h3>
              <p className="mt-0.5 text-[12px] text-text-muted">
                Multiple units of existing products
              </p>
            </div>
          </div>
          <div className="shrink-0 pl-3">
            {requestType === "BULK_PURCHASE" ? (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#84cc16] text-white">
                <Check className="h-3.5 w-3.5 stroke-[3]" />
              </div>
            ) : (
              <div className="h-5 w-5 rounded-full border border-gray-300" />
            )}
          </div>
        </button>

        {/* Card 2: Custom UAV Build */}
        <button
          type="button"
          onClick={() => setRequestType("CUSTOM_BUILD")}
          className={`relative flex items-center justify-between rounded-lg border p-5 text-left transition-all ${
            requestType === "CUSTOM_BUILD"
              ? "border-[#84cc16] bg-[#f7fee7] ring-1 ring-[#84cc16]"
              : "border-border bg-white hover:border-gray-300"
          }`}
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-surface-soft text-graphite">
              <Wrench className="h-6 w-6 stroke-[1.8]" />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-graphite">Custom UAV Build</h3>
              <p className="mt-0.5 text-[12px] text-text-muted">
                Tailored configuration for your needs
              </p>
            </div>
          </div>
          <div className="shrink-0 pl-3">
            {requestType === "CUSTOM_BUILD" ? (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#84cc16] text-white">
                <Check className="h-3.5 w-3.5 stroke-[3]" />
              </div>
            ) : (
              <div className="h-5 w-5 rounded-full border border-gray-300" />
            )}
          </div>
        </button>

        {/* Card 3: Bulk Custom Build */}
        <button
          type="button"
          onClick={() => setRequestType("BULK_CUSTOM_BUILD")}
          className={`relative flex items-center justify-between rounded-lg border p-5 text-left transition-all ${
            requestType === "BULK_CUSTOM_BUILD"
              ? "border-[#84cc16] bg-[#f7fee7] ring-1 ring-[#84cc16]"
              : "border-border bg-white hover:border-gray-300"
          }`}
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-surface-soft text-graphite">
              <Layers className="h-6 w-6 stroke-[1.8]" />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-graphite">Bulk Custom Build</h3>
              <p className="mt-0.5 text-[12px] text-text-muted">
                Multiple custom UAVs
              </p>
            </div>
          </div>
          <div className="shrink-0 pl-3">
            {requestType === "BULK_CUSTOM_BUILD" ? (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#84cc16] text-white">
                <Check className="h-3.5 w-3.5 stroke-[3]" />
              </div>
            ) : (
              <div className="h-5 w-5 rounded-full border border-gray-300" />
            )}
          </div>
        </button>
      </div>

      {/* MAIN 2-COLUMN WORKSPACE: LEFT WORKFLOW & RIGHT SUMMARY */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        {/* LEFT COLUMN: Stepper + Active Step Content (8 cols) */}
        <div className="space-y-6 lg:col-span-8">
          <div className="rounded-lg border border-border bg-white p-6 shadow-sm">
            {/* Horizontal or Sub-step progress indicators */}
            <div className="flex flex-wrap items-center justify-between border-b border-border pb-5">
              {[
                { step: 1, title: "Products & Quantity", desc: "Select products or configurations" },
                { step: 2, title: "Requirements", desc: "Application & technical needs" },
                { step: 3, title: "Contact Details", desc: "Your information" },
                { step: 4, title: "Delivery & Notes", desc: "Timeline & delivery" },
                { step: 5, title: "Review & Submit", desc: "Confirm your request" },
              ].map((s) => {
                const isActive = currentStep === s.step;
                const isPassed = currentStep > s.step;
                return (
                  <button
                    key={s.step}
                    type="button"
                    onClick={() => setCurrentStep(s.step)}
                    className="flex items-center gap-2.5 py-1 text-left transition-opacity hover:opacity-80"
                  >
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-bold ${
                        isActive
                          ? "bg-[#84cc16] text-white"
                          : isPassed
                          ? "bg-graphite text-white"
                          : "bg-surface-soft text-text-muted"
                      }`}
                    >
                      {s.step}
                    </div>
                    <div className="hidden sm:block">
                      <p
                        className={`text-[12px] font-bold ${
                          isActive ? "text-graphite" : "text-text-secondary"
                        }`}
                      >
                        {s.title}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* STEP 1: SELECT PRODUCTS AND QUANTITIES */}
            {currentStep === 1 && (
              <div className="mt-6 space-y-6">
                <div>
                  <h2 className="text-[20px] font-bold tracking-tight text-graphite">
                    Select Products and Quantities
                  </h2>
                  <p className="mt-1 text-[13px] text-text-muted">
                    Add products, configurations or custom build requirements.
                  </p>
                </div>

                {/* Sub-tabs matching mockup */}
                <div className="flex items-center gap-6 border-b border-border">
                  <button
                    type="button"
                    onClick={() => setActiveTab("add")}
                    className={`pb-2.5 text-[13px] font-bold transition-all ${
                      activeTab === "add"
                        ? "border-b-2 border-[#84cc16] text-graphite"
                        : "text-text-muted hover:text-graphite"
                    }`}
                  >
                    Add Products
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("saved")}
                    className={`pb-2.5 text-[13px] font-bold transition-all ${
                      activeTab === "saved"
                        ? "border-b-2 border-[#84cc16] text-graphite"
                        : "text-text-muted hover:text-graphite"
                    }`}
                  >
                    Use Saved Configuration
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("custom");
                      setRequestType("CUSTOM_BUILD");
                      setCurrentStep(2);
                    }}
                    className={`pb-2.5 text-[13px] font-bold transition-all ${
                      activeTab === "custom"
                        ? "border-b-2 border-[#84cc16] text-graphite"
                        : "text-text-muted hover:text-graphite"
                    }`}
                  >
                    Custom Requirements
                  </button>
                </div>

                {/* Search & Category Filter Bar */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                    <input
                      type="text"
                      placeholder="Search products, parts or UAVs..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full rounded-md border border-border bg-white py-2 pl-9 pr-4 text-[13px] text-graphite placeholder:text-text-disabled focus:border-graphite focus:outline-none"
                    />
                  </div>
                  <div className="w-full sm:w-48">
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="w-full rounded-md border border-border bg-white px-3 py-2 text-[13px] font-medium text-graphite focus:border-graphite focus:outline-none"
                    >
                      <option>All Categories</option>
                      <option>Motors</option>
                      <option>ESCs</option>
                      <option>Frames</option>
                      <option>Batteries</option>
                      <option>Flight Controllers</option>
                      <option>Propellers</option>
                    </select>
                  </div>
                </div>

                {/* Products Table matching mockup */}
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full text-left text-[13px]">
                    <thead className="border-b border-border bg-surface-soft text-[11px] font-bold uppercase tracking-wider text-text-muted">
                      <tr>
                        <th className="px-4 py-3">Product</th>
                        <th className="px-4 py-3">Unit Price</th>
                        <th className="px-4 py-3">Quantity</th>
                        <th className="px-4 py-3 text-right">Total</th>
                        <th className="px-3 py-3 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-white">
                      {filteredItems.map((item) => (
                        <tr key={item.id} className="transition-colors hover:bg-surface-soft/50">
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded border border-border bg-surface-soft">
                                <Image
                                  src={item.image}
                                  alt={item.title}
                                  fill
                                  className="object-contain p-1"
                                />
                              </div>
                              <div>
                                <p className="font-bold text-graphite">{item.title}</p>
                                <p className="text-[11px] text-text-muted">{item.subtitle}</p>
                              </div>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3.5 font-bold text-graphite">
                            {formatINR(item.unit_price)}
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="inline-flex items-center rounded border border-border bg-white">
                              <button
                                type="button"
                                onClick={() => handleUpdateQuantity(item.id, -1)}
                                className="px-2.5 py-1 text-text-secondary transition-colors hover:bg-surface-soft hover:text-graphite"
                              >
                                &minus;
                              </button>
                              <span className="w-10 text-center font-bold text-graphite">
                                {item.requested_quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleUpdateQuantity(item.id, 1)}
                                className="px-2.5 py-1 text-text-secondary transition-colors hover:bg-surface-soft hover:text-graphite"
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3.5 text-right font-bold text-graphite">
                            {formatINR(item.unit_price * item.requested_quantity)}
                          </td>
                          <td className="px-3 py-3.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.id)}
                              className="text-text-muted transition-colors hover:text-rose-600"
                              title="Remove item"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {filteredItems.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-text-muted">
                            No products found in this category.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Table Bottom Action Row */}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddCatalogModal(true)}
                    className="inline-flex items-center gap-2 rounded border border-border bg-white px-4 py-2 text-[12px] font-bold text-graphite transition-colors hover:bg-surface-soft"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Another Product
                  </button>

                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="inline-flex items-center gap-1.5 text-[12px] font-medium text-rose-600 transition-colors hover:text-rose-700"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Clear All
                  </button>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setRequestType("CUSTOM_BUILD");
                      setCurrentStep(2);
                    }}
                    className="inline-flex items-center gap-2 rounded border border-border bg-white px-5 py-2.5 text-[12px] font-bold text-graphite transition-colors hover:bg-surface-soft"
                  >
                    Switch to Custom Build
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: REQUIREMENTS */}
            {currentStep === 2 && (
              <div className="mt-6 space-y-6">
                <div>
                  <h2 className="text-[20px] font-bold tracking-tight text-graphite">
                    Custom Engineering Requirements
                  </h2>
                  <p className="mt-1 text-[13px] text-text-muted">
                    Define operational targets, sensors, flight parameters and environmental constraints.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-[12px] font-medium text-text-secondary">
                      Intended Application
                    </label>
                    <input
                      type="text"
                      value={intendedApplication}
                      onChange={(e) => setIntendedApplication(e.target.value)}
                      placeholder="e.g. LiDAR Topographical Mapping, Thermal Inspection"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="text-[12px] font-medium text-text-secondary">
                      Target Payload (grams)
                    </label>
                    <input
                      type="number"
                      value={targetPayloadG}
                      onChange={(e) => setTargetPayloadG(e.target.value)}
                      placeholder="e.g. 2500"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="text-[12px] font-medium text-text-secondary">
                      Target Flight Time (minutes)
                    </label>
                    <input
                      type="number"
                      value={targetFlightTimeMin}
                      onChange={(e) => setTargetFlightTimeMin(e.target.value)}
                      placeholder="e.g. 45"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="text-[12px] font-medium text-text-secondary">
                      Operating Environment
                    </label>
                    <input
                      type="text"
                      value={operatingEnvironment}
                      onChange={(e) => setOperatingEnvironment(e.target.value)}
                      placeholder="e.g. High Altitude / Coastal Maritime / Desert"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="text-[12px] font-medium text-text-secondary">
                      Required Sensors / Gimbal Payload
                    </label>
                    <input
                      type="text"
                      value={sensorsPayload}
                      onChange={(e) => setSensorsPayload(e.target.value)}
                      placeholder="e.g. Sony A7R IV + 3-Axis Gremsy Gimbal"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="text-[12px] font-medium text-text-secondary">
                      Communication / Telemetry
                    </label>
                    <input
                      type="text"
                      value={telemetryRequirements}
                      onChange={(e) => setTelemetryRequirements(e.target.value)}
                      placeholder="e.g. Dual 868MHz + Microhard 4G Link"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="text-[12px] font-medium text-text-secondary">
                      Planned Unit Fleet Count
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={targetUnitCount}
                      onChange={(e) => setTargetUnitCount(e.target.value)}
                      placeholder="e.g. 5"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="inline-flex items-center gap-1.5 text-[13px] font-bold text-graphite hover:underline"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Products
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="rounded bg-graphite px-5 py-2.5 text-[13px] font-bold text-white transition-colors hover:bg-graphite-soft"
                  >
                    Proceed to Contact Details &rarr;
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: CONTACT DETAILS */}
            {currentStep === 3 && (
              <div className="mt-6 space-y-6">
                <div>
                  <h2 className="text-[20px] font-bold tracking-tight text-graphite">
                    Contact &amp; Enterprise Details
                  </h2>
                  <p className="mt-1 text-[13px] text-text-muted">
                    Your institutional contact details for official GST quotations and communications.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-[12px] font-medium text-text-secondary">Contact Name *</label>
                    <input
                      type="text"
                      required
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="text-[12px] font-medium text-text-secondary">Official Email Address *</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="text-[12px] font-medium text-text-secondary">Phone Number</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="text-[12px] font-medium text-text-secondary">Company / Organization</label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-[12px] font-medium text-text-secondary">GSTIN (for B2B Tax Credit)</label>
                    <input
                      type="text"
                      value={gstin}
                      onChange={(e) => setGstin(e.target.value)}
                      placeholder="e.g. 21AABCS1234D1Z5"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="inline-flex items-center gap-1.5 text-[13px] font-bold text-graphite hover:underline"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Requirements
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(4)}
                    className="rounded bg-graphite px-5 py-2.5 text-[13px] font-bold text-white transition-colors hover:bg-graphite-soft"
                  >
                    Proceed to Delivery &amp; Notes &rarr;
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: DELIVERY & NOTES */}
            {currentStep === 4 && (
              <div className="mt-6 space-y-6">
                <div>
                  <h2 className="text-[20px] font-bold tracking-tight text-graphite">
                    Delivery &amp; Commercial Notes
                  </h2>
                  <p className="mt-1 text-[13px] text-text-muted">
                    Specify delivery locations, timeframe expectations, and compliance guidelines.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-[12px] font-medium text-text-secondary">Delivery City</label>
                    <input
                      type="text"
                      value={deliveryCity}
                      onChange={(e) => setDeliveryCity(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="text-[12px] font-medium text-text-secondary">Delivery State</label>
                    <input
                      type="text"
                      value={deliveryState}
                      onChange={(e) => setDeliveryState(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="text-[12px] font-medium text-text-secondary">Pincode</label>
                    <input
                      type="text"
                      value={deliveryPincode}
                      onChange={(e) => setDeliveryPincode(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="text-[12px] font-medium text-text-secondary">Required Lead Time (Weeks)</label>
                    <input
                      type="number"
                      min={1}
                      value={timeframeWeeks}
                      onChange={(e) => setTimeframeWeeks(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-[12px] font-medium text-text-secondary">Estimated Budget Range</label>
                    <input
                      type="text"
                      value={budgetRange}
                      onChange={(e) => setBudgetRange(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-[12px] font-medium text-text-secondary">Additional Notes &amp; Standards</label>
                    <textarea
                      rows={3}
                      value={additionalSpecifications}
                      onChange={(e) => setAdditionalSpecifications(e.target.value)}
                      placeholder="Specify any DGCA Type Certification requirements, custom packaging, or bench testing protocols..."
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="inline-flex items-center gap-1.5 text-[13px] font-bold text-graphite hover:underline"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Contact Details
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(5)}
                    className="rounded bg-graphite px-5 py-2.5 text-[13px] font-bold text-white transition-colors hover:bg-graphite-soft"
                  >
                    Review &amp; Submit Request &rarr;
                  </button>
                </div>
              </div>
            )}

            {/* STEP 5: REVIEW & SUBMIT */}
            {currentStep === 5 && (
              <div className="mt-6 space-y-6">
                <div>
                  <h2 className="text-[20px] font-bold tracking-tight text-graphite">
                    Review Formal Request
                  </h2>
                  <p className="mt-1 text-[13px] text-text-muted">
                    Verify all order details prior to transmitting your formal quotation request.
                  </p>
                </div>

                <div className="space-y-4 rounded border border-border bg-surface-soft p-4 text-[13px]">
                  <div className="flex justify-between border-b border-border pb-2">
                    <span className="text-text-muted">Request Type:</span>
                    <span className="font-bold text-graphite">
                      {requestType === "BULK_PURCHASE"
                        ? "Bulk Purchase"
                        : requestType === "CUSTOM_BUILD"
                        ? "Custom UAV Build"
                        : "Bulk Custom Build"}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-border pb-2">
                    <span className="text-text-muted">Customer Name:</span>
                    <span className="font-bold text-graphite">{contactName} ({companyName})</span>
                  </div>
                  <div className="flex justify-between border-b border-border pb-2">
                    <span className="text-text-muted">Email / Phone:</span>
                    <span className="font-bold text-graphite">{email} • {phone}</span>
                  </div>
                  <div className="flex justify-between border-b border-border pb-2">
                    <span className="text-text-muted">Delivery Location:</span>
                    <span className="font-bold text-graphite">{deliveryCity}, {deliveryState} - {deliveryPincode}</span>
                  </div>
                  <div className="flex justify-between border-b border-border pb-2">
                    <span className="text-text-muted">Total Components:</span>
                    <span className="font-bold text-graphite">{items.length} line items ({totalUnits} total units)</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="font-bold text-graphite">Estimated Commercial Subtotal:</span>
                    <span className="font-bold text-graphite">{formatINR(totalEstimatedCost)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(4)}
                    className="inline-flex items-center gap-1.5 text-[13px] font-bold text-graphite hover:underline"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Delivery
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSubmit()}
                    disabled={isSubmitting}
                    className="rounded bg-graphite px-8 py-3 text-[14px] font-bold text-white transition-colors hover:bg-graphite-soft disabled:opacity-50"
                  >
                    {isSubmitting ? "Submitting..." : "Submit Formal Request"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: REQUEST SUMMARY & WHY CHOOSE BULK (4 cols) */}
        <div className="space-y-6 lg:col-span-4">
          {/* Card 1: Request Summary */}
          <div className="rounded-lg border border-border bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h3 className="text-[16px] font-bold text-graphite">Request Summary</h3>
              <span className="text-[12px] text-text-muted">{items.length} items</span>
            </div>

            <div className="mt-4 space-y-3 text-[13px]">
              <div className="flex justify-between">
                <span className="text-text-secondary">Subtotal (Estimated)</span>
                <span className="font-bold text-graphite">{formatINR(totalEstimatedCost)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Quantity</span>
                <span className="font-bold text-graphite">{totalUnits} units</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Request Type</span>
                <span className="font-bold text-graphite">
                  {requestType === "BULK_PURCHASE"
                    ? "Bulk Purchase"
                    : requestType === "CUSTOM_BUILD"
                    ? "Custom UAV Build"
                    : "Bulk Custom Build"}
                </span>
              </div>
            </div>

            {/* Blue Info Callout Box matching mockup */}
            <div className="mt-5 flex gap-2.5 rounded-lg border border-sky-100 bg-[#f0f7ff] p-3.5 text-[12px] leading-relaxed text-[#1e40af]">
              <Info className="h-4 w-4 shrink-0 text-[#2563eb]" />
              <span>
                This is a request for quotation. Final pricing, tax, shipping and availability will be confirmed by our team.
              </span>
            </div>
          </div>

          {/* Card 2: Why Choose Bulk Orders? */}
          <div className="rounded-lg border border-border bg-white p-6 shadow-sm">
            <h3 className="text-[15px] font-bold text-graphite">
              Why Choose Bulk Orders?
            </h3>
            <ul className="mt-4 space-y-3 text-[12px] text-text-secondary">
              {[
                "Special volume pricing",
                "Custom configuration support",
                "Dedicated technical consultation",
                "Priority production and delivery",
                "GST invoicing for businesses",
                "After-sales support for fleet orders",
              ].map((benefit, i) => (
                <li key={i} className="flex items-center gap-2.5">
                  <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#84cc16] text-white">
                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                  </div>
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Black Next / Submit CTA Button matching mockup */}
          <div>
            <button
              type="button"
              onClick={() => {
                if (currentStep < 5) {
                  setCurrentStep(currentStep + 1);
                } else {
                  handleSubmit();
                }
              }}
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-graphite py-3.5 text-[14px] font-bold text-white transition-colors hover:bg-graphite-soft disabled:opacity-50"
            >
              <span>{nextStepLabel}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Add Catalog Modal */}
      {showAddCatalogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-lg border border-border bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-[16px] font-bold text-graphite">Add Catalog Component</h3>
              <button
                type="button"
                onClick={() => setShowAddCatalogModal(false)}
                className="text-text-muted hover:text-graphite"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4 max-h-96 space-y-3 overflow-y-auto">
              {AVAILABLE_CATALOG_ITEMS.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded border border-border p-3 transition-colors hover:bg-surface-soft"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded border border-border bg-surface-soft">
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        className="object-contain p-1"
                      />
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-graphite">{item.title}</p>
                      <p className="text-[11px] text-text-muted">{item.subtitle}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddCatalogProduct(item)}
                    className="rounded bg-graphite px-3 py-1.5 text-[12px] font-bold text-white hover:bg-graphite-soft"
                  >
                    Add
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
