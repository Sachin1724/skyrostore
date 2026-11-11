"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

/**
 * Goes back a page. When this page was opened directly (a shared link, a new tab)
 * there is nothing to go back to, so it follows `fallback` instead.
 */
export function BackLink({ fallback = "/", label = "Back" }: { fallback?: string; label?: string }) {
  const router = useRouter();

  function goBack() {
    const sameSiteHistory =
      typeof window !== "undefined" &&
      window.history.length > 1 &&
      (!document.referrer || new URL(document.referrer).origin === window.location.origin);
    if (sameSiteHistory) router.back();
    else router.push(fallback);
  }

  return (
    <button
      type="button"
      onClick={goBack}
      className="-ml-1 inline-flex min-h-9 items-center gap-1.5 rounded-full pl-1 pr-2.5 text-[14px] font-medium text-text-secondary transition-colors hover:text-navy"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden />
      {label}
    </button>
  );
}
