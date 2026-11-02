/**
 * Write buffer for analytics events.
 *
 * At twenty thousand visitors a day the collector is the busiest write path on
 * the system, and each beacon used to cost its own INSERT and its own
 * connection from the pool. Rows are accumulated in memory and flushed in one
 * multi-row INSERT, which turns a burst of small writes into a handful of large
 * ones and keeps the pool free for checkout.
 *
 * Analytics is observational, so the trade is deliberate: a crash can lose at
 * most one unflushed window of events. Nothing that must survive — payment
 * state, orders, fulfilment — goes through here.
 */

type Row = Record<string, unknown>;

const FLUSH_ROWS = Number(process.env.ANALYTICS_FLUSH_ROWS || 200);
const FLUSH_MS = Number(process.env.ANALYTICS_FLUSH_MS || 2000);
/** Hard ceiling so a backend that cannot reach Postgres does not grow without bound. */
const MAX_BUFFER = Number(process.env.ANALYTICS_MAX_BUFFER || 5000);

let buffer: Row[] = [];
let timer: NodeJS.Timeout | null = null;
let flushing = false;
let dropped = 0;

async function writeRows(db: any, rows: Row[]): Promise<void> {
  if (!rows.length) return;
  // Idempotent: a retried beacon carries the same event_key and is ignored.
  await db("analytics_event").insert(rows).onConflict("event_key").ignore();
}

/** Writes whatever is buffered. Safe to call concurrently and when empty. */
export async function flushEvents(db: any): Promise<number> {
  if (flushing || buffer.length === 0) return 0;
  flushing = true;

  const batch = buffer;
  buffer = [];
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }

  try {
    await writeRows(db, batch);
    return batch.length;
  } catch (err: unknown) {
    console.error(
      `analytics flush failed for ${batch.length} events:`,
      err instanceof Error ? err.message : err
    );
    return 0;
  } finally {
    flushing = false;
  }
}

/**
 * Queues rows and returns immediately. The caller never waits on the database,
 * so collection cannot slow down the page that produced the events.
 */
export function bufferEvents(db: any, rows: Row[]): { queued: number; dropped: number } {
  if (!rows.length) return { queued: 0, dropped: 0 };

  const room = Math.max(0, MAX_BUFFER - buffer.length);
  const accepted = rows.slice(0, room);
  const lost = rows.length - accepted.length;

  if (lost > 0) {
    dropped += lost;
    // Report in batches rather than per event, so a stall cannot flood the log.
    if (dropped % 1000 < lost) {
      console.warn(`analytics buffer full; dropped ${dropped} events so far`);
    }
  }

  buffer.push(...accepted);

  if (buffer.length >= FLUSH_ROWS) {
    void flushEvents(db);
  } else if (!timer) {
    timer = setTimeout(() => {
      timer = null;
      void flushEvents(db);
    }, FLUSH_MS);
    // Never hold the process open just to flush analytics.
    timer.unref?.();
  }

  return { queued: accepted.length, dropped: lost };
}

export function bufferStats() {
  return { pending: buffer.length, dropped, flush_rows: FLUSH_ROWS, flush_ms: FLUSH_MS };
}
