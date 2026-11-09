"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } finally {
      setLoading(false);
      setSent(true);
    }
  }

  if (sent) {
    return (
      <div className="card flex flex-col items-center gap-3 p-8 text-center">
        <CheckCircle2 className="h-8 w-8 text-success" aria-hidden />
        <p className="text-[16px] font-bold text-navy">Check your email</p>
        <p className="max-w-xs text-[13px] text-text-secondary">
          If an account exists for {email}, a reset link is on its way. It expires in 15 minutes.
        </p>
        <Link href="/account" className="mt-2 text-[13px] font-bold text-brand hover:underline">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card p-6 md:p-8">
      <div className="border-b border-border pb-4">
        <h1 className="text-[24px] font-semibold text-navy">Forgot your password?</h1>
        <p className="mt-1 text-[13px] text-text-secondary">
          Enter the email on your account and we&apos;ll send a link to reset it.
        </p>
      </div>

      <div className="mt-5">
        <label className="mb-1 block text-[13px] font-bold text-navy">Email address</label>
        <input
          type="email"
          required
          autoComplete="email"
          placeholder="engineer@domain.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-11 w-full rounded-md border border-border bg-surface-soft px-3 text-[14px] text-navy focus:border-brand focus:bg-white focus:outline-none"
        />
      </div>

      <button type="submit" disabled={loading} className="btn btn-primary mt-5 flex w-full">
        {loading ? "Sending…" : "Send reset link"}
      </button>

      <p className="mt-4 text-center text-[13px] text-text-secondary">
        <Link href="/account" className="font-bold text-brand hover:underline">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
