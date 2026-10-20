import { defineConfig, loadEnv } from "@medusajs/framework/utils";

loadEnv(process.env.NODE_ENV || "development", process.cwd());

export default defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
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
