import { readFileSync } from "fs";

/**
 * The integration tests place real orders through the backend on :9000, which
 * writes to whatever DATABASE_URL the backend uses. Refuse to run them against
 * a remote database (Supabase) unless explicitly allowed, so test orders never
 * land in production data. Unit tests are unaffected when the backend is down.
 */
export default async function guardRemoteDb() {
  if (process.env.ALLOW_REMOTE_DB_TESTS === "1") return;
  let url = "";
  try {
    url = readFileSync("apps/backend/.env", "utf8").match(/^DATABASE_URL=(\S+)/m)?.[1] ?? "";
  } catch {
    return;
  }
  const host = url ? new URL(url).hostname : "localhost";
  if (["localhost", "127.0.0.1", "postgres"].includes(host)) return;

  const backendUp = await fetch("http://localhost:9000/health", { signal: AbortSignal.timeout(2000) })
    .then((r) => r.ok)
    .catch(() => false);
  if (backendUp) {
    throw new Error(
      `The backend on :9000 uses a remote database (${host}); integration tests would write test orders into it. ` +
        "Point apps/backend/.env at local Postgres, or stop the backend to run unit tests only. " +
        "ALLOW_REMOTE_DB_TESTS=1 overrides."
    );
  }
}
