import * as Sentry from "@sentry/node";

/**
 * Inert until SENTRY_DSN is set. Node SDK auto-instruments uncaught
 * exceptions/rejections and HTTP once initialised; route handlers that catch
 * and swallow their own errors (most of this codebase does, deliberately)
 * won't appear unless they also call Sentry.captureException explicitly.
 */
export default async function sentryLoader() {
  if (!process.env.SENTRY_DSN) return;
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1,
  });
}
