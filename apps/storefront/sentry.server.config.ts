import * as Sentry from "@sentry/nextjs";

// Catches checkout/payment route errors server-side (Razorpay webhook
// failures, cart-completion errors) — no-ops until SENTRY_DSN is set.
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV,
});
