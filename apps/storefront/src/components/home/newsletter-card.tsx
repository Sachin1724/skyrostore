"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";

export function NewsletterCard() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Could not subscribe");
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not subscribe");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby="newsletter-heading" className="rounded-xl bg-white p-6 md:p-8">
      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] md:items-center">
        <div>
          <h2 id="newsletter-heading" className="text-[20px] font-extrabold tracking-tight text-navy md:text-[22px]">
            Get restock alerts
          </h2>
          <p className="mt-1.5 text-[14px] leading-relaxed text-text-secondary">
            We email you when motors, flight controllers and batteries are back in stock. Nothing else.
          </p>
        </div>

        <div>
          {submitted ? (
            <div className="flex items-center gap-3 rounded-lg bg-success-soft p-4 text-success">
              <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden />
              <p className="text-[14px] font-semibold">Done. Alerts go to {email}.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-2">
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                  aria-label="Email address for restock alerts"
                  className="h-11 min-w-0 flex-1 rounded-md border border-border bg-surface-soft px-3.5 text-[16px] text-navy placeholder:text-text-muted focus:border-brand focus:bg-white focus:outline-none"
                />
                <button type="submit" disabled={busy} className="btn btn-primary shrink-0">
                  {busy ? "Subscribing…" : "Subscribe"}
                </button>
              </div>
              <p className={`text-[13px] ${error ? "font-semibold text-error" : "text-text-muted"}`}>
                {error || "Unsubscribe any time from the link in every email."}
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
