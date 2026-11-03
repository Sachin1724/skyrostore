"use client";

import { useState } from "react";
import { Bell, CheckCircle2, Send } from "lucide-react";

export function NewsletterCard() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setError("Please enter a valid engineering contact email address.");
      return;
    }
    setError("");
    setSubmitted(true);
  }

  return (
    <section
      aria-labelledby="newsletter-heading"
      className="rounded-xl border border-border bg-white p-6 md:p-8 shadow-sm"
    >
      <div className="grid gap-6 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] md:items-center">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded bg-brand-soft px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wider text-brand">
            <Bell className="h-3 w-3" aria-hidden />
            Inventory Alerts
          </div>

          <h2
            id="newsletter-heading"
            className="mt-2 text-[18px] md:text-[22px] font-extrabold tracking-tight text-navy"
          >
            Hardware Restock Bulletins &amp; Specs
          </h2>

          <p className="mt-1.5 text-[13px] md:text-[14px] leading-relaxed text-text-secondary">
            Get instant notifications when high-demand motors, autopilots, and batteries arrive in inventory. Strictly technical changelogs and restock alerts; zero marketing clutter.
          </p>
        </div>

        <div>
          {submitted ? (
            <div className="flex items-center gap-3 rounded-lg border border-success/30 bg-success/10 p-4 text-success">
              <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden />
              <div>
                <p className="text-[14px] font-bold">Subscribed for Restock Alerts</p>
                <p className="text-[12px] text-text-secondary">
                  We will notify {email} when new production batches arrive.
                </p>
              </div>
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
                  placeholder="engineer@institution.edu or work email"
                  required
                  aria-label="Email address for restock alerts"
                  className="h-11 flex-1 rounded-md border border-border bg-surface-soft px-3.5 text-[14px] text-navy placeholder:text-text-muted focus:border-brand focus:bg-white focus:outline-none"
                />
                <button
                  type="submit"
                  className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-md bg-navy px-5 text-[13px] font-bold text-white transition-colors hover:bg-brand shadow-sm"
                >
                  <span>Notify Me</span>
                  <Send className="h-3.5 w-3.5" aria-hidden />
                </button>
              </div>
              {error ? (
                <p className="text-[12px] font-semibold text-error">{error}</p>
              ) : (
                <p className="text-[11px] text-text-muted">
                  Strict privacy. You can unsubscribe at any time with one click.
                </p>
              )}
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
