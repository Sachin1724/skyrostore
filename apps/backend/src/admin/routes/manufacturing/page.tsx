import { defineRouteConfig } from "@medusajs/admin-sdk";
import { Container, Heading, Text, Badge, Button, Input, Select, Table, Toaster, toast } from "@medusajs/ui";
import { useEffect, useState, useCallback } from "react";

type ManufacturingOrder = {
  id: string;
  order_id: string;
  snapshot_id: string | null;
  bom_id: string | null;
  bom_revision: number | null;
  product_id: string;
  planned_quantity: number;
  current_stage: string;
  assigned_operator_id: string | null;
  started_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  notes: string | null;
  created_at: string;
};

type Allocation = {
  id: string;
  product_variant_id: string;
  component_type: string;
  required_quantity: number;
  allocated_quantity: number;
  consumed_quantity: number;
  released_quantity: number;
  status: string;
};

type Assembly = {
  id: string;
  serial_number: string;
  status: string;
  firmware_version: string | null;
  operator_id: string | null;
  installed_components: any[];
  started_at: string | null;
  completed_at: string | null;
  notes: string | null;
  created_at: string;
};

type QACheck = {
  id: string;
  result: string;
  inspector_id: string | null;
  remarks: string | null;
  signed_at: string | null;
  created_at: string;
};

type MfgEvent = {
  id: string;
  stage: string;
  status: string;
  actor_id: string | null;
  notes: string | null;
  created_at: string;
};

const STATUS_COLORS: Record<string, "green" | "orange" | "red" | "blue" | "grey" | "purple"> = {
  planned: "blue",
  components_reserved: "orange",
  assembling: "purple",
  assembled: "purple",
  qa_pending: "orange",
  qa_passed: "green",
  qa_failed: "red",
  blocked: "red",
  cancelled: "grey",
};

const ALL_STATUSES = [
  "planned", "components_reserved", "assembling", "assembled",
  "qa_pending", "qa_passed", "qa_failed", "blocked", "cancelled",
];

const ManufacturingPage = () => {
  const [orders, setOrders] = useState<ManufacturingOrder[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.set("status", filterStatus);
      const res = await fetch(`/admin/manufacturing?${params}`, { credentials: "include" });
      if (res.ok) {
        const d = await res.json();
        setOrders(d.manufacturing_orders);
        setCount(d.count);
      }
    } catch {
      toast.error("Failed to load manufacturing orders");
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  if (selected) {
    return <ManufacturingDetail orderId={selected} onBack={() => { setSelected(null); fetchOrders(); }} />;
  }

  if (showCreate) {
    return <CreateManufacturingOrder onBack={() => { setShowCreate(false); fetchOrders(); }} />;
  }

  return (
    <Container>
      <Toaster />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <Heading level="h1">Manufacturing</Heading>
          <Text size="small" className="text-ui-fg-muted">{count} orders</Text>
        </div>
        <Button onClick={() => setShowCreate(true)}>Create Order</Button>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <div style={{ width: 200 }}>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <Select.Trigger>
              <Select.Value placeholder="All statuses" />
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="">All statuses</Select.Item>
              {ALL_STATUSES.map((s) => (
                <Select.Item key={s} value={s}>{s.replace(/_/g, " ")}</Select.Item>
              ))}
            </Select.Content>
          </Select>
        </div>
      </div>

      {loading ? (
        <Text className="text-ui-fg-muted">Loading...</Text>
      ) : orders.length === 0 ? (
        <Text className="text-ui-fg-muted">No manufacturing orders found.</Text>
      ) : (
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>MFG Order</Table.HeaderCell>
              <Table.HeaderCell>Source Order</Table.HeaderCell>
              <Table.HeaderCell>Config</Table.HeaderCell>
              <Table.HeaderCell>Qty</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
              <Table.HeaderCell>Created</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {orders.map((o) => (
              <Table.Row key={o.id} onClick={() => setSelected(o.id)} style={{ cursor: "pointer" }}>
                <Table.Cell><Text size="small" weight="plus">{o.id.slice(-8)}</Text></Table.Cell>
                <Table.Cell><Text size="small">{o.order_id}</Text></Table.Cell>
                <Table.Cell><Text size="small">{o.snapshot_id ? "Linked" : o.bom_id ? "BOM" : "—"}</Text></Table.Cell>
                <Table.Cell><Text size="small">{o.planned_quantity}</Text></Table.Cell>
                <Table.Cell>
                  <Badge color={STATUS_COLORS[o.current_stage] || "grey"}>
                    {o.current_stage.replace(/_/g, " ")}
                  </Badge>
                </Table.Cell>
                <Table.Cell>
                  <Text size="xsmall" className="text-ui-fg-muted">
                    {new Date(o.created_at).toLocaleDateString()}
                  </Text>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      )}
    </Container>
  );
};

function CreateManufacturingOrder({ onBack }: { onBack: () => void }) {
  const [orderId, setOrderId] = useState("");
  const [bomId, setBomId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [boms, setBoms] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/admin/manufacturing/bom?status=active", { credentials: "include" });
        if (res.ok) {
          const d = await res.json();
          setBoms(d.boms || []);
        }
      } catch {}
    })();
  }, []);

  const handleCreate = async () => {
    if (!orderId.trim()) { toast.error("Order ID required"); return; }
    setSaving(true);
    try {
      const res = await fetch("/admin/manufacturing", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: orderId.trim(),
          bom_id: bomId || undefined,
          planned_quantity: Number(quantity) || 1,
          notes: notes || undefined,
        }),
      });
      const d = await res.json();
      if (res.ok) {
        toast.success(d.already_exists ? "Order already exists" : "Manufacturing order created");
        onBack();
      } else {
        toast.error(d.error || "Creation failed");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Container>
      <Toaster />
      <Button variant="secondary" size="small" onClick={onBack} style={{ marginBottom: 12 }}>Back</Button>
      <Heading level="h2" style={{ marginBottom: 16 }}>Create Manufacturing Order</Heading>
      <div style={{ display: "grid", gap: 12, maxWidth: 500 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 500 }}>Source Order ID *</label>
          <Input value={orderId} onChange={(e) => setOrderId(e.target.value)} placeholder="order_..." />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 500 }}>BOM (optional)</label>
          <Select value={bomId} onValueChange={setBomId}>
            <Select.Trigger><Select.Value placeholder="No BOM — use snapshot" /></Select.Trigger>
            <Select.Content>
              <Select.Item value="">No BOM</Select.Item>
              {boms.map((b) => (
                <Select.Item key={b.id} value={b.id}>{b.name} (Rev {b.revision})</Select.Item>
              ))}
            </Select.Content>
          </Select>
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 500 }}>Planned Quantity</label>
          <Input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 500 }}>Notes</label>
          <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional..." />
        </div>
        <Button onClick={handleCreate} isLoading={saving}>Create</Button>
      </div>
    </Container>
  );
}

function ManufacturingDetail({ orderId, onBack }: { orderId: string; onBack: () => void }) {
  const [order, setOrder] = useState<ManufacturingOrder | null>(null);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [assemblies, setAssemblies] = useState<Assembly[]>([]);
  const [events, setEvents] = useState<MfgEvent[]>([]);
  const [qaChecks, setQaChecks] = useState<QACheck[]>([]);
  const [validTransitions, setValidTransitions] = useState<string[]>([]);
  const [snapshot, setSnapshot] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  const fetchDetail = useCallback(async () => {
    try {
      const res = await fetch(`/admin/manufacturing/${orderId}`, { credentials: "include" });
      if (res.ok) {
        const d = await res.json();
        setOrder(d.manufacturing_order);
        setAllocations(d.allocations || []);
        setAssemblies(d.assemblies || []);
        setEvents(d.events || []);
        setQaChecks(d.qa_checks || []);
        setValidTransitions(d.valid_transitions || []);
        setSnapshot(d.snapshot);
      }
    } catch {
      toast.error("Failed to load detail");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => { fetchDetail(); }, [fetchDetail]);

  const doAction = async (action: string, payload: Record<string, any> = {}) => {
    setActing(true);
    try {
      const res = await fetch(`/admin/manufacturing/${orderId}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...payload }),
      });
      const d = await res.json();
      if (res.ok) {
        toast.success(`${action.replace(/_/g, " ")} completed`);
        fetchDetail();
      } else {
        toast.error(d.error || "Action failed");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setActing(false);
    }
  };

  if (loading || !order) return <Container><Text className="text-ui-fg-muted">Loading...</Text></Container>;

  const canReserve = order.current_stage === "planned";
  const canCreateAssembly = ["components_reserved", "assembling"].includes(order.current_stage) && assemblies.length < order.planned_quantity;
  const canSubmitQa = ["assembled", "qa_pending"].includes(order.current_stage) && assemblies.length > 0;

  return (
    <Container>
      <Toaster />
      <Button variant="secondary" size="small" onClick={onBack} style={{ marginBottom: 12 }}>Back to list</Button>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <Heading level="h2">MFG-{order.id.slice(-8)}</Heading>
          <Text size="small" className="text-ui-fg-muted">
            Order: {order.order_id} · Qty: {order.planned_quantity}
            {order.bom_id ? ` · BOM Rev ${order.bom_revision}` : ""}
          </Text>
        </div>
        <Badge color={STATUS_COLORS[order.current_stage] || "grey"} size="large">
          {order.current_stage.replace(/_/g, " ")}
        </Badge>
      </div>

      {/* Snapshot info */}
      {snapshot && (
        <div style={{ marginBottom: 16, padding: 12, background: "#f9fafb", borderRadius: 8 }}>
          <Text size="small" weight="plus">Configuration Snapshot</Text>
          <div style={{ marginTop: 8 }}>
            {(snapshot.snapshot_data?.items || []).map((item: any, i: number) => (
              <div key={i} style={{ display: "flex", gap: 12, padding: "2px 0" }}>
                <Text size="xsmall" weight="plus" style={{ minWidth: 100 }}>{item.component_type}</Text>
                <Text size="xsmall">{item.product_title}</Text>
                <Text size="xsmall" className="text-ui-fg-muted">{item.sku}</Text>
                {item.quantity > 1 && <Text size="xsmall">x{item.quantity}</Text>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Component Allocations */}
      <Heading level="h3" style={{ marginBottom: 8, marginTop: 16 }}>Component Allocations</Heading>
      {allocations.length === 0 ? (
        <Text size="small" className="text-ui-fg-muted">No allocations yet.</Text>
      ) : (
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Type</Table.HeaderCell>
              <Table.HeaderCell>Variant</Table.HeaderCell>
              <Table.HeaderCell>Required</Table.HeaderCell>
              <Table.HeaderCell>Allocated</Table.HeaderCell>
              <Table.HeaderCell>Consumed</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {allocations.map((a) => (
              <Table.Row key={a.id}>
                <Table.Cell><Text size="small">{a.component_type}</Text></Table.Cell>
                <Table.Cell><Text size="xsmall" className="text-ui-fg-muted">{a.product_variant_id.slice(-8)}</Text></Table.Cell>
                <Table.Cell><Text size="small">{a.required_quantity}</Text></Table.Cell>
                <Table.Cell><Text size="small">{a.allocated_quantity}</Text></Table.Cell>
                <Table.Cell><Text size="small">{a.consumed_quantity}</Text></Table.Cell>
                <Table.Cell><Badge color={a.status === "consumed" ? "green" : a.status === "allocated" ? "orange" : "grey"}>{a.status}</Badge></Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      )}

      {/* Assembly Records */}
      <Heading level="h3" style={{ marginBottom: 8, marginTop: 16 }}>Assembly Records</Heading>
      {assemblies.length === 0 ? (
        <Text size="small" className="text-ui-fg-muted">No assemblies yet.</Text>
      ) : (
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Serial</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
              <Table.HeaderCell>Firmware</Table.HeaderCell>
              <Table.HeaderCell>Started</Table.HeaderCell>
              <Table.HeaderCell>Completed</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {assemblies.map((a) => (
              <Table.Row key={a.id}>
                <Table.Cell><Text size="small" weight="plus">{a.serial_number}</Text></Table.Cell>
                <Table.Cell>
                  <Badge color={a.status === "qa_passed" ? "green" : a.status === "qa_failed" ? "red" : "orange"}>
                    {a.status.replace(/_/g, " ")}
                  </Badge>
                </Table.Cell>
                <Table.Cell><Text size="xsmall">{a.firmware_version || "—"}</Text></Table.Cell>
                <Table.Cell><Text size="xsmall">{a.started_at ? new Date(a.started_at).toLocaleString() : "—"}</Text></Table.Cell>
                <Table.Cell><Text size="xsmall">{a.completed_at ? new Date(a.completed_at).toLocaleString() : "—"}</Text></Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      )}

      {/* QA History */}
      {qaChecks.length > 0 && (
        <>
          <Heading level="h3" style={{ marginBottom: 8, marginTop: 16 }}>QA History</Heading>
          {qaChecks.map((qc) => (
            <div key={qc.id} style={{ padding: "8px 0", borderBottom: "1px solid #f3f4f6" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Badge color={qc.result === "PASS" ? "green" : "red"}>{qc.result}</Badge>
                <Text size="xsmall" className="text-ui-fg-muted">{new Date(qc.created_at).toLocaleString()}</Text>
              </div>
              {qc.remarks && <Text size="xsmall" className="text-ui-fg-muted">{qc.remarks}</Text>}
            </div>
          ))}
        </>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: 8, marginTop: 20, flexWrap: "wrap" }}>
        {canReserve && (
          <Button onClick={() => doAction("reserve_components")} isLoading={acting}>Reserve Components</Button>
        )}
        {canCreateAssembly && (
          <Button onClick={() => doAction("create_assembly")} isLoading={acting}>Start Assembly Unit</Button>
        )}
        {order.current_stage === "assembling" && assemblies.some((a) => a.status === "pending" || a.status === "in_progress") && (
          <Button variant="secondary" onClick={() => {
            const assembly = assemblies.find((a) => a.status === "pending" || a.status === "in_progress");
            if (assembly) doAction("update_assembly", { assembly_id: assembly.id, status: "assembled" });
          }} isLoading={acting}>
            Mark Assembled
          </Button>
        )}
        {order.current_stage === "assembling" && allocations.some((a) => a.status === "allocated") && (
          <Button variant="secondary" onClick={() => doAction("consume_components")} isLoading={acting}>
            Consume Components
          </Button>
        )}
        {(order.current_stage === "assembled" || order.current_stage === "assembling") && assemblies.some((a) => a.status === "assembled") && (
          <Button variant="secondary" onClick={() => doAction("transition", { to: order.current_stage === "assembling" ? "assembled" : "qa_pending" })} isLoading={acting}>
            {order.current_stage === "assembling" ? "Mark All Assembled" : "Submit for QA"}
          </Button>
        )}
        {canSubmitQa && assemblies.length > 0 && (
          <>
            <Button onClick={() => {
              const assembly = assemblies.find((a) => ["assembled", "qa_pending"].includes(a.status));
              if (assembly) doAction("submit_qa", { assembly_id: assembly.id, result: "PASS", remarks: "QA passed" });
            }} isLoading={acting}>
              QA Pass
            </Button>
            <Button variant="danger" onClick={() => {
              const assembly = assemblies.find((a) => ["assembled", "qa_pending"].includes(a.status));
              if (assembly) doAction("submit_qa", { assembly_id: assembly.id, result: "FAIL", remarks: "QA failed" });
            }} isLoading={acting}>
              QA Fail
            </Button>
          </>
        )}
        {validTransitions.includes("cancelled") && (
          <Button variant="danger" onClick={() => doAction("transition", { to: "cancelled" })} isLoading={acting}>Cancel</Button>
        )}
      </div>

      {/* Event History */}
      {events.length > 0 && (
        <>
          <Heading level="h3" style={{ marginBottom: 8, marginTop: 24 }}>Event History</Heading>
          {events.map((e) => (
            <div key={e.id} style={{ padding: "6px 0", borderBottom: "1px solid #f3f4f6" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Text size="small" weight="plus">{e.stage.replace(/_/g, " ")}</Text>
                <Text size="xsmall" className="text-ui-fg-muted">{new Date(e.created_at).toLocaleString()}</Text>
              </div>
              <Text size="xsmall" className="text-ui-fg-muted">{e.notes}</Text>
            </div>
          ))}
        </>
      )}
    </Container>
  );
}

export const config = defineRouteConfig({
  label: "Manufacturing",
});

export default ManufacturingPage;
