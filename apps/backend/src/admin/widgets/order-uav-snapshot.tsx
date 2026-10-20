import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { DetailWidgetProps, AdminOrder } from "@medusajs/framework/types";
import { Container, Heading, Text, Badge } from "@medusajs/ui";
import { useEffect, useState } from "react";

interface SnapshotItem {
  component_type: string;
  product_title: string;
  sku: string;
  quantity: number;
  specs: Record<string, string>;
}

interface Snapshot {
  id: string;
  configuration_id: string;
  order_id: string | null;
  snapshot_data: {
    items?: SnapshotItem[];
    components?: SnapshotItem[];
    validation: { valid: boolean; errors: string[]; warnings: string[] };
    captured_at: string;
  };
  created_at: string;
}

const OrderUavSnapshotWidget = ({ data }: DetailWidgetProps<AdminOrder>) => {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/admin/uav/configurations?order_id=${data.id}`, {
          credentials: "include",
        });
        if (res.ok) {
          const d = await res.json();
          setSnapshots(d.snapshots || []);
        }
      } catch {
        // noop
      } finally {
        setLoading(false);
      }
    })();
  }, [data.id]);

  if (loading) {
    return (
      <Container>
        <Text size="small" className="text-ui-fg-muted">Loading UAV data...</Text>
      </Container>
    );
  }

  if (snapshots.length === 0) {
    return (
      <Container>
        <Heading level="h2">UAV Configuration</Heading>
        <Text size="small" className="text-ui-fg-muted" style={{ marginTop: 8 }}>
          No UAV configuration snapshot linked to this order.
        </Text>
      </Container>
    );
  }

  return (
    <Container>
      <Heading level="h2">UAV Configuration Snapshot</Heading>
      {snapshots.map((snap) => (
        <div key={snap.id} style={{ marginTop: 12, border: "1px solid #e5e7eb", borderRadius: 8, padding: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <Text size="small" weight="plus">Config: {snap.configuration_id}</Text>
            <Badge color={snap.snapshot_data?.validation?.valid ? "green" : "red"}>
              {snap.snapshot_data?.validation?.valid ? "Valid" : "Invalid"}
            </Badge>
          </div>
          {(snap.snapshot_data?.items || snap.snapshot_data?.components || []).map((comp, i) => (
            <div key={i} style={{ display: "flex", gap: 12, padding: "4px 0", borderBottom: "1px solid #f3f4f6" }}>
              <Text size="xsmall" weight="plus" style={{ minWidth: 100 }}>{comp.component_type}</Text>
              <Text size="xsmall">{comp.product_title || (comp as any).name}</Text>
              <Text size="xsmall" className="text-ui-fg-muted">{comp.sku}</Text>
              {comp.quantity > 1 && <Text size="xsmall" className="text-ui-fg-muted">×{comp.quantity}</Text>}
            </div>
          ))}
          <Text size="xsmall" className="text-ui-fg-muted" style={{ marginTop: 6 }}>
            Snapshot: {new Date(snap.created_at).toLocaleString()}
          </Text>
        </div>
      ))}
    </Container>
  );
};

export const config = defineWidgetConfig({
  zone: "order.details.after",
});

export default OrderUavSnapshotWidget;
