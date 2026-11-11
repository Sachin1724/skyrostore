import path from "path";
import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const medusaUrl = new URL(process.env.NEXT_PUBLIC_MEDUSA_URL || "http://localhost:9000");

/**
 * Baseline browser protections. A full script CSP is left out on purpose:
 * Razorpay, Firebase reCAPTCHA and Google sign-in load scripts and frames
 * from several origins, and a CSP that breaks checkout is worse than none.
 * ponytail: add a nonce-based CSP once the third-party origins are settled.
 */
const SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(self \"https://checkout.razorpay.com\" \"https://api.razorpay.com\")" },
  ...(process.env.NODE_ENV === "production"
    ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }]
    : []),
];

const nextConfig: NextConfig = {
  // Self-contained server for the Docker image; tracing starts at the repo
  // root so workspace dependencies are included.
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname, "../.."),
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "*.s3.amazonaws.com" },
      // Images uploaded from the admin are served by the Medusa file module.
      {
        protocol: medusaUrl.protocol.replace(":", "") as "http" | "https",
        hostname: medusaUrl.hostname,
        port: medusaUrl.port,
        pathname: "/static/**",
      },
    ],
  },
  // Serve Firebase's sign-in handler from our own domain, so Google's account
  // chooser says "continue to <our domain>" instead of *.firebaseapp.com.
  // NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN must then be this site's host.
  // https://firebase.google.com/docs/auth/web/redirect-best-practices#proxy-requests
  async rewrites() {
    const project = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    if (!project) return [];
    return [
      { source: "/__/auth/:path*", destination: `https://${project}.firebaseapp.com/__/auth/:path*` },
      { source: "/__/firebase/:path*", destination: `https://${project}.firebaseapp.com/__/firebase/:path*` },
    ];
  },
};

// Inert until SENTRY_DSN (and NEXT_PUBLIC_SENTRY_DSN for the browser) are set
// — see sentry.*.config.ts. Sourcemap upload needs SENTRY_AUTH_TOKEN too; the
// build still works fine without it, it just skips the upload.
export default withSentryConfig(nextConfig, {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  disableLogger: true,
  widenClientFileUpload: false,
});
