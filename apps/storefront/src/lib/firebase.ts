"use client";

import { getApps, initializeApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

// Public web-app config from Firebase console → Project settings → Your apps.
const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const firebaseConfigured = Boolean(config.apiKey && config.authDomain && config.projectId && config.appId);

export function firebaseAuth(): Auth {
  const app = getApps()[0] ?? initializeApp(config);
  const auth = getAuth(app);
  auth.languageCode = "en";
  return auth;
}

export const EMAIL_FOR_SIGN_IN_KEY = "skyro_email_for_sign_in";

export type SessionResult =
  | { ok: true }
  | { ok: false; needs_profile: true; phone: string | null; first_name: string | null; last_name: string | null }
  | { ok: false; error: string };

/** Swaps a Firebase ID token for our own httpOnly session cookie. */
export async function startSession(
  idToken: string,
  profile?: { email: string; first_name?: string; last_name?: string }
): Promise<SessionResult> {
  const res = await fetch("/api/auth/firebase", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id_token: idToken, ...profile }),
  });
  const data = await res.json().catch(() => ({}));
  if (res.ok && data.ok) return { ok: true };
  if (res.ok && data.needs_profile) return { ok: false, needs_profile: true, ...data };
  return { ok: false, error: data.error || "Sign-in did not complete. Please try again." };
}

/** Firebase error codes in words a customer can act on. */
export function firebaseMessage(err: unknown): string {
  const code = (err as { code?: string })?.code || "";
  const messages: Record<string, string> = {
    "auth/invalid-phone-number": "Enter a valid 10-digit mobile number.",
    "auth/invalid-verification-code": "That code is not right. Check the SMS and try again.",
    "auth/code-expired": "That code has expired. Request a new one.",
    "auth/too-many-requests": "Too many attempts. Please wait a few minutes and try again.",
    "auth/popup-closed-by-user": "Google sign-in was cancelled.",
    "auth/cancelled-popup-request": "Google sign-in was cancelled.",
    "auth/popup-blocked": "Your browser blocked the Google window. Allow pop-ups for this site and try again.",
    "auth/invalid-email": "Enter a valid email address.",
    "auth/invalid-action-code": "This sign-in link has expired or was already used. Request a new one.",
    "auth/expired-action-code": "This sign-in link has expired. Request a new one.",
    "auth/network-request-failed": "Network problem. Check your connection and try again.",
    "auth/quota-exceeded": "We can't send more codes right now. Please try another sign-in method.",
  };
  return messages[code] || "Sign-in did not complete. Please try again.";
}
