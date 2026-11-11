"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export function ResetPasswordForm() {
  const router = useRouter();
  const token = useSearchParams().get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  if (!token) {
    return (
      <div className="card p-8 text-center">
        <p className="text-[16px] font-bold text-navy">This reset link is incomplete.</p>
        <Link href="/forgot-password" className="mt-3 inline-block text-[13px] font-bold text-brand hover:underline">
          Request a new one
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="card flex flex-col items-center gap-3 p-8 text-center">
        <CheckCircle2 className="h-8 w-8 text-success" aria-hidden />
        <p className="text-[16px] font-bold text-navy">Password updated</p>
        <Link href="/account" className="mt-2 text-[13px] font-bold text-brand hover:underline">
          Sign in
        </Link>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not reset password.");
      setDone(true);
      setTimeout(() => router.push("/account"), 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not reset password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card p-6 md:p-8">
      <div className="border-b border-border pb-4">
        <h1 className="text-[24px] font-semibold text-navy">Set a new password</h1>
      </div>

      {error ? (
        <div role="alert" className="mt-4 rounded-md border border-error/30 bg-error/5 px-3 py-2 text-[13px] font-semibold text-error">
          {error}
        </div>
      ) : null}

      <div className="mt-5 space-y-4">
        <div>
          <label className="mb-1 block text-[13px] font-bold text-navy">New password</label>
          <input
            type="password"
            required
            autoComplete="new-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-11 w-full rounded-md border border-border bg-surface-soft px-3 text-[14px] text-navy focus:border-brand focus:bg-white focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-[13px] font-bold text-navy">Confirm password</label>
          <input
            type="password"
            required
            autoComplete="new-password"
            placeholder="••••••••"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="h-11 w-full rounded-md border border-border bg-surface-soft px-3 text-[14px] text-navy focus:border-brand focus:bg-white focus:outline-none"
          />
        </div>
      </div>

      <button type="submit" disabled={loading} className="btn btn-primary mt-5 flex w-full">
        {loading ? "Saving…" : "Reset password"}
      </button>
    </form>
  );
}
