import { describe, it, expect, beforeEach, vi } from "vitest";

/**
 * The analytics write buffer. No database involved: a fake knex records what
 * would have been written so batching, idempotency and the overflow ceiling can
 * be asserted directly.
 */

type Insert = { rows: any[] };

function fakeDb() {
  const inserts: Insert[] = [];
  let failNext = false;

  const db: any = (table: string) => {
    expect(table).toBe("analytics_event");
    return {
      insert(rows: any[]) {
        const chain = {
          onConflict(column: string) {
            expect(column).toBe("event_key");
            return {
              ignore: async () => {
                if (failNext) {
                  failNext = false;
                  throw new Error("database unavailable");
                }
                inserts.push({ rows });
              },
            };
          },
        };
        return chain;
      },
    };
  };

  db.inserts = inserts;
  db.failOnce = () => {
    failNext = true;
  };
  return db;
}

const row = (key: string) => ({ id: `evt_${key}`, event_key: key, event_type: "product_viewed" });

async function freshBuffer() {
  vi.resetModules();
  return import("../apps/backend/src/lib/analytics-buffer");
}

describe("analytics write buffer", () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it("queues without writing, so the request never waits on the database", async () => {
    const { bufferEvents, bufferStats } = await freshBuffer();
    const db = fakeDb();

    const result = bufferEvents(db, [row("a"), row("b")]);

    expect(result).toEqual({ queued: 2, dropped: 0 });
    expect(db.inserts).toHaveLength(0);
    expect(bufferStats().pending).toBe(2);
  });

  it("writes many events as a single batched insert", async () => {
    const { bufferEvents, flushEvents } = await freshBuffer();
    const db = fakeDb();

    bufferEvents(db, Array.from({ length: 50 }, (_, i) => row(`e${i}`)));
    const written = await flushEvents(db);

    expect(written).toBe(50);
    expect(db.inserts).toHaveLength(1);
    expect(db.inserts[0].rows).toHaveLength(50);
  });

  it("flushes on its own once the row threshold is crossed", async () => {
    const { bufferEvents, bufferStats } = await freshBuffer();
    const db = fakeDb();
    const threshold = bufferStats().flush_rows;

    bufferEvents(db, Array.from({ length: threshold }, (_, i) => row(`t${i}`)));
    await new Promise((resolve) => setImmediate(resolve));

    expect(db.inserts).toHaveLength(1);
    expect(db.inserts[0].rows).toHaveLength(threshold);
    expect(bufferStats().pending).toBe(0);
  });

  it("drops rather than grows without bound when the database is unreachable", async () => {
    const { bufferEvents, bufferStats } = await freshBuffer();
    const db = fakeDb();

    // Far more than the ceiling, queued in one go so no flush can drain it.
    const ceiling = 5000;
    const result = bufferEvents(db, Array.from({ length: ceiling + 500 }, (_, i) => row(`o${i}`)));

    expect(result.queued).toBeLessThanOrEqual(ceiling);
    expect(result.dropped).toBeGreaterThan(0);
    expect(bufferStats().pending).toBeLessThanOrEqual(ceiling);
  });

  it("keeps the idempotency guard so a retried beacon is not counted twice", async () => {
    const { bufferEvents, flushEvents } = await freshBuffer();
    const db = fakeDb();

    bufferEvents(db, [row("same"), row("same")]);
    await flushEvents(db);

    // The guard is asserted inside the fake: onConflict("event_key").ignore().
    expect(db.inserts[0].rows.map((r: any) => r.event_key)).toEqual(["same", "same"]);
  });

  it("never throws when the write fails, and does not wedge the buffer", async () => {
    const { bufferEvents, flushEvents, bufferStats } = await freshBuffer();
    const db = fakeDb();

    bufferEvents(db, [row("x")]);
    db.failOnce();
    await expect(flushEvents(db)).resolves.toBe(0);

    // The failed batch is gone, and the buffer still accepts new work.
    bufferEvents(db, [row("y")]);
    const written = await flushEvents(db);
    expect(written).toBe(1);
    expect(bufferStats().pending).toBe(0);
  });

  it("flushing an empty buffer is a no-op", async () => {
    const { flushEvents } = await freshBuffer();
    const db = fakeDb();
    expect(await flushEvents(db)).toBe(0);
    expect(db.inserts).toHaveLength(0);
  });
});
