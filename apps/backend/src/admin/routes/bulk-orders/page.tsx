import { defineRouteConfig } from "@medusajs/admin-sdk";
import { Container, Heading, Text, Badge, Button, Input, Select, Table, Toaster, toast } from "@medusajs/ui";
import { useEffect, useState, useCallback } from "react";

type BulkRequest = {
  id: string;
  reference_no: string;
  contact_name: string;
  email: string;
  company_name: string | null;
  request_type: string;
  status: string;
  quote_total: number | null;
  target_unit_count: number | null;
  created_at: string;
  items: any[];
};

const STATUS_COLORS: Record<string, "green" | "orange" | "red" | "blue" | "grey" | "purple"> = {
  SUBMITTED: "blue",
  UNDER_REVIEW: "orange",
  NEEDS_INFORMATION: "orange",
  QUOTED: "purple",
  ACCEPTED: "green",
  CONVERTED_TO_ORDER: "green",
  REJECTED: "red",
  EXPIRED: "grey",
  CANCELLED: "grey",
};

const ALL_STATUSES = [
  "SUBMITTED", "UNDER_REVIEW", "NEEDS_INFORMATION", "QUOTED",
  "ACCEPTED", "CONVERTED_TO_ORDER", "REJECTED", "EXPIRED", "CANCELLED",
];

const BulkOrdersPage = () => {
  const [requests, setRequests] = useState<BulkRequest[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<BulkRequest | null>(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.set("status", filterStatus);
      if (search) params.set("q", search);
      const res = await fetch(`/admin/bulk-orders?${params}`, { credentials: "include" });
      if (res.ok) {
        const d = await res.json();
        setRequests(d.requests);
        setCount(d.count);
      }
    } catch {
      toast.error("Failed to load requests");
    } finally {
      setLoading(false);
    }
  }, [filterStatus, search]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  return (
    <Container>
      <Toaster />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <Heading level="h1">Bulk Order Requests</Heading>
          <Text size="small" className="text-ui-fg-muted">{count} total requests</Text>
        </div>
      </div>

      {/* Filters */}
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
        <Input
          placeholder="Search reference, name, email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 300 }}
        />
      </div>

      {/* Request List */}
      {loading ? (
        <Text className="text-ui-fg-muted">Loading...</Text>
      ) : selected ? (
        <BulkOrderDetail request={selected} onBack={() => { setSelected(null); fetchRequests(); }} />
      ) : (
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Reference</Table.HeaderCell>
              <Table.HeaderCell>Contact</Table.HeaderCell>
              <Table.HeaderCell>Company</Table.HeaderCell>
              <Table.HeaderCell>Type</Table.HeaderCell>
              <Table.HeaderCell>Units</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
              <Table.HeaderCell>Quote Total</Table.HeaderCell>
              <Table.HeaderCell>Date</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {requests.map((r) => (
              <Table.Row
                key={r.id}
                onClick={() => setSelected(r)}
                style={{ cursor: "pointer" }}
              >
                <Table.Cell>
                  <Text size="small" weight="plus">{r.reference_no}</Text>
                </Table.Cell>
                <Table.Cell>
                  <Text size="small">{r.contact_name}</Text>
                  <Text size="xsmall" className="text-ui-fg-muted">{r.email}</Text>
                </Table.Cell>
                <Table.Cell><Text size="small">{r.company_name || "—"}</Text></Table.Cell>
                <Table.Cell><Text size="small">{r.request_type?.replace(/_/g, " ")}</Text></Table.Cell>
                <Table.Cell><Text size="small">{r.target_unit_count || r.items?.length || "—"}</Text></Table.Cell>
                <Table.Cell>
                  <Badge color={STATUS_COLORS[r.status] || "grey"}>{r.status?.replace(/_/g, " ")}</Badge>
                </Table.Cell>
                <Table.Cell>
                  <Text size="small">{r.quote_total ? `₹${Number(r.quote_total).toLocaleString()}` : "—"}</Text>
                </Table.Cell>
                <Table.Cell>
                  <Text size="xsmall" className="text-ui-fg-muted">
                    {new Date(r.created_at).toLocaleDateString()}
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

// Detail + Actions sub-component
function BulkOrderDetail({ request: initialRequest, onBack }: { request: BulkRequest; onBack: () => void }) {
  const [request, setRequest] = useState<any>(initialRequest);
  const [items, setItems] = useState<any[]>(initialRequest.items || []);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [quoteMode, setQuoteMode] = useState(false);
  const [quotePrices, setQuotePrices] = useState<Record<string, string>>({});
  const [quoteShipping, setQuoteShipping] = useState("0");
  const [quoteTax, setQuoteTax] = useState("0");
  const [quoteValidUntil, setQuoteValidUntil] = useState("");
  const [quoteNotes, setQuoteNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchDetail = useCallback(async () => {
    try {
      const res = await fetch(`/admin/bulk-orders/${request.id}`, { credentials: "include" });
      if (res.ok) {
        const d = await res.json();
        setRequest(d.request);
        setItems(d.request.items || []);
        setAuditLogs(d.request.audit_logs || []);
        const prices: Record<string, string> = {};
        for (const item of d.request.items || []) {
          prices[item.id] = item.quoted_unit_price ? String(item.quoted_unit_price) : "";
        }
        setQuotePrices(prices);
      }
    } catch {
      // noop
    } finally {
      setLoading(false);
    }
  }, [request.id]);

  useEffect(() => { fetchDetail(); }, [fetchDetail]);

  const handleStatusChange = async (newStatus: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/admin/bulk-orders/${request.id}/status`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        toast.success(`Status changed to ${newStatus}`);
        fetchDetail();
      } else {
        const d = await res.json();
        toast.error(d.error || "Status change failed");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitQuote = async () => {
    setSaving(true);
    try {
      const quoteItems = items.map((item: any) => ({
        id: item.id,
        quoted_unit_price: Number(quotePrices[item.id] || 0),
      }));

      const validUntil = quoteValidUntil || new Date(Date.now() + 30 * 86400000).toISOString();

      const res = await fetch(`/admin/bulk-orders/${request.id}/quote`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: quoteItems,
          quote_shipping: Number(quoteShipping),
          quote_tax: Number(quoteTax),
          quote_valid_until: validUntil,
          quote_notes: quoteNotes || null,
        }),
      });
      if (res.ok) {
        toast.success("Quotation issued");
        setQuoteMode(false);
        fetchDetail();
      } else {
        const d = await res.json();
        toast.error(d.error || "Quote failed");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  };

  const handleConvert = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/admin/bulk-orders/${request.id}/convert`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        const d = await res.json();
        toast.success(`Converted to order: ${d.order_id}`);
        fetchDetail();
      } else {
        const d = await res.json();
        toast.error(d.error || "Conversion failed");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Text className="text-ui-fg-muted">Loading detail...</Text>;

  const canQuote = ["SUBMITTED", "UNDER_REVIEW", "NEEDS_INFORMATION", "QUOTED"].includes(request.status);
  const canConvert = request.status === "ACCEPTED";
  const canReject = !["REJECTED", "CANCELLED", "CONVERTED_TO_ORDER"].includes(request.status);

  return (
    <div>
      <Toaster />
      <Button variant="secondary" size="small" onClick={onBack} style={{ marginBottom: 12 }}>
        Back to list
      </Button>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <Heading level="h2">{request.reference_no}</Heading>
          <Text size="small" className="text-ui-fg-muted">
            {request.contact_name} · {request.email}
            {request.company_name ? ` · ${request.company_name}` : ""}
          </Text>
        </div>
        <Badge color={STATUS_COLORS[request.status] || "grey"} size="large">
          {request.status?.replace(/_/g, " ")}
        </Badge>
      </div>

      {/* Request Details */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        <Detail label="Type" value={request.request_type?.replace(/_/g, " ")} />
        <Detail label="Units" value={request.target_unit_count || "—"} />
        <Detail label="Application" value={request.intended_application || "—"} />
        <Detail label="Target Payload" value={request.target_payload_g ? `${request.target_payload_g}g` : "—"} />
        <Detail label="Flight Time" value={request.target_flight_time_min ? `${request.target_flight_time_min} min` : "—"} />
        <Detail label="Environment" value={request.operating_environment || "—"} />
        <Detail label="Delivery" value={[request.delivery_city, request.delivery_state, request.delivery_pincode].filter(Boolean).join(", ") || "—"} />
        <Detail label="Budget" value={request.budget_range || "—"} />
      </div>

      {/* Line Items */}
      <Heading level="h3" style={{ marginBottom: 8 }}>Line Items</Heading>
      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Item</Table.HeaderCell>
            <Table.HeaderCell>Qty</Table.HeaderCell>
            <Table.HeaderCell>Unit Price</Table.HeaderCell>
            <Table.HeaderCell>Total</Table.HeaderCell>
            <Table.HeaderCell>Notes</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {items.map((item: any) => (
            <Table.Row key={item.id}>
              <Table.Cell><Text size="small">{item.title}</Text></Table.Cell>
              <Table.Cell><Text size="small">{item.requested_quantity}</Text></Table.Cell>
              <Table.Cell>
                {quoteMode ? (
                  <Input
                    type="number"
                    value={quotePrices[item.id] || ""}
                    onChange={(e) => setQuotePrices((p) => ({ ...p, [item.id]: e.target.value }))}
                    style={{ width: 100 }}
                  />
                ) : (
                  <Text size="small">
                    {item.quoted_unit_price ? `₹${Number(item.quoted_unit_price).toLocaleString()}` : "—"}
                  </Text>
                )}
              </Table.Cell>
              <Table.Cell>
                <Text size="small">
                  {item.quoted_total ? `₹${Number(item.quoted_total).toLocaleString()}` : "—"}
                </Text>
              </Table.Cell>
              <Table.Cell><Text size="xsmall" className="text-ui-fg-muted">{item.notes || "—"}</Text></Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>

      {/* Quote Summary */}
      {request.quote_total && !quoteMode && (
        <div style={{ marginTop: 12, padding: 12, background: "#f9fafb", borderRadius: 8 }}>
          <Text size="small" weight="plus">Quote Summary (Rev #{request.quote_revision})</Text>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginTop: 8 }}>
            <Detail label="Subtotal" value={`₹${Number(request.quote_subtotal).toLocaleString()}`} />
            <Detail label="Tax" value={`₹${Number(request.quote_tax).toLocaleString()}`} />
            <Detail label="Shipping" value={`₹${Number(request.quote_shipping).toLocaleString()}`} />
            <Detail label="Total" value={`₹${Number(request.quote_total).toLocaleString()}`} />
          </div>
          {request.quote_valid_until && (
            <Text size="xsmall" className="text-ui-fg-muted" style={{ marginTop: 4 }}>
              Valid until: {new Date(request.quote_valid_until).toLocaleDateString()}
            </Text>
          )}
        </div>
      )}

      {/* Quote Form */}
      {quoteMode && (
        <div style={{ marginTop: 12, padding: 12, border: "1px solid #e5e7eb", borderRadius: 8 }}>
          <Heading level="h3">Issue Quotation</Heading>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 8 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 500 }}>Shipping (₹)</label>
              <Input type="number" value={quoteShipping} onChange={(e) => setQuoteShipping(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 500 }}>Tax (₹)</label>
              <Input type="number" value={quoteTax} onChange={(e) => setQuoteTax(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 500 }}>Valid Until</label>
              <Input type="date" value={quoteValidUntil} onChange={(e) => setQuoteValidUntil(e.target.value)} />
            </div>
          </div>
          <div style={{ marginTop: 8 }}>
            <label style={{ fontSize: 12, fontWeight: 500 }}>Notes</label>
            <Input value={quoteNotes} onChange={(e) => setQuoteNotes(e.target.value)} placeholder="Optional notes..." />
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <Button onClick={handleSubmitQuote} isLoading={saving}>Submit Quote</Button>
            <Button variant="secondary" onClick={() => setQuoteMode(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
        {request.status === "SUBMITTED" && (
          <Button variant="secondary" onClick={() => handleStatusChange("UNDER_REVIEW")} isLoading={saving}>
            Start Review
          </Button>
        )}
        {canQuote && !quoteMode && (
          <Button onClick={() => setQuoteMode(true)}>
            {request.quote_revision ? "Revise Quote" : "Issue Quote"}
          </Button>
        )}
        {canConvert && (
          <Button onClick={handleConvert} isLoading={saving}>Convert to Order</Button>
        )}
        {request.status === "UNDER_REVIEW" && (
          <Button variant="secondary" onClick={() => handleStatusChange("NEEDS_INFORMATION")} isLoading={saving}>
            Request Info
          </Button>
        )}
        {canReject && (
          <Button variant="danger" onClick={() => handleStatusChange("REJECTED")} isLoading={saving}>
            Reject
          </Button>
        )}
      </div>

      {/* Audit Trail */}
      {auditLogs.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <Heading level="h3" style={{ marginBottom: 8 }}>Audit Trail</Heading>
          {auditLogs.map((log: any) => (
            <div key={log.id} style={{ padding: "8px 0", borderBottom: "1px solid #f3f4f6" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Text size="small" weight="plus">{log.action?.replace(/_/g, " ")}</Text>
                <Text size="xsmall" className="text-ui-fg-muted">
                  {new Date(log.created_at).toLocaleString()}
                </Text>
              </div>
              <Text size="xsmall" className="text-ui-fg-muted">{log.message}</Text>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <Text size="xsmall" className="text-ui-fg-muted">{label}</Text>
      <Text size="small">{value}</Text>
    </div>
  );
}

export const config = defineRouteConfig({
  label: "Bulk Orders",
});

export default BulkOrdersPage;
