"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isSignInWithEmailLink, signInWithEmailLink } from "firebase/auth";
import {
  EMAIL_FOR_SIGN_IN_KEY,
  firebaseAuth,
  firebaseConfigured,
  firebaseMessage,
  startSession,
} from "@/lib/firebase";

/** Where the emailed sign-in link lands. Finishes the sign-in on our own page. */
export function EmailLinkForm() {
  const router = useRouter();
  const [status, setStatus] = useState<"working" | "need_email" | "error">("working");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  async function complete(address: string) {
    setStatus("working");
    try {
      const cred = await signInWithEmailLink(firebaseAuth(), address, window.location.href);
      try {
        localStorage.removeItem(EMAIL_FOR_SIGN_IN_KEY);
      } catch {}
      const result = await startSession(await cred.user.getIdToken());
      if (result.ok) {
        router.replace("/account/orders");
        router.refresh();
        return;
      }
      setError("error" in result ? result.error : "Sign-in did not complete. Please try again.");
      setStatus("error");
    } catch (err) {
      setError(firebaseMessage(err));
      setStatus("error");
    }
  }

  useEffect(() => {
    if (!firebaseConfigured || !isSignInWithEmailLink(firebaseAuth(), window.location.href)) {
      setError("This sign-in link is not valid. Request a new one from the sign-in page.");
      setStatus("error");
      return;
    }
    let saved = "";
    try {
      saved = localStorage.getItem(EMAIL_FOR_SIGN_IN_KEY) || "";
    } catch {}
    // Opened on another device: Firebase requires the email again.
    if (saved) void complete(saved);
    else setStatus("need_email");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
      <main id="main" className="mx-auto min-h-[60vh] max-w-md px-6 py-16">
        <h1 className="text-[24px] font-bold text-graphite">Signing you in</h1>
        {status === "working" && <p className="mt-4 text-[14px] text-text-secondary" role="status">Checking your link…</p>}
        {status === "need_email" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void complete(email.trim().toLowerCase());
            }}
            className="mt-4 space-y-4"
          >
            <p className="text-[14px] text-text-secondary">Confirm the email address the link was sent to.</p>
            <input
              aria-label="Email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-border-strong px-3 py-3 text-[14px]"
            />
            <button type="submit" className="w-full bg-graphite px-4 py-3 text-[14px] font-semibold text-white">
              Continue
            </button>
          </form>
        )}
        {status === "error" && (
          <div className="mt-4 space-y-3">
            <p role="alert" className="text-[14px] text-error">{error}</p>
            <a href="/account" className="text-[13px] font-semibold text-graphite underline">Back to sign in</a>
          </div>
        )}
      </main>
  );
}
