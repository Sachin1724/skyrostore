import type { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";

/**
 * Sets an admin user's role: "owner" (refunds, settings, promotions, users) or "staff" (fulfil orders).
 * A user with no role counts as an owner.
 *
 *   ADMIN_EMAIL=packer@example.com ADMIN_ROLE=staff npx medusa exec ./src/scripts/set-admin-role.ts
 */
export default async function setAdminRole({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER) as any;
  const email = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const role = process.env.ADMIN_ROLE;
  if (!email || (role !== "owner" && role !== "staff")) {
    logger.error("Set ADMIN_EMAIL and ADMIN_ROLE (owner or staff).");
    return;
  }
  const users = container.resolve(Modules.USER) as any;
  const [user] = await users.listUsers({ email });
  if (!user) {
    logger.error(`No admin user with email ${email}.`);
    return;
  }
  await users.updateUsers({ id: user.id, metadata: { ...(user.metadata ?? {}), role } });
  logger.info(`${email} is now ${role}.`);
}
