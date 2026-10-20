import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { DetailWidgetProps, AdminProduct } from "@medusajs/framework/types";
import { Container, Heading, Text, Label, Input, Select, Button, Badge, Toaster, toast } from "@medusajs/ui";
import { useState, useEffect, useCallback } from "react";

interface SpecFieldDef {
  key: string;
  label: string;
  unit: string;
  type: "number" | "text";
  required: boolean;
  min?: number;
  max?: number;
  canonical: boolean;
  customer_visible: boolean;
}

interface SpecData {
  product_id: string;
  product_title: string;
  component_type: string | null;
  fields: SpecFieldDef[];
  specs: Record<string, string | null>;
  custom_specs: Record<string, string>;
  available_types: string[];
}

const ProductSpecEditorWidget = ({ data }: DetailWidgetProps<AdminProduct>) => {
  const [specData, setSpecData] = useState<SpecData | null>(null);
  const [componentType, setComponentType] = useState<string>("");
  const [specs, setSpecs] = useState<Record<string, string>>({});
  const [customSpecs, setCustomSpecs] = useState<Record<string, string>>({});
  const [newCustomKey, setNewCustomKey] = useState("");
  const [newCustomValue, setNewCustomValue] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchSpecs = useCallback(async () => {
    try {
      const res = await fetch(`/admin/products/${data.id}/specs`, {
        credentials: "include",
      });
      if (res.ok) {
        const d: SpecData = await res.json();
        setSpecData(d);
        setComponentType(d.component_type || "");
        const s: Record<string, string> = {};
        for (const [k, v] of Object.entries(d.specs)) {
          if (v !== null) s[k] = v;
        }
        setSpecs(s);
        setCustomSpecs(d.custom_specs || {});
      }
    } catch {
      // noop
    } finally {
      setLoading(false);
    }
  }, [data.id]);

  useEffect(() => {
    fetchSpecs();
  }, [fetchSpecs]);

  const handleSave = async () => {
    setSaving(true);
    setErrors({});
    try {
      const res = await fetch(`/admin/products/${data.id}/specs`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          component_type: componentType,
          specs,
          custom_specs: customSpecs,
        }),
      });
      const d = await res.json();
      if (!res.ok) {
        if (d.field_errors) {
          setErrors(d.field_errors);
        }
        toast.error(d.error || "Save failed");
      } else {
        toast.success("Specifications saved");
        fetchSpecs();
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  };

  const handleTypeChange = (value: string) => {
    setComponentType(value);
    setSpecs({});
    setErrors({});
  };

  const addCustomSpec = () => {
    if (!newCustomKey.trim()) return;
    setCustomSpecs((prev) => ({ ...prev, [newCustomKey.trim()]: newCustomValue }));
    setNewCustomKey("");
    setNewCustomValue("");
  };

  const removeCustomSpec = (key: string) => {
    setCustomSpecs((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  if (loading) {
    return (
      <Container>
        <Text size="small" className="text-ui-fg-muted">Loading specifications...</Text>
      </Container>
    );
  }

  const fields = specData?.fields || [];
  const availableTypes = specData?.available_types || [];

  return (
    <Container>
      <Toaster />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <Heading level="h2">UAV Technical Specifications</Heading>
        {componentType && (
          <Badge color={specData?.component_type ? "green" : "orange"}>
            {specData?.component_type ? "Configured" : "Unsaved"}
          </Badge>
        )}
      </div>

      {/* Component Type Selector */}
      <div style={{ marginBottom: 16 }}>
        <Label htmlFor="component_type">Component Type</Label>
        <Select value={componentType} onValueChange={handleTypeChange}>
          <Select.Trigger>
            <Select.Value placeholder="Select component type..." />
          </Select.Trigger>
          <Select.Content>
            {availableTypes.map((t) => (
              <Select.Item key={t} value={t}>
                {t.replace(/_/g, " ")}
              </Select.Item>
            ))}
          </Select.Content>
        </Select>
      </div>

      {/* Canonical Spec Fields */}
      {componentType && fields.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <Text weight="plus" size="small" style={{ marginBottom: 8, display: "block" }}>
            Engineering Specifications
          </Text>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {fields.filter((f) => f.canonical).map((field) => (
              <div key={field.key}>
                <Label htmlFor={field.key}>
                  {field.label}
                  {field.unit && <span style={{ color: "#8A9096", marginLeft: 4 }}>({field.unit})</span>}
                  {field.required && <span style={{ color: "#e11d48" }}> *</span>}
                </Label>
                <Input
                  id={field.key}
                  type={field.type === "number" ? "number" : "text"}
                  value={specs[field.key] || ""}
                  onChange={(e) => setSpecs((prev) => ({ ...prev, [field.key]: e.target.value }))}
                  placeholder={field.min !== undefined ? `${field.min}–${field.max}` : ""}
                />
                {errors[field.key] && (
                  <Text size="xsmall" style={{ color: "#e11d48", marginTop: 2 }}>{errors[field.key]}</Text>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Display-only Spec Fields */}
      {componentType && fields.filter((f) => !f.canonical).length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <Text weight="plus" size="small" style={{ marginBottom: 8, display: "block" }}>
            Display Specifications
          </Text>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {fields.filter((f) => !f.canonical).map((field) => (
              <div key={field.key}>
                <Label htmlFor={field.key}>
                  {field.label}
                  {field.unit && <span style={{ color: "#8A9096", marginLeft: 4 }}>({field.unit})</span>}
                </Label>
                <Input
                  id={field.key}
                  type={field.type === "number" ? "number" : "text"}
                  value={specs[field.key] || ""}
                  onChange={(e) => setSpecs((prev) => ({ ...prev, [field.key]: e.target.value }))}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Custom Specifications */}
      {componentType && (
        <div style={{ marginBottom: 16 }}>
          <Text weight="plus" size="small" style={{ marginBottom: 8, display: "block" }}>
            Custom Specifications
          </Text>
          {Object.entries(customSpecs).map(([key, value]) => (
            <div key={key} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
              <Input value={key} disabled style={{ flex: 1 }} />
              <Input
                value={value}
                onChange={(e) => setCustomSpecs((prev) => ({ ...prev, [key]: e.target.value }))}
                style={{ flex: 1 }}
              />
              <Button variant="secondary" size="small" onClick={() => removeCustomSpec(key)}>
                ×
              </Button>
            </div>
          ))}
          <div style={{ display: "flex", gap: 8, alignItems: "end" }}>
            <div style={{ flex: 1 }}>
              <Label>Key</Label>
              <Input
                value={newCustomKey}
                onChange={(e) => setNewCustomKey(e.target.value)}
                placeholder="e.g. connector_type"
              />
            </div>
            <div style={{ flex: 1 }}>
              <Label>Value</Label>
              <Input
                value={newCustomValue}
                onChange={(e) => setNewCustomValue(e.target.value)}
                placeholder="e.g. XT60"
              />
            </div>
            <Button variant="secondary" size="small" onClick={addCustomSpec}>
              Add
            </Button>
          </div>
        </div>
      )}

      {/* Save Button */}
      {componentType && (
        <Button onClick={handleSave} isLoading={saving}>
          Save Specifications
        </Button>
      )}

      {!componentType && (
        <Text size="small" className="text-ui-fg-muted">
          Select a component type to configure UAV specifications for this product.
        </Text>
      )}
    </Container>
  );
};

export const config = defineWidgetConfig({
  zone: "product.details.after",
});

export default ProductSpecEditorWidget;
