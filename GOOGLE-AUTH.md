# Google customer sign-in — setup

Google sign-in is **optional**. With no credentials configured the backend does not register the
provider, `GET /auth/customer/providers` omits it, and the storefront shows
"Google sign-in is not configured on this environment" instead of a button that cannot work.

No credentials are committed to this repository, and none should be.

## 1. Create the OAuth client

1. Open the [Google Cloud Console](https://console.cloud.google.com/) and select or create a project.
2. **APIs & Services → OAuth consent screen** — configure the app name, support email and the
   `email` and `profile` scopes. For a live site the consent screen must be published.
3. **APIs & Services → Credentials → Create credentials → OAuth client ID**, type **Web application**.

### Authorized JavaScript origins

The storefront origin, with no path:

| Environment | Origin |
|---|---|
| Local (default ports) | `http://localhost:3000` |
| Local (this session's ports) | `http://localhost:3100` |
| Production | `https://your-domain.example` |

### Authorized redirect URIs

The storefront callback route, exactly:

| Environment | Redirect URI |
|---|---|
| Local (default ports) | `http://localhost:3000/auth/google/callback` |
| Local (this session's ports) | `http://localhost:3100/auth/google/callback` |
| Production | `https://your-domain.example/auth/google/callback` |

Google matches redirect URIs exactly — a trailing slash or a different port will be rejected.

## 2. Configure the backend

In `apps/backend/.env`:

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3100/auth/google/callback
```

`GOOGLE_CALLBACK_URL` must match one of the authorized redirect URIs above. Restart the backend —
the provider is registered at boot, so a restart is required after changing these values.

The storefront needs no Google variables. It derives the callback from `NEXT_PUBLIC_SITE_URL`
(falling back to the request origin), and the client secret never reaches browser code.

## 3. Verify

```bash
# Should list "google" alongside "emailpass" once configured
curl -s http://localhost:9100/auth/customer/providers \
  -H "x-publishable-api-key: $NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY"
```

Then open the storefront account page: the "Continue with Google" button appears only when the
provider is present.

## How the flow works

1. The storefront posts to `/api/auth/google/start`, which asks Medusa for a consent URL.
   Medusa generates the OAuth `state`, stores it server-side, and returns the Google URL.
2. Google redirects the customer to `/auth/google/callback` with `code` and `state`.
3. That route hands both to Medusa, which validates the stored state, exchanges the code using the
   client secret, and verifies the returned `id_token` against Google's JWKS (checking signature,
   audience and issuer). An unverified Google email is rejected outright.
4. On a first sign-in the route reads the verified profile from `/store/auth/pending-profile`
   (readable only with that registration token) and creates the customer.
5. The resulting token is stored as an `httpOnly`, `sameSite=lax` cookie — never in browser
   storage and never readable by page scripts.

## Account-safety behaviour

- Identities are keyed by Google's `sub`, not by email address, so two accounts are never merged
  because they happen to share an email.
- If an existing account already uses the Google address, sign-in is **refused** with
  "An account already uses this email address. Sign in with your password instead." Linking the
  two automatically would expose the existing customer's orders.
- Email and password sign-in continues to work unchanged, including for accounts that also use
  Google.

## Failure states the customer can see

| Reason | Shown as |
|---|---|
| `cancelled` | Google sign-in was cancelled. |
| `expired_or_used` | That Google sign-in link has expired. Please try again. |
| `invalid_callback` | The Google sign-in response was incomplete. |
| `email_taken` | An account already uses this email address. Sign in with your password instead. |
| `profile_unavailable` | Google did not share a verified email address. |
| `provider_error` | Google reported an error during sign-in. |
| `account_creation_failed` | The account could not be created. |
