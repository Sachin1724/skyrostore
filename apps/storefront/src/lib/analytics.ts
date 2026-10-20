/**
 * First-party event tracking for the storefront.
 *
 * Fire-and-forget by design: events are micro-batched and shipped with
 * `navigator.sendBeacon`, so nothing here blocks rendering, cart updates or
 * checkout. Every failure is swallowed.
 */

const ENDPOINT = "/api/analytics";
const VISITOR_KEY = "skyro_visitor_id";
const SESSION_KEY = "skyro_session_id";
const SESSION_SEEN_KEY = "skyro_session_last_seen";
const ATTRIBUTION_KEY = "skyro_attribution";
const SESSION_IDLE_MS = 30 * 60 * 1000;
const FLUSH_DELAY_MS = 800;
const MAX_BATCH = 20;

export type TrackPayload = {
  cart_id?: string | null;
  order_id?: string | null;
  product_id?: string | null;
  variant_id?: string | null;
  line_item_id?: string | null;
  quantity?: number | null;
  value?: number | null;
  currency_code?: string | null;
  search_query?: string | null;
  checkout_step?: string | null;
  metadata?: Record<string, unknown>;
};

type QueuedEvent = TrackPayload & {
  event_key: string;
  event_type: string;
  session_id: string;
  visitor_id: string;
  occurred_at: string;
  page_path?: string;
  referrer?: string | null;
};

let queue: QueuedEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let listenersBound = false;

function safeLocal(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function safeSession(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function randomId(prefix: string): string {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}_${random}`;
}

/** Stable per-browser id. Not tied to a person and never sent anywhere else. */
export function getVisitorId(): string {
  const store = safeLocal();
  const existing = store?.getItem(VISITOR_KEY);
  if (existing) return existing;
  const id = randomId("vis");
  store?.setItem(VISITOR_KEY, id);
  return id;
}

/** Session id, rotated after 30 minutes of inactivity. */
export function getSessionId(): { id: string; isNew: boolean } {
  const store = safeSession();
  const local = safeLocal();
  const now = Date.now();
  const lastSeen = Number(local?.getItem(SESSION_SEEN_KEY) || 0);
  let id = store?.getItem(SESSION_KEY) || local?.getItem(SESSION_KEY) || "";
  let isNew = false;

  if (!id || (lastSeen && now - lastSeen > SESSION_IDLE_MS)) {
    id = randomId("ses");
    isNew = true;
    store?.setItem(SESSION_KEY, id);
    local?.setItem(SESSION_KEY, id);
  }
  local?.setItem(SESSION_SEEN_KEY, String(now));
  return { id, isNew };
}

const UTM_PARAMS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"] as const;

/** Captures campaign attribution once per session and reuses it thereafter. */
export function getAttribution(): Record<string, string> {
  const store = safeSession();
  try {
    const params = new URLSearchParams(window.location.search);
    const fresh: Record<string, string> = {};
    for (const key of UTM_PARAMS) {
      const value = params.get(key);
      if (value) fresh[key] = value.slice(0, 200);
    }
    if (Object.keys(fresh).length) {
      store?.setItem(ATTRIBUTION_KEY, JSON.stringify(fresh));
      return fresh;
    }
    const stored = store?.getItem(ATTRIBUTION_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function currentCartId(): string | null {
  return safeLocal()?.getItem("cart_id") || null;
}

function send(events: QueuedEvent[]) {
  if (!events.length) return;
  const body = JSON.stringify({ events });
  try {
    if (navigator.sendBeacon?.(ENDPOINT, new Blob([body], { type: "application/json" }))) {
      return;
    }
  } catch {
    // Fall through to fetch.
  }
  try {
    void fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    // Analytics never breaks the page.
  }
}

export function flush() {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  const batch = queue;
  queue = [];
  send(batch);
}

function bindLifecycleFlush() {
  if (listenersBound || typeof window === "undefined") return;
  listenersBound = true;
  const onHide = () => flush();
  window.addEventListener("pagehide", onHide);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush();
  });
}

/** Queues one event. Safe to call during render-adjacent effects. */
export function track(eventType: string, payload: TrackPayload = {}) {
  if (typeof window === "undefined") return;
  try {
    const { id: sessionId } = getSessionId();
    const event: QueuedEvent = {
      event_key: randomId("evk"),
      event_type: eventType,
      session_id: sessionId,
      visitor_id: getVisitorId(),
      occurred_at: new Date().toISOString(),
      page_path: window.location.pathname,
      referrer: document.referrer || null,
      cart_id: payload.cart_id ?? currentCartId(),
      ...getAttribution(),
      ...payload,
    };
    queue.push(event);
    bindLifecycleFlush();

    if (queue.length >= MAX_BATCH) {
      flush();
      return;
    }
    if (!flushTimer) {
      flushTimer = setTimeout(flush, FLUSH_DELAY_MS);
    }
  } catch {
    // Never throw from tracking.
  }
}

/** Emits `session_started` once per session. */
export function trackSessionStart() {
  if (typeof window === "undefined") return;
  const { id, isNew } = getSessionId();
  if (!isNew) return;
  track("session_started", { metadata: { session_id_issued: id, landing_path: window.location.pathname } });
}
