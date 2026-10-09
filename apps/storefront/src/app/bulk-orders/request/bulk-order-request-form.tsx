"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Package,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Cpu,
  Building2,
  MapPin,
  Clock,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

interface LineItem {
  id: string;
  title: string;
  requested_quantity: number;
  product_id?: string;
  variant_id?: string;
  configuration_reference?: string;
  notes?: string;
}

export function BulkOrderRequestForm() {
  const searchParams = useSearchParams();
  const initialProductId = searchParams.get("product") || undefined;
  const initialTitle = searchParams.get("title") || undefined;
  const initialConfigId = searchParams.get("config") || undefined;

  // Request Type
  const [requestType, setRequestType] = useState<"BULK_PURCHASE" | "CUSTOM_BUILD" | "BULK_CUSTOM_BUILD">(
    initialConfigId ? "CUSTOM_BUILD" : "BULK_PURCHASE"
  );

  // Line items
  const [items, setItems] = useState<LineItem[]>(() => {
    if (initialTitle || initialProductId) {
      return [
        {
          id: `item_1`,
          title: initialTitle || "Selected Product",
          requested_quantity: 10,
          product_id: initialProductId,
        },
      ];
    }
    if (initialConfigId) {
      return [
        {
          id: `item_1`,
          title: `Custom UAV Build (Config Ref: ${initialConfigId})`,
          requested_quantity: 1,
          configuration_reference: initialConfigId,
        },
      ];
    }
    return [
      {
        id: `item_1`,
        title: "Brushless Motor 400KV",
        requested_quantity: 20,
      },
    ];
  });

  // Custom Engineering Requirements
  const [intendedApplication, setIntendedApplication] = useState("LiDAR Mapping & Land Survey");
  const [targetPayloadG, setTargetPayloadG] = useState("1500");
  const [targetFlightTimeMin, setTargetFlightTimeMin] = useState("35");
  const [operatingEnvironment, setOperatingEnvironment] = useState("High Altitude, Dusty (-10°C to +45°C)");
  const [sensorsPayload, setSensorsPayload] = useState("LiDAR scanner + RGB mapping camera");
  const [telemetryRequirements, setTelemetryRequirements] = useState("Encrypted dual 868MHz telemetry + 4G LTE");
  const [targetUnitCount, setTargetUnitCount] = useState("1");
  const [additionalSpecifications, setAdditionalSpecifications] = useState("");

  // Commercial & Contact Details
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [gstin, setGstin] = useState("");
  const [deliveryCity, setDeliveryCity] = useState("");
  const [deliveryState, setDeliveryState] = useState("");
  const [deliveryPincode, setDeliveryPincode] = useState("");
  const [timeframeWeeks, setTimeframeWeeks] = useState("4");
  const [budgetRange, setBudgetRange] = useState("INR 5,00,000 - 15,00,000");

  // Form Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedData, setSubmittedData] = useState<{
    id: string;
    reference_no: string;
  } | null>(null);

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: `item_${Date.now()}`,
        title: "",
        requested_quantity: 10,
      },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleUpdateItem = (id: string, updates: Partial<LineItem>) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, ...updates } : i))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Validate line items
      for (const item of items) {
        if (!item.title.trim()) {
          throw new Error("Every line item must have a product or component title.");
        }
        if (!item.requested_quantity || item.requested_quantity < 1) {
          throw new Error("Line item quantity must be at least 1.");
        }
        if (item.requested_quantity > 10000) {
          throw new Error("Quantity per line item cannot exceed 10,000 units.");
        }
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
          variant_id: i.variant_id || null,
          configuration_reference: i.configuration_reference || null,
          notes: i.notes || null,
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
        throw new Error(data.error || "Failed to submit request.");
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

  if (submittedData) {
    return (
      <div
        className="bg-surface p-8 text-center"
        style={{ borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/10 text-success">
          <CheckCircle2 className="h-8 w-8 stroke-[2.2]" />
        </div>
        <h2 className="mt-4 text-[24px] font-bold text-graphite">
          Request Submitted Successfully
        </h2>
        <p className="mt-2 text-[14px] text-text-secondary">
          Your request reference number is:
        </p>
        <div className="mt-3 inline-block rounded bg-surface-soft px-4 py-2 font-mono text-[18px] font-bold tracking-wider text-graphite border border-color-border">
          {submittedData.reference_no}
        </div>
        <p className="mt-4 max-w-md mx-auto text-[13px] text-text-muted leading-relaxed">
          Our technical evaluation team is assessing your engineering criteria and propulsion curves. You can track this request in your account or respond when our formal quotation is issued.
        </p>

        <div className="mt-8 flex justify-center gap-4">
          <Link
            href="/account/bulk-requests"
            className="inline-flex items-center gap-2 bg-graphite px-5 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-graphite-soft"
            style={{ borderRadius: "var(--radius-sm)" }}
          >
            Track in My Account
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-surface px-5 py-2.5 text-[13px] font-semibold text-graphite transition-colors hover:bg-surface-muted border border-color-border"
            style={{ borderRadius: "var(--radius-sm)" }}
          >
            Return to Catalog
          </Link>
        </div>
      </div>
    );
  }

  const inputClass =
    "w-full px-3 py-2 text-[13px] text-graphite bg-surface placeholder:text-text-disabled focus:outline-none focus:ring-1 focus:ring-graphite focus:border-graphite rounded-sm border border-color-border";

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="flex items-center gap-2.5 rounded-sm bg-rose-50 p-4 text-[13px] text-rose-800 border border-rose-200">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* 1. Request Classification */}
      <div
        className="bg-surface p-6"
        style={{ borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}
      >
        <span className="font-mono text-[10px] uppercase font-bold tracking-wider text-text-muted">
          STEP 1 OF 3
        </span>
        <h2 className="mt-1 text-[16px] font-bold text-graphite">Select Request Type</h2>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            {
              id: "BULK_PURCHASE",
              title: "Bulk Purchase",
              desc: "Wholesale components or off-the-shelf UAV platforms in volume.",
            },
            {
              id: "CUSTOM_BUILD",
              title: "Custom UAV Build",
              desc: "Single bespoke aerial platform configured for unique payload & endurance.",
            },
            {
              id: "BULK_CUSTOM_BUILD",
              title: "Bulk Custom Builds",
              desc: "Production batch of custom-engineered UAVs for enterprise fleets.",
            },
          ].map((type) => (
            <button
              key={type.id}
              type="button"
              onClick={() => setRequestType(type.id as any)}
              className={`text-left p-4 rounded-sm border transition-all ${
                requestType === type.id
                  ? "border-graphite bg-surface-soft ring-1 ring-graphite"
                  : "border-color-border bg-surface hover:bg-surface-soft"
              }`}
            >
              <p className="text-[13px] font-bold text-graphite">{type.title}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-text-muted">{type.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* 2. Requested Components & Quantities */}
      <div
        className="bg-surface p-6"
        style={{ borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}
      >
        <div className="flex items-center justify-between border-b border-color-border pb-3">
          <div>
            <span className="font-mono text-[10px] uppercase font-bold tracking-wider text-text-muted">
              STEP 2 OF 3
            </span>
            <h2 className="mt-1 text-[16px] font-bold text-graphite">Requested Items & Quantities</h2>
          </div>
          <button
            type="button"
            onClick={handleAddItem}
            className="inline-flex items-center gap-1.5 bg-surface-soft px-3 py-1.5 text-[12px] font-semibold text-graphite hover:bg-surface-muted rounded-sm border border-color-border"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Item
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {items.map((item, idx) => (
            <div
              key={item.id}
              className="flex flex-wrap items-center gap-3 p-3 bg-surface-soft rounded-sm border border-color-border text-[12px]"
            >
              <div className="flex-1 min-w-[200px]">
                <label className="text-[11px] font-medium text-text-secondary">Item Title / Specification</label>
                <input
                  type="text"
                  required
                  value={item.title}
                  onChange={(e) => handleUpdateItem(item.id, { title: e.target.value })}
                  placeholder="e.g. T-Motor U8 II 100KV or Hexacopter Kit"
                  className={inputClass}
                />
              </div>
              <div className="w-28">
                <label className="text-[11px] font-medium text-text-secondary">Quantity</label>
                <input
                  type="number"
                  min={1}
                  max={10000}
                  required
                  value={item.requested_quantity}
                  onChange={(e) =>
                    handleUpdateItem(item.id, { requested_quantity: Math.max(1, parseInt(e.target.value, 10) || 1) })
                  }
                  className={inputClass}
                />
              </div>
              <div className="flex-1 min-w-[150px]">
                <label className="text-[11px] font-medium text-text-secondary">Notes / Batch Tolerance</label>
                <input
                  type="text"
                  value={item.notes || ""}
                  onChange={(e) => handleUpdateItem(item.id, { notes: e.target.value })}
                  placeholder="optional"
                  className={inputClass}
                />
              </div>
              {items.length > 1 && (
                <div className="pt-4">
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(item.id)}
                    className="text-text-disabled hover:text-rose-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 3. Custom Engineering Specifications (When Custom Build is chosen) */}
      {requestType !== "BULK_PURCHASE" && (
        <div
          className="bg-surface p-6"
          style={{ borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}
        >
          <div className="flex items-center gap-2 border-b border-color-border pb-3">
            <Cpu className="h-4 w-4 text-graphite" />
            <h2 className="text-[16px] font-bold text-graphite">Custom UAV Engineering Criteria</h2>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-[12px] font-medium text-text-secondary">Intended Application</label>
              <input
                type="text"
                value={intendedApplication}
                onChange={(e) => setIntendedApplication(e.target.value)}
                placeholder="e.g. LiDAR Topographical Mapping, Thermal Inspection"
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-[12px] font-medium text-text-secondary">Target Payload (grams)</label>
              <input
                type="number"
                value={targetPayloadG}
                onChange={(e) => setTargetPayloadG(e.target.value)}
                placeholder="e.g. 2500"
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-[12px] font-medium text-text-secondary">Target Flight Time Target (minutes)</label>
              <input
                type="number"
                value={targetFlightTimeMin}
                onChange={(e) => setTargetFlightTimeMin(e.target.value)}
                placeholder="e.g. 45"
                className={inputClass}
              />
              <span className="text-[10px] text-text-disabled">Customer target, verified against motor-prop thrust data.</span>
            </div>
            <div>
              <label className="text-[12px] font-medium text-text-secondary">Operating Environment</label>
              <input
                type="text"
                value={operatingEnvironment}
                onChange={(e) => setOperatingEnvironment(e.target.value)}
                placeholder="e.g. High Altitude / Coastal Maritime / Desert"
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-[12px] font-medium text-text-secondary">Required Sensors / Gimbal Payload</label>
              <input
                type="text"
                value={sensorsPayload}
                onChange={(e) => setSensorsPayload(e.target.value)}
                placeholder="e.g. Sony A7R IV + 3-Axis Gremsy Gimbal"
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-[12px] font-medium text-text-secondary">Communication / Telemetry</label>
              <input
                type="text"
                value={telemetryRequirements}
                onChange={(e) => setTelemetryRequirements(e.target.value)}
                placeholder="e.g. Dual 868MHz + Microhard 4G Link"
                className={inputClass}
              />
            </div>
          </div>
        </div>
      )}

      {/* 4. Commercial & Delivery Details */}
      <div
        className="bg-surface p-6"
        style={{ borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}
      >
        <span className="font-mono text-[10px] uppercase font-bold tracking-wider text-text-muted">
          STEP 3 OF 3
        </span>
        <h2 className="mt-1 text-[16px] font-bold text-graphite">Contact & Commercial Assurances</h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-[12px] font-medium text-text-secondary">Contact Name *</label>
            <input
              type="text"
              required
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="e.g. Dr. Rajesh Sharma"
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
              placeholder="e.g. rajesh@aerospace-labs.in"
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-[12px] font-medium text-text-secondary">Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-[12px] font-medium text-text-secondary">Company / Organization Name</label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. AeroTech Precision Systems"
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-[12px] font-medium text-text-secondary">GSTIN (for B2B Input Tax Credit)</label>
            <input
              type="text"
              value={gstin}
              onChange={(e) => setGstin(e.target.value)}
              placeholder="e.g. 27AABCA1234F1Z8"
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-[12px] font-medium text-text-secondary">Delivery City & State</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={deliveryCity}
                onChange={(e) => setDeliveryCity(e.target.value)}
                placeholder="City"
                className={inputClass}
              />
              <input
                type="text"
                value={deliveryState}
                onChange={(e) => setDeliveryState(e.target.value)}
                placeholder="State"
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className="text-[12px] font-medium text-text-secondary">Preferred Lead Time (Weeks)</label>
            <input
              type="number"
              min={1}
              value={timeframeWeeks}
              onChange={(e) => setTimeframeWeeks(e.target.value)}
              placeholder="e.g. 4"
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-[12px] font-medium text-text-secondary">Estimated Budget Range</label>
            <input
              type="text"
              value={budgetRange}
              onChange={(e) => setBudgetRange(e.target.value)}
              placeholder="e.g. ₹5,00,000 - ₹10,00,000"
              className={inputClass}
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="text-[12px] font-medium text-text-secondary">Additional Notes / Compliance Standards</label>
          <textarea
            rows={3}
            value={additionalSpecifications}
            onChange={(e) => setAdditionalSpecifications(e.target.value)}
            placeholder="Specify any DGCA Type Certification requirements, custom packaging, or bench testing protocols..."
            className={inputClass}
          />
        </div>
      </div>

      {/* Submission Action */}
      <div className="flex items-center justify-between pt-4">
        <div className="flex items-center gap-2 text-[12px] text-text-muted">
          <ShieldCheck className="h-4 w-4 text-success" />
          <span>Server-validated engineering data. Formal quotations issued with signed GST invoices.</span>
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 bg-graphite px-8 py-3.5 text-[14px] font-semibold text-white transition-colors hover:bg-graphite-soft disabled:opacity-50"
          style={{ borderRadius: "var(--radius-sm)" }}
        >
          {isSubmitting ? "Submitting Request..." : "Submit Formal Request"}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}
