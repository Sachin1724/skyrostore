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
};

export default nextConfig;
