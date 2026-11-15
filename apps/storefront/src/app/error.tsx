"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main id="main" className="flex min-h-[70vh] items-center justify-center bg-surface-soft px-4 py-16">
      <div className="max-w-[520px] text-center">
        <h1 className="text-[clamp(1.75rem,1.4rem+1.5vw,2.5rem)] font-extrabold tracking-tight text-navy">
          Something went wrong on our side
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-text-secondary">
          The page could not load. Your cart is safe. Try again, or head back to the store.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={reset} className="bg-graphite px-5 py-3 text-[14px] font-semibold text-white hover:bg-black">
            Try again
          </button>
          <Link href="/" className="border border-border bg-white px-5 py-3 text-[14px] font-semibold text-navy hover:bg-surface-soft">
            Go to home
          </Link>
        </div>
        {error.digest ? <p className="mt-6 font-mono text-[12px] text-text-muted">Reference: {error.digest}</p> : null}
      </div>
    </main>
  );
}
