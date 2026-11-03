"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { FirebaseSignIn } from "./firebase-sign-in";
import { firebaseConfigured } from "@/lib/firebase";

type AuthMode = "login" | "register";

/** Reasons the Google callback can hand back, in words a customer can act on. */
const GOOGLE_ERRORS: Record<string, string> = {
  cancelled: "Google sign-in was cancelled.",
  expired_or_used: "That Google sign-in link has expired. Please try again.",
  invalid_callback: "The Google sign-in response was incomplete. Please try again.",
  email_taken:
    "An account already uses this email address. Sign in with your password instead, for security.",
  account_creation_failed: "The account could not be created. Please try again.",
  profile_unavailable: "Google did not share a verified email address.",
  provider_error: "Google reported an error during sign-in.",
  no_token: "Google sign-in did not return a session.",
  unexpected: "Google sign-in did not complete. Please try again.",
};

const inputClass =
  "w-full px-3 py-3 text-[14px] text-graphite bg-surface placeholder:text-text-disabled focus:ring-2 focus:ring-graphite/8 focus:border-graphite";
const inputStyle = {
  borderRadius: "var(--radius-sm)",
  border: "1px solid var(--color-border-strong)",
};

export function AccountView() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleAvailable, setGoogleAvailable] = useState<boolean | null>(null);
  const [googleStarting, setGoogleStarting] = useState(false);
  const [firebaseAvailable, setFirebaseAvailable] = useState(false);

  const searchParams = useSearchParams();

  // Offer Google only if the backend really has the provider configured.
  useEffect(() => {
    let active = true;
    fetch("/api/auth/providers")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!active) return;
        setGoogleAvailable(Boolean(data?.google));
        // Needs both the public web config here and the provider on the backend.
        setFirebaseAvailable(firebaseConfigured && Boolean(data?.firebase));
      })
      .catch(() => {
        if (active) setGoogleAvailable(false);
      });
    return () => {
      active = false;
    };
  }, []);

  // Surface why a Google round-trip came back without a session.
  useEffect(() => {
    const reason = searchParams.get("auth_error");
    if (!reason) return;
    setError(GOOGLE_ERRORS[reason] || "Google sign-in did not complete. Please try again.");
  }, [searchParams]);

  async function handleGoogle() {
    setError("");
    setGoogleStarting(true);
    try {
      const res = await fetch("/api/auth/google/start", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.location) {
        setError(data.error || "Google sign-in is unavailable right now.");
        return;
      }
      window.location.href = data.location;
    } catch {
      setError("Could not reach Google sign-in.");
    } finally {
      setGoogleStarting(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint =
        mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const body =
        mode === "login"
          ? { email, password }
          : { email, password, first_name: firstName, last_name: lastName };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Authentication failed");
        return;
      }

      router.push("/account/orders");
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-[28px] font-bold tracking-[-0.025em] text-graphite">
        {mode === "login" ? "Sign In" : "Create Account"}
      </h1>

      {error && (
        <div
          role="alert"
          aria-live="assertive"
          className="mt-4 px-4 py-3 text-[13px] font-medium text-error"
          style={{
            borderRadius: "var(--radius-sm)",
            background: "var(--color-error-soft)",
          }}
        >
          {error}
        </div>
      )}

      {firebaseAvailable && (
        <>
          <FirebaseSignIn
            onError={setError}
            onSignedIn={() => {
              router.push("/account/orders");
              router.refresh();
            }}
          />
          <div className="mt-6 flex items-center gap-3">
            <span className="h-px flex-1" style={{ background: "var(--color-border)" }} />
            <span className="text-[13px] font-medium tracking-wider text-text-muted">
              or use email and password
            </span>
            <span className="h-px flex-1" style={{ background: "var(--color-border)" }} />
          </div>
        </>
      )}

      {!firebaseAvailable && googleAvailable === true && (
        <div className="mt-6">
          <button
            type="button"
            onClick={handleGoogle}
            disabled={googleStarting}
            className="flex w-full items-center justify-center gap-2.5 px-4 py-3 text-[14px] font-semibold text-graphite transition-colors hover:bg-accent-hover disabled:opacity-50"
            style={{
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--color-border-strong)",
              background: "var(--color-surface)",
            }}
          >
            <svg className="h-[18px] w-[18px]" viewBox="0 0 18 18" aria-hidden="true">
              <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z" />
              <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z" />
              <path fill="#FBBC05" d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33Z" />
              <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z" />
            </svg>
            {googleStarting ? "Redirecting to Google…" : "Continue with Google"}
          </button>

          <div className="mt-5 flex items-center gap-3">
            <span className="h-px flex-1" style={{ background: "var(--color-border)" }} />
            <span className="text-[13px] font-medium tracking-wider text-text-muted">
              or use email
            </span>
            <span className="h-px flex-1" style={{ background: "var(--color-border)" }} />
          </div>
        </div>
      )}

      {!firebaseAvailable && googleAvailable === false && (
        <p className="mt-4 text-[14px] text-text-muted">
          Google sign-in is not configured on this environment. Use your email and password.
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {mode === "register" && (
          <div className="grid grid-cols-2 gap-3">
            <input
              required
              aria-label="First name"
              autoComplete="given-name"
              placeholder="First name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className={inputClass}
              style={inputStyle}
            />
            <input
              required
              aria-label="Last name"
              autoComplete="family-name"
              placeholder="Last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className={inputClass}
              style={inputStyle}
            />
          </div>
        )}

        <input
          type="email"
          required
          aria-label="Email address"
          autoComplete="email"
          inputMode="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
          style={inputStyle}
        />

        <input
          type="password"
          required
          aria-label="Password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
          style={inputStyle}
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 text-[13px] font-semibold text-white bg-graphite transition-colors hover:bg-graphite-soft disabled:opacity-50"
          style={{ borderRadius: "var(--radius-sm)" }}
        >
          {loading
            ? "Processing..."
            : mode === "login"
              ? "Sign In"
              : "Create Account"}
        </button>
      </form>

      <p className="mt-4 text-center text-[13px] text-text-secondary">
        {mode === "login" ? (
          <>
            No account?{" "}
            <button
              type="button"
              onClick={() => setMode("register")}
              className="font-medium text-graphite hover:underline"
            >
              Create one
            </button>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => setMode("login")}
              className="font-medium text-graphite hover:underline"
            >
              Sign in
            </button>
          </>
        )}
      </p>

      <div className="mt-6 pt-4 flex items-center justify-between" style={{ borderTop: "1px solid var(--color-border)" }}>
        <Link
          href="/account/orders"
          className="text-[13px] font-medium text-text-secondary hover:text-graphite"
        >
          View my orders &rarr;
        </Link>
        <Link
          href="/account/bulk-requests"
          className="text-[13px] font-medium text-text-secondary hover:text-graphite"
        >
          My Bulk Requests &rarr;
        </Link>
      </div>
    </div>
  );
}
