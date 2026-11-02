import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { Modules } from "@medusajs/framework/utils";

/**
 * Returns the verified profile attached to the caller's own auth identity.
 *
 * After a third-party sign-in the storefront holds a registration token but no
 * customer yet, and it needs the provider's verified email to create one. Only
 * the identity bound to the presented token is readable, and only the few
 * fields needed to create the customer record are returned.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const authContext = (req as any).auth_context;
  const authIdentityId = authContext?.auth_identity_id;

  if (!authIdentityId) {
    return res.status(401).json({ error: "Authentication required" });
  }

  // An identity that already has a customer must not be re-registered.
  if (authContext?.actor_id) {
    return res.status(409).json({ error: "This identity already has a customer account." });
  }

  try {
    const authModule = req.scope.resolve(Modules.AUTH) as any;
    const identity = await authModule.retrieveAuthIdentity(authIdentityId, {
      relations: ["provider_identities"],
    });

    const provider = (identity?.provider_identities || [])[0];
    const metadata = provider?.user_metadata || {};
    const email = metadata.email || provider?.entity_id;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return res.status(422).json({
        error: "The identity provider did not supply a usable email address.",
      });
    }

    return res.json({
      provider: provider?.provider ?? null,
      email,
      first_name: metadata.given_name ?? null,
      last_name: metadata.family_name ?? null,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: message });
  }
}
