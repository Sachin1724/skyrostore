import type { NextConfig } from "next";

const medusaUrl = new URL(process.env.NEXT_PUBLIC_MEDUSA_URL || "http://localhost:9000");

const nextConfig: NextConfig = {
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

export default nextConfig;
