"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";

type ConfirmOptions = { title: string; description?: string; confirmLabel?: string };
type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

/** Accessible replacement for window.confirm() — same call shape, resolves true/false. */
export function useConfirm(): ConfirmFn {
  const confirm = useContext(ConfirmContext);
  if (!confirm) throw new Error("useConfirm must be used within ConfirmDialogProvider");
  return confirm;
}

export function ConfirmDialogProvider({ children }: { children: React.ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<(value: boolean) => void>(() => {});

  const confirm = useCallback<ConfirmFn>((opts) => {
    setOptions(opts);
    return new Promise((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  function close(result: boolean) {
    setOptions(null);
    resolver.current(result);
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {options ? (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 transition-opacity duration-[180ms] ease-out starting:opacity-0"
        >
          <div className="w-full max-w-sm rounded-md bg-white p-5 shadow-lg transition-[opacity,transform] duration-[180ms] ease-out starting:scale-95 starting:opacity-0">
            <h2 id="confirm-title" className="text-sm font-semibold text-gray-900">{options.title}</h2>
            {options.description ? <p className="mt-1.5 text-sm text-gray-600">{options.description}</p> : null}
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                autoFocus
                onClick={() => close(false)}
                className="rounded border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => close(true)}
                className="rounded bg-rose-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900"
              >
                {options.confirmLabel || "Confirm"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </ConfirmContext.Provider>
  );
}
