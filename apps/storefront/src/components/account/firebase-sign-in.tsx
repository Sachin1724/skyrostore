"use client";

import { useEffect, useRef, useState } from "react";
import {
  GoogleAuthProvider,
  RecaptchaVerifier,
  sendSignInLinkToEmail,
  signInWithPhoneNumber,
  signInWithPopup,
  type ConfirmationResult,
} from "firebase/auth";
import {
  EMAIL_FOR_SIGN_IN_KEY,
  firebaseAuth,
  firebaseMessage,
  startSession,
  type SessionResult,
} from "@/lib/firebase";

const inputClass =
  "w-full px-3 py-3 text-[14px] text-graphite bg-surface placeholder:text-text-disabled focus:ring-2 focus:ring-graphite/8 focus:border-graphite";
const inputStyle = { borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border-strong)" };
const primary =
  "w-full bg-graphite px-4 py-3 text-[14px] font-semibold text-white transition-colors hover:bg-black disabled:opacity-50";

type Method = "phone" | "email";

/**
 * Phone OTP, Google and email-link sign-in on our own page. Google opens its
 * account chooser in a popup; nothing navigates away to a Firebase-hosted page.
 */
export function FirebaseSignIn({ onSignedIn, onError }: { onSignedIn: () => void; onError: (msg: string) => void }) {
  const [method, setMethod] = useState<Method>("phone");
  const [busy, setBusy] = useState(false);
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
  const [email, setEmail] = useState("");
  const [linkSentTo, setLinkSentTo] = useState("");
  // First phone sign-in: we still need an email for order and shipping updates.
  const [profile, setProfile] = useState<{ email: string; first_name: string; last_name: string } | null>(null);
  const recaptcha = useRef<RecaptchaVerifier | null>(null);

  useEffect(() => () => recaptcha.current?.clear(), []);

  async function finish(result: SessionResult) {
    if (result.ok) return onSignedIn();
    if ("needs_profile" in result) {
      setProfile({ email: "", first_name: result.first_name || "", last_name: result.last_name || "" });
      return;
    }
    onError(result.error);
  }

  async function run(task: () => Promise<void>) {
    onError("");
    setBusy(true);
    try {
      await task();
    } catch (err) {
      onError(firebaseMessage(err));
    } finally {
      setBusy(false);
    }
  }

  const google = () =>
    run(async () => {
      const cred = await signInWithPopup(firebaseAuth(), new GoogleAuthProvider());
      await finish(await startSession(await cred.user.getIdToken()));
    });

  const sendCode = (e: React.FormEvent) => {
    e.preventDefault();
    run(async () => {
      const digits = phone.replace(/\D/g, "").slice(-10);
      if (!/^[6-9]\d{9}$/.test(digits)) throw { code: "auth/invalid-phone-number" };
      const auth = firebaseAuth();
      recaptcha.current ??= new RecaptchaVerifier(auth, "firebase-recaptcha", { size: "invisible" });
      setConfirmation(await signInWithPhoneNumber(auth, `+91${digits}`, recaptcha.current));
      setCode("");
    });
  };

  const verifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    run(async () => {
      const cred = await confirmation!.confirm(code.trim());
      await finish(await startSession(await cred.user.getIdToken()));
    });
  };

  const sendLink = (e: React.FormEvent) => {
    e.preventDefault();
    run(async () => {
      const address = email.trim().toLowerCase();
      await sendSignInLinkToEmail(firebaseAuth(), address, {
        url: `${window.location.origin}/auth/email-link`,
        handleCodeInApp: true,
      });
      try {
        localStorage.setItem(EMAIL_FOR_SIGN_IN_KEY, address);
      } catch {
        // The landing page asks for the email again if storage is unavailable.
      }
      setLinkSentTo(address);
    });
  };

  const saveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    run(async () => {
      const user = firebaseAuth().currentUser;
      if (!user) throw { code: "auth/code-expired" };
      await finish(await startSession(await user.getIdToken(), profile!));
    });
  };

  if (profile) {
    return (
      <form onSubmit={saveProfile} className="mt-6 space-y-4">
        <p className="text-[13px] text-text-secondary">
          Almost done. Add your name and email so we can send order and delivery updates.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <input
            aria-label="First name"
            autoComplete="given-name"
            placeholder="First name"
            required
            value={profile.first_name}
            onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
            className={inputClass}
            style={inputStyle}
          />
          <input
            aria-label="Last name"
            autoComplete="family-name"
            placeholder="Last name"
            value={profile.last_name}
            onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
            className={inputClass}
            style={inputStyle}
          />
        </div>
        <input
          aria-label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
          value={profile.email}
          onChange={(e) => setProfile({ ...profile, email: e.target.value })}
          className={inputClass}
          style={inputStyle}
        />
        <button type="submit" disabled={busy} className={primary} style={{ borderRadius: "var(--radius-sm)" }}>
          {busy ? "Creating your account…" : "Continue"}
        </button>
      </form>
    );
  }

  return (
    <div className="mt-6 space-y-5">
      <button
        type="button"
        onClick={google}
        disabled={busy}
        className="flex w-full items-center justify-center gap-2.5 px-4 py-3 text-[14px] font-semibold text-graphite transition-colors hover:bg-accent-hover disabled:opacity-50"
        style={{ borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border-strong)", background: "var(--color-surface)" }}
      >
        <svg className="h-[18px] w-[18px]" viewBox="0 0 18 18" aria-hidden="true">
          <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z" />
          <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z" />
          <path fill="#FBBC05" d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33Z" />
          <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z" />
        </svg>
        Continue with Google
      </button>

      <div role="tablist" aria-label="Sign-in method" className="flex gap-4 border-b border-border text-[13px]">
        {(["phone", "email"] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={method === m}
            onClick={() => setMethod(m)}
            className={`-mb-px border-b-2 pb-2 font-semibold ${
              method === m ? "border-graphite text-graphite" : "border-transparent text-text-muted hover:text-graphite"
            }`}
          >
            {m === "phone" ? "Mobile OTP" : "Email link"}
          </button>
        ))}
      </div>

      {method === "phone" ? (
        confirmation ? (
          <form onSubmit={verifyCode} className="space-y-4">
            <p className="text-[13px] text-text-secondary">
              Enter the 6-digit code sent to +91 {phone.replace(/\D/g, "").slice(-10)}.{" "}
              <button type="button" onClick={() => setConfirmation(null)} className="font-semibold text-graphite underline">
                Change number
              </button>
            </p>
            <input
              aria-label="One-time code"
              autoComplete="one-time-code"
              inputMode="numeric"
              maxLength={6}
              required
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className={`${inputClass} font-mono tracking-[0.4em]`}
              style={inputStyle}
            />
            <button type="submit" disabled={busy || code.length !== 6} className={primary} style={{ borderRadius: "var(--radius-sm)" }}>
              {busy ? "Verifying…" : "Verify & sign in"}
            </button>
          </form>
        ) : (
          <form onSubmit={sendCode} className="space-y-4">
            <div className="flex">
              <span
                className="flex items-center border border-r-0 px-3 font-mono text-[14px] text-text-muted"
                style={{ borderColor: "var(--color-border-strong)", borderRadius: "var(--radius-sm) 0 0 var(--radius-sm)" }}
              >
                +91
              </span>
              <input
                aria-label="Mobile number"
                type="tel"
                autoComplete="tel-national"
                inputMode="numeric"
                placeholder="10-digit mobile number"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={`${inputClass} font-mono`}
                style={{ ...inputStyle, borderRadius: "0 var(--radius-sm) var(--radius-sm) 0" }}
              />
            </div>
            <button type="submit" disabled={busy} className={primary} style={{ borderRadius: "var(--radius-sm)" }}>
              {busy ? "Sending code…" : "Send OTP"}
            </button>
          </form>
        )
      ) : linkSentTo ? (
        <p className="text-[13px] text-text-secondary" role="status">
          We sent a sign-in link to <span className="font-semibold text-graphite">{linkSentTo}</span>. Open it on this
          device to finish signing in.{" "}
          <button type="button" onClick={() => setLinkSentTo("")} className="font-semibold text-graphite underline">
            Use a different email
          </button>
        </p>
      ) : (
        <form onSubmit={sendLink} className="space-y-4">
          <input
            aria-label="Email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            style={inputStyle}
          />
          <button type="submit" disabled={busy} className={primary} style={{ borderRadius: "var(--radius-sm)" }}>
            {busy ? "Sending link…" : "Email me a sign-in link"}
          </button>
        </form>
      )}

      {/* Invisible reCAPTCHA required by Firebase phone auth. */}
      <div id="firebase-recaptcha" />
    </div>
  );
}
