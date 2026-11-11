import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { passwordResetEmail, sendEmail } from "../lib/email";

type PasswordResetEvent = { entity_id: string; actor_type: string; token: string };

export default async function authPasswordResetEmailHandler({ event }: SubscriberArgs<PasswordResetEvent>) {
  const { entity_id: email, actor_type: actorType, token } = event.data ?? ({} as PasswordResetEvent);
  if (!email || actorType !== "customer" || !token) return;

  const storefrontUrl = process.env.STOREFRONT_URL || "http://localhost:3000";
  const resetLink = `${storefrontUrl}/reset-password?token=${encodeURIComponent(token)}`;
  const { subject, html } = passwordResetEmail(resetLink);
  await sendEmail(email, subject, html);
}

export const config: SubscriberConfig = {
  event: "auth.password_reset",
};
