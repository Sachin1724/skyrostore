import type { MedusaNextFunction, MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

export type AdminRole = "owner" | "staff";

/**
 * The admin user's role, kept in the Medusa user's metadata (`role`). A user with no role is an
 * owner, so the accounts that exist today keep working; mark staff with
 * `npx medusa exec ./src/scripts/set-admin-role.ts` (see that file).
 */
export async function roleOf(req: MedusaRequest): Promise<AdminRole | null> {
  const userId = (req as any).auth_context?.actor_id;
  if (!userId) return null;
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY) as any;
  const { data } = await query.graph({ entity: "user", fields: ["id", "metadata"], filters: { id: userId } });
  const user = (data as any[])?.[0];
  if (!user) return null;
  return user.metadata?.role === "staff" ? "staff" : "owner";
}

/** Money and configuration (refunds, settings, promotions, users) are for owners only. */
export async function requireOwner(req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) {
  const role = await roleOf(req).catch(() => null);
  if (!role) return res.status(401).json({ message: "Authentication required" });
  if (role !== "owner") return res.status(403).json({ message: "Only an owner can do this." });
  return next();
}
