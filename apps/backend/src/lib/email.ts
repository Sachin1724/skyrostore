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

/** HTML-escapes any value interpolated into an email body — admin_note, courier name etc. are free text, not system-generated. */
const esc = (value: unknown): string =>
  String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function orderPlacedEmail(order: {
  display_id: number | string;
  currency_code: string;
  total: number;
}): { subject: string; html: string } {
  return {
    subject: `Order #${order.display_id} confirmed`,
    html: `<p>Thanks for your order.</p><p><strong>Order #${esc(order.display_id)}</strong> — ${esc(
      money(order.total, order.currency_code)
    )}</p><p>We'll email you again once it ships.</p>`,
  };
}

export function abandonedCartEmail(cartUrl: string, itemCount: number): { subject: string; html: string } {
  return {
    subject: `You left ${itemCount} ${itemCount === 1 ? "item" : "items"} in your cart`,
    html: `<p>Your cart is still here, ready when you are.</p><p><a href="${esc(cartUrl)}">Resume checkout</a></p>`,
  };
}

export function returnStatusEmail(
  displayId: string,
  status: "APPROVED" | "REJECTED",
  note?: string | null
): { subject: string; html: string } {
  const body =
    status === "APPROVED"
      ? "Your return request has been approved. We'll be in touch with next steps."
      : "Your return request was not approved.";
  return {
    subject: `Return request for order #${displayId} ${status === "APPROVED" ? "approved" : "declined"}`,
    html: `<p>${body}</p>${note ? `<p>Note from our team: ${esc(note)}</p>` : ""}`,
  };
}

export function passwordResetEmail(resetLink: string): { subject: string; html: string } {
  return {
    subject: "Reset your Skyrostore password",
    html: `<p>Click the link below to set a new password. It expires in 15 minutes.</p><p><a href="${esc(resetLink)}">${esc(resetLink)}</a></p><p>If you didn't request this, ignore this email.</p>`,
  };
}

export function orderCanceledEmail(order: { display_id: number | string }): { subject: string; html: string } {
  return {
    subject: `Order #${order.display_id} cancelled`,
    html: `<p>Order <strong>#${esc(order.display_id)}</strong> has been cancelled.</p><p>If a payment was captured, it will be refunded to your original payment method — reach out to support if you don't see it within a few business days.</p>`,
  };
}

export function orderShippedEmail(order: {
  display_id: number | string;
  courier: string;
  tracking_number: string;
  tracking_url?: string | null;
}): { subject: string; html: string } {
  const trackLine = order.tracking_url
    ? `<a href="${esc(order.tracking_url)}">${esc(order.tracking_number)}</a>`
    : esc(order.tracking_number);
  return {
    subject: `Order #${order.display_id} has shipped`,
    html: `<p>Your order <strong>#${esc(order.display_id)}</strong> is on its way via ${esc(order.courier)}.</p><p>Tracking: ${trackLine}</p>`,
  };
}
