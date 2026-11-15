"use client";

import { useEffect } from "react";

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div role="alert" className="mx-auto mt-16 max-w-md rounded-lg border border-rose-200 bg-rose-50 p-6 text-center">
      <h1 className="text-base font-semibold text-rose-900">This page could not load</h1>
      <p className="mt-1 text-sm text-rose-800">
        The server did not answer as expected. Check that the backend is running, then try again.
      </p>
      <button type="button" onClick={reset} className="mt-4 rounded bg-gray-900 px-4 py-2 text-xs font-semibold text-white hover:bg-gray-800">
        Try again
      </button>
      {error.digest ? <p className="mt-3 font-mono text-[11px] text-rose-700">Reference: {error.digest}</p> : null}
    </div>
  );
}
