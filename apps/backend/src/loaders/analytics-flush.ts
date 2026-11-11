import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { flushEvents, bufferStats } from "../lib/analytics-buffer";

/**
 * Flushes buffered analytics events when the process is going away.
 *
 * Without this a restart or deploy silently drops whatever is still queued.
 * The handlers are registered once and do not keep the process alive.
 */
export default async function analyticsFlushLoader({ container }: { container: any }) {
  const db = container.resolve(ContainerRegistrationKeys.PG_CONNECTION);

  let draining = false;
  const drain = async (signal: string) => {
    if (draining) return;
    draining = true;
    const { pending } = bufferStats();
    if (pending > 0) {
      const written = await flushEvents(db);
      console.log(`analytics: flushed ${written} buffered events on ${signal}`);
    }
  };

  for (const signal of ["SIGTERM", "SIGINT"] as const) {
    process.once(signal, () => {
      void drain(signal);
    });
  }
  process.once("beforeExit", () => {
    void drain("beforeExit");
  });
}
