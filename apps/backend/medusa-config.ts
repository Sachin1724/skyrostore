import { readFileSync } from "fs";
import { defineConfig, loadEnv } from "@medusajs/framework/utils";

loadEnv(process.env.NODE_ENV || "development", process.cwd());

export default defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    // One pool per backend instance. Postgres defaults to 100 connections, so
    // keep instances * max below that, leaving headroom for admin tooling.
    databaseDriverOptions: {
      // Supabase requires TLS and signs with its own CA: download it from
      // Project Settings -> Database -> SSL and point DATABASE_SSL_CA at it, so
      // the server certificate is actually verified. Use the Supabase *session*
      // pooler URL (port 5432); the transaction pooler (6543) breaks the
      // prepared statements and migrations Medusa relies on.
      ...(process.env.DATABASE_SSL_CA
        ? { connection: { ssl: { ca: readFileSync(process.env.DATABASE_SSL_CA, "utf8") } } }
        : {}),
      pool: {
        min: Number(process.env.DB_POOL_MIN || 2),
        max: Number(process.env.DB_POOL_MAX || 20),
        idleTimeoutMillis: 30000,
        acquireTimeoutMillis: 30000,
      },
    },
    redisUrl: process.env.REDIS_URL,
    http: {
      storeCors: process.env.STORE_CORS || "http://localhost:3000",
      adminCors: process.env.ADMIN_CORS || "http://localhost:3001",
      authCors: process.env.AUTH_CORS || "http://localhost:3000,http://localhost:3001",
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    },
    workerMode: (process.env.MEDUSA_WORKER_MODE as "server" | "worker" | "shared") || "shared",
  },
  modules: [
    ...(process.env.REDIS_URL
      ? [
          {
            // Shared cache: without it each instance caches separately and
            // customers see different prices and stock from each other.
            resolve: "@medusajs/medusa/cache-redis",
            options: {
              redisUrl: process.env.REDIS_URL,
              ttl: Number(process.env.CACHE_TTL_SECONDS || 60),
            },
          },
          {
            // Shared event bus: subscribers (order placed, analytics) must fire
            // once per event across the fleet, not once per instance.
            resolve: "@medusajs/medusa/event-bus-redis",
            options: { redisUrl: process.env.REDIS_URL },
          },
          {
            // Durable workflow state, so a long-running workflow survives the
            // instance that started it going away.
            resolve: "@medusajs/medusa/workflow-engine-redis",
            // The URL is nested under `redis`; a top-level redisUrl is not read
            // by this module and makes the loader throw at boot.
            options: { redis: { redisUrl: process.env.REDIS_URL } },
          },
          {
            // Distributed locks: two instances must not fulfil or capture the
            // same order concurrently.
            resolve: "@medusajs/medusa/locking",
            options: {
              providers: [
                {
                  resolve: "@medusajs/medusa/locking-redis",
                  id: "locking-redis",
                  is_default: true,
                  options: { redisUrl: process.env.REDIS_URL },
                },
              ],
            },
          },
        ]
      : []),
    {
      // Email/password always; Google only when credentials are supplied, so the
      // storefront can report an honest "not configured" state instead of
      // offering a button that cannot work.
      resolve: "@medusajs/medusa/auth",
      options: {
        providers: [
          {
            resolve: "@medusajs/medusa/auth-emailpass",
            id: "emailpass",
          },
          ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
            ? [
                {
                  resolve: "@medusajs/medusa/auth-google",
                  id: "google",
                  options: {
                    clientId: process.env.GOOGLE_CLIENT_ID,
                    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                    callbackUrl:
                      process.env.GOOGLE_CALLBACK_URL ||
                      "http://localhost:3000/auth/google/callback",
                  },
                },
              ]
            : []),
          // Phone OTP, Google and email-link sign-in, done on our own pages
          // with the Firebase SDK; only the ID token reaches the backend.
          ...(process.env.FIREBASE_PROJECT_ID
            ? [
                {
                  resolve: "./src/modules/firebase-auth",
                  id: "firebase",
                  options: { projectId: process.env.FIREBASE_PROJECT_ID },
                },
              ]
            : []),
        ],
      },
    },
    { resolve: "./src/modules/uav" },
    { resolve: "./src/modules/compatibility" },
    { resolve: "./src/modules/configurator" },
    { resolve: "./src/modules/manufacturing" },
    { resolve: "./src/modules/flight-test" },
    { resolve: "./src/modules/quality" },
    { resolve: "./src/modules/audit" },
    { resolve: "./src/modules/analytics" },
    {
      resolve: "@medusajs/medusa/payment",
      options: {
        providers: [
          ...(process.env.RAZORPAY_KEY_ID
            ? [
                {
                  resolve: "./src/modules/razorpay",
                  id: "razorpay",
                  options: {
                    key_id: process.env.RAZORPAY_KEY_ID,
                    key_secret: process.env.RAZORPAY_KEY_SECRET,
                    webhook_secret: process.env.RAZORPAY_WEBHOOK_SECRET,
                  },
                },
              ]
            : []),
        ],
      },
    },
  ],
});
