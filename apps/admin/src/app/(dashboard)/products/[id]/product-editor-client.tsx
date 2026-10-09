"use client";

import { useState } from "react";
import Link from "next/link";
import {
  COMPONENT_SPEC_TEMPLATES,
  extractTechnicalSpecs,
  TechnicalSpecificationField,
  SpecificationTemplateField,
} from "@/lib/technical-specs";
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  Layers,
  Cpu,
  ShieldAlert,
  Info,
} from "lucide-react";

interface ProductEditorClientProps {
  initialProduct: Record<string, unknown>;
}

export function ProductEditorClient({ initialProduct }: ProductEditorClientProps) {
  const metadata = (initialProduct.metadata as Record<string, unknown>) || {};
  const existingSpecs = extractTechnicalSpecs(metadata);

  // Basic Information
  const [title, setTitle] = useState((initialProduct.title as string) || "");
  const [handle, setHandle] = useState((initialProduct.handle as string) || "");
  const [description, setDescription] = useState((initialProduct.description as string) || "");

  // Technical Specifications
  const initialComponentType =
    existingSpecs?.componentType ||
    (metadata.component_type as string) ||
    "MOTOR";

  const [componentType, setComponentType] = useState<string>(initialComponentType);

  // Template fields state (canonical & standard)
  const [templateValues, setTemplateValues] = useState<Record<string, string | number | boolean>>(() => {
    const vals: Record<string, string | number | boolean> = {};
    if (existingSpecs?.fields) {
      for (const [k, v] of Object.entries(existingSpecs.fields)) {
        if (v !== undefined && v !== null) {
          vals[k] = v as string | number | boolean;
        }
      }
    }
    // Also merge flat metadata if not already present
    for (const [k, v] of Object.entries(metadata)) {
      if (k === "technical_specs" || k === "sku" || k === "id") continue;
      if (vals[k] === undefined && v !== undefined && v !== null) {
        vals[k] = v as string | number | boolean;
      }
    }
    return vals;
  });

  // Custom specifications state
  const [customSpecs, setCustomSpecs] = useState<TechnicalSpecificationField[]>(() => {
    return existingSpecs?.additionalSpecifications || [];
  });

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"specs" | "basic" | "commercial">("specs");

  const currentTemplate = COMPONENT_SPEC_TEMPLATES[componentType] || null;

  // Group template fields by group
  const groupedTemplateFields: Record<string, SpecificationTemplateField[]> = {};
  if (currentTemplate) {
    for (const f of currentTemplate.fields) {
      if (!groupedTemplateFields[f.group]) {
        groupedTemplateFields[f.group] = [];
      }
      groupedTemplateFields[f.group].push(f);
    }
  }

  const handleTemplateValueChange = (key: string, rawVal: string, fieldType: string) => {
    setTemplateValues((prev) => {
      const next = { ...prev };
      if (rawVal.trim() === "") {
        delete next[key]; // Unknown values remain unknown, not 0
      } else if (fieldType === "number") {
        const num = Number(rawVal);
        if (!isNaN(num)) {
          next[key] = num;
        } else {
          next[key] = rawVal;
        }
      } else if (fieldType === "boolean") {
        next[key] = rawVal === "true";
      } else {
        next[key] = rawVal;
      }
      return next;
    });
  };

  const handleAddCustomSpec = () => {
    const newSpec: TechnicalSpecificationField = {
      key: `custom_${Date.now()}`,
      label: "New Specification",
      value: "",
      unit: "",
      group: "General",
      displayOrder: customSpecs.length + 1,
      visible: true,
    };
    setCustomSpecs([...customSpecs, newSpec]);
  };

  const handleUpdateCustomSpec = (
    index: number,
    updates: Partial<TechnicalSpecificationField>
  ) => {
    setCustomSpecs((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...updates };
      return next;
    });
  };

  const handleRemoveCustomSpec = (index: number) => {
    setCustomSpecs((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMsg(null);

    try {
      // Validate canonical required fields if any
      if (currentTemplate) {
        for (const reqField of currentTemplate.fields) {
          if (reqField.required && reqField.isCanonical) {
            const val = templateValues[reqField.key];
            if (val === undefined || val === null || val === "") {
              throw new Error(`Required canonical field "${reqField.label}" (${reqField.key}) cannot be empty.`);
            }
          }
        }
      }

      // Filter empty custom specs
      const cleanedCustom = customSpecs
        .filter((s) => s.label.trim() !== "" && s.value !== "")
        .map((s, idx) => ({
          ...s,
          key: s.key.toLowerCase().replace(/[^a-z0-9_]/g, "_"),
          displayOrder: idx + 1,
        }));

      const payload = {
        title,
        handle,
        description,
        technicalSpecs: {
          schemaVersion: 1,
          componentType,
          fields: templateValues,
        },
        customFields: cleanedCustom,
        existingMetadata: metadata,
      };

      const res = await fetch(`/api/products/${initialProduct.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save product specifications");
      }

      setSuccessMsg("Product specifications saved successfully to Medusa catalog.");
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const variants = (initialProduct.variants as Record<string, unknown>[]) || [];

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div className="flex items-center gap-4">
          <Link
            href="/products"
            className="flex h-9 w-9 items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">
                {title.replace("[DEV] ", "") || "Product Editor"}
              </h1>
              <span className="rounded bg-gray-100 px-2 py-0.5 font-mono text-xs text-gray-600">
                {componentType}
              </span>
            </div>
            <p className="mt-0.5 font-mono text-xs text-gray-500">
              ID: {initialProduct.id as string} &bull; Handle: {handle}
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center gap-2 rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-gray-800 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {isSaving ? "Saving..." : "Save Product"}
        </button>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="flex items-center gap-2 rounded-md bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-800">
          <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-2 rounded-md bg-rose-50 border border-rose-200 p-3 text-sm text-rose-800">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200 space-x-6 text-sm font-medium">
        <button
          type="button"
          onClick={() => setActiveTab("specs")}
          className={`pb-3 ${
            activeTab === "specs"
              ? "border-b-2 border-gray-900 font-semibold text-gray-900"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Technical Specifications
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("basic")}
          className={`pb-3 ${
            activeTab === "basic"
              ? "border-b-2 border-gray-900 font-semibold text-gray-900"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Basic Information
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("commercial")}
          className={`pb-3 ${
            activeTab === "commercial"
              ? "border-b-2 border-gray-900 font-semibold text-gray-900"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Commercial & Variants ({variants.length})
        </button>
      </div>

      {/* TAB 1: TECHNICAL SPECIFICATIONS */}
      {activeTab === "specs" && (
        <div className="space-y-8">
          {/* Component Classification Card */}
          <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-xs">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <Layers className="h-4 w-4 text-gray-700" />
              Component Classification & Engine Mapping
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Selecting the component type configures required compatibility rules and public specification templates.
            </p>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-gray-700">Component Type</label>
                <select
                  value={componentType}
                  onChange={(e) => setComponentType(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-xs focus:border-gray-900 focus:outline-none"
                >
                  {Object.keys(COMPONENT_SPEC_TEMPLATES).map((key) => (
                    <option key={key} value={key}>
                      {COMPONENT_SPEC_TEMPLATES[key].label} ({key})
                    </option>
                  ))}
                  <option value="GENERIC">Generic / Other Hardware</option>
                </select>
              </div>

              <div className="rounded-md bg-gray-50 p-3 border border-gray-100 flex items-start gap-2.5">
                <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-xs text-gray-600 leading-relaxed">
                  Fields tagged <span className="font-semibold text-amber-700">[Canonical]</span> are consumed directly by the UAV Compatibility Engine. Unknown values must be left empty rather than entered as zero.
                </div>
              </div>
            </div>
          </div>

          {/* Predefined Template Fields by Group */}
          {currentTemplate && Object.keys(groupedTemplateFields).length > 0 && (
            <div className="space-y-6">
              {Object.entries(groupedTemplateFields).map(([group, fields]) => (
                <div key={group} className="rounded-lg border border-gray-200 bg-white p-5 shadow-xs">
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-2.5">
                    {group} Specifications
                  </h3>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {fields.map((f) => {
                      const curVal = templateValues[f.key] ?? "";
                      return (
                        <div key={f.key} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-medium text-gray-700 flex items-center gap-1.5">
                              {f.label}
                              {f.required && <span className="text-rose-500 font-bold">*</span>}
                            </label>
                            {f.isCanonical && (
                              <span className="rounded bg-amber-50 px-1.5 py-0.2 text-[10px] font-semibold text-amber-800 border border-amber-200">
                                Canonical
                              </span>
                            )}
                          </div>
                          <div className="relative">
                            <input
                              type={f.type === "number" ? "number" : "text"}
                              step={f.type === "number" ? "any" : undefined}
                              value={String(curVal)}
                              onChange={(e) =>
                                handleTemplateValueChange(f.key, e.target.value, f.type)
                              }
                              placeholder="Not specified"
                              className="block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-900 shadow-xs focus:border-gray-900 focus:outline-none"
                            />
                            {f.unit && (
                              <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 font-mono text-xs text-gray-400">
                                {f.unit}
                              </span>
                            )}
                          </div>
                          {f.min !== undefined && f.max !== undefined && (
                            <p className="text-[10px] text-gray-400">
                              Range: {f.min} – {f.max} {f.unit || ""}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Custom Specifications Section */}
          <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  Additional Display Specifications
                </h3>
                <p className="text-xs text-gray-500">
                  Add custom specifications for the product detail page that do not alter engine compatibility.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddCustomSpec}
                className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-xs hover:bg-gray-50"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Specification
              </button>
            </div>

            {customSpecs.length === 0 ? (
              <p className="py-6 text-center text-xs text-gray-400">
                No custom specifications added. Click &quot;Add Specification&quot; above to create one.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {customSpecs.map((spec, idx) => (
                  <div
                    key={spec.key || idx}
                    className="flex flex-wrap items-center gap-3 rounded-md border border-gray-200 bg-gray-50 p-3 text-xs"
                  >
                    <div className="w-40">
                      <label className="text-[10px] font-medium text-gray-500">Label</label>
                      <input
                        type="text"
                        value={spec.label}
                        onChange={(e) =>
                          handleUpdateCustomSpec(idx, { label: e.target.value })
                        }
                        className="mt-0.5 block w-full rounded border border-gray-300 bg-white px-2 py-1 text-xs"
                        placeholder="e.g. Operating Temp"
                      />
                    </div>
                    <div className="w-36">
                      <label className="text-[10px] font-medium text-gray-500">Value</label>
                      <input
                        type="text"
                        value={String(spec.value)}
                        onChange={(e) =>
                          handleUpdateCustomSpec(idx, { value: e.target.value })
                        }
                        className="mt-0.5 block w-full rounded border border-gray-300 bg-white px-2 py-1 text-xs"
                        placeholder="-20°C to +50°C"
                      />
                    </div>
                    <div className="w-20">
                      <label className="text-[10px] font-medium text-gray-500">Unit</label>
                      <input
                        type="text"
                        value={spec.unit || ""}
                        onChange={(e) =>
                          handleUpdateCustomSpec(idx, { unit: e.target.value })
                        }
                        className="mt-0.5 block w-full rounded border border-gray-300 bg-white px-2 py-1 text-xs"
                        placeholder="optional"
                      />
                    </div>
                    <div className="w-28">
                      <label className="text-[10px] font-medium text-gray-500">Group</label>
                      <select
                        value={spec.group || "General"}
                        onChange={(e) =>
                          handleUpdateCustomSpec(idx, { group: e.target.value })
                        }
                        className="mt-0.5 block w-full rounded border border-gray-300 bg-white px-2 py-1 text-xs"
                      >
                        <option value="General">General</option>
                        <option value="Electrical">Electrical</option>
                        <option value="Mechanical">Mechanical</option>
                        <option value="Performance">Performance</option>
                        <option value="Dimensions">Dimensions</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-1.5 pt-4">
                      <input
                        type="checkbox"
                        id={`vis_${idx}`}
                        checked={spec.visible !== false}
                        onChange={(e) =>
                          handleUpdateCustomSpec(idx, { visible: e.target.checked })
                        }
                        className="rounded border-gray-300 text-gray-900"
                      />
                      <label htmlFor={`vis_${idx}`} className="text-[11px] text-gray-600">
                        Public
                      </label>
                    </div>
                    <div className="ml-auto pt-3">
                      <button
                        type="button"
                        onClick={() => handleRemoveCustomSpec(idx)}
                        className="text-gray-400 hover:text-rose-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: BASIC INFORMATION */}
      {activeTab === "basic" && (
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-xs space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700">Product Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-xs focus:border-gray-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700">URL Handle</label>
            <input
              type="text"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-mono text-gray-900 shadow-xs focus:border-gray-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700">Description</label>
            <textarea
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-xs focus:border-gray-900 focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* TAB 3: COMMERCIAL & VARIANTS */}
      {activeTab === "commercial" && (
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-xs space-y-4">
          <div className="rounded-md bg-amber-50 p-3 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0" />
            <span>
              Authoritative commercial data (SKUs, inventory levels, base pricing) are managed strictly via Medusa variant records. No duplicate prices are stored in technical metadata.
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-gray-200 text-gray-500 uppercase tracking-wider font-medium">
                <tr>
                  <th className="pb-2">Variant Title</th>
                  <th className="pb-2">SKU</th>
                  <th className="pb-2">Inventory</th>
                  <th className="pb-2">Managed By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {variants.map((v) => (
                  <tr key={v.id as string}>
                    <td className="py-2.5 font-medium text-gray-900">{v.title as string}</td>
                    <td className="py-2.5 font-mono text-gray-600">{v.sku as string || "—"}</td>
                    <td className="py-2.5 text-gray-600">
                      {v.manage_inventory ? "Tracked" : "Unmanaged"}
                    </td>
                    <td className="py-2.5 text-gray-500">Medusa Inventory Module</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bottom Save Bar */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
        <Link
          href="/products"
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center gap-2 rounded-md bg-gray-900 px-5 py-2 text-sm font-semibold text-white shadow-xs hover:bg-gray-800 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {isSaving ? "Saving Product..." : "Save Product"}
        </button>
      </div>
    </form>
  );
}
