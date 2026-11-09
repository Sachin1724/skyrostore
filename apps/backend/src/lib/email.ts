/**
 * Transactional email via Resend's HTTP API. No SDK: one fetch call, same
 * pattern as lib/shipmozo.ts. No-ops (logs only) when RESEND_API_KEY is unset,
 * so local dev and CI never need a key.
 */

export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

const FROM = process.env.RESEND_FROM_EMAIL || "Skyrostore <onboarding@resend.dev>";

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (!to) return;
  if (!emailConfigured()) {
    console.log(`[email skipped, no RESEND_API_KEY] to=${to} subject="${subject}"`);
    return;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM, to, subject, html }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error(`Resend send failed (${res.status}): ${detail}`);
    }
  } catch (err: unknown) {
    console.error("Resend send failed:", err instanceof Error ? err.message : err);
  }
}

const money = (cents: number, currency: string) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: currency.toUpperCase() }).format(cents);

export function orderPlacedEmail(order: {
  display_id: number | string;
  currency_code: string;
  total: number;
}): { subject: string; html: string } {
  return {
    subject: `Order #${order.display_id} confirmed`,
    html: `<p>Thanks for your order.</p><p><strong>Order #${order.display_id}</strong> — ${money(
      order.total,
      order.currency_code
    )}</p><p>We'll email you again once it ships.</p>`,
  };
}

export function orderShippedEmail(order: {
  display_id: number | string;
  courier: string;
  tracking_number: string;
  tracking_url?: string | null;
}): { subject: string; html: string } {
  const trackLine = order.tracking_url
    ? `<a href="${order.tracking_url}">${order.tracking_number}</a>`
    : order.tracking_number;
  return {
    subject: `Order #${order.display_id} has shipped`,
    html: `<p>Your order <strong>#${order.display_id}</strong> is on its way via ${order.courier}.</p><p>Tracking: ${trackLine}</p>`,
  };
}
