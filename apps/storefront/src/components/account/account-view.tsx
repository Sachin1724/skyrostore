"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type AuthMode = "login" | "register";

const inputClass =
  "w-full px-3 py-3 text-[14px] text-graphite bg-surface placeholder:text-text-disabled focus:outline-none focus:ring-2 focus:ring-graphite/8 focus:border-graphite";
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
          className="mt-4 px-4 py-3 text-[13px] font-medium text-error"
          style={{
            borderRadius: "var(--radius-sm)",
            background: "var(--color-error-soft)",
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {mode === "register" && (
          <div className="grid grid-cols-2 gap-3">
            <input
              required
              placeholder="First name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className={inputClass}
              style={inputStyle}
            />
            <input
              required
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
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
          style={inputStyle}
        />

        <input
          type="password"
          required
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

      <div className="mt-6 pt-4" style={{ borderTop: "1px solid var(--color-border)" }}>
        <Link
          href="/account/orders"
          className="text-[13px] font-medium text-text-secondary hover:text-graphite"
        >
          View my orders
        </Link>
      </div>
    </div>
  );
}
