import { AbstractAuthModuleProvider, MedusaError } from "@medusajs/framework/utils";
import type {
  AuthenticationInput,
  AuthenticationResponse,
  AuthIdentityProviderService,
} from "@medusajs/framework/types";
import { verifyFirebaseIdToken } from "../../lib/firebase-token";

type Options = { projectId: string };

/**
 * Customer sign-in through Firebase Authentication (phone OTP, Google, email
 * link). The storefront signs in with the Firebase SDK on its own pages and
 * posts the resulting ID token to POST /auth/customer/firebase.
 *
 * Identities are keyed on the Firebase uid, so a phone sign-in and an email
 * sign-in never merge into one account on a shared address.
 */
class FirebaseAuthProvider extends AbstractAuthModuleProvider {
  static identifier = "firebase";
  static DISPLAY_NAME = "Firebase";

  protected options_: Options;

  static validateOptions(options: Record<string, unknown>) {
    if (!options?.projectId) throw new Error("Firebase auth provider needs projectId");
  }

  constructor(container: Record<string, unknown>, options: Options) {
    // @ts-ignore
    super(...arguments);
    this.options_ = options;
  }

  async authenticate(
    data: AuthenticationInput,
    authIdentityProviderService: AuthIdentityProviderService
  ): Promise<AuthenticationResponse> {
    const idToken = (data.body as any)?.id_token;
    if (!idToken) return { success: false, error: "id_token is required" };

    let claims;
    try {
      claims = await verifyFirebaseIdToken(idToken, this.options_.projectId);
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Invalid Firebase token" };
    }

    const user_metadata = {
      // Only a verified email is trusted to create an account with.
      email: claims.email && claims.email_verified ? claims.email : null,
      phone: claims.phone_number ?? null,
      name: claims.name ?? null,
      sign_in_provider: claims.firebase?.sign_in_provider ?? null,
    };

    try {
      const authIdentity = await authIdentityProviderService.retrieve({ entity_id: claims.sub });
      return { success: true, authIdentity };
    } catch (err: any) {
      if (err?.type !== MedusaError.Types.NOT_FOUND) return { success: false, error: err?.message };
      const authIdentity = await authIdentityProviderService.create({ entity_id: claims.sub, user_metadata });
      return { success: true, authIdentity };
    }
  }
}

export default FirebaseAuthProvider;
