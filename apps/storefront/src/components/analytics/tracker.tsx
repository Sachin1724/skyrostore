"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { track, trackSessionStart } from "@/lib/analytics";

/**
 * Mounted once in the root layout. Emits `session_started` and
 * `search_performed`; page-specific events are emitted by the components that
 * own the action (add to cart, checkout steps, product detail).
 */
export function AnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    trackSessionStart();
  }, []);

  const query = searchParams.get("q");

  useEffect(() => {
    if (pathname !== "/search" || !query) return;
    track("search_performed", { search_query: query });
  }, [pathname, query]);

  return null;
}
