"use client";

import { useSyncExternalStore } from "react";

// The buyer's delivery PIN code, entered once (header chip or product page) and reused everywhere.
const KEY = "delivery_pin";
const EVENT = "delivery-pin";

function read(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function saveDeliveryPin(pin: string) {
  try {
    localStorage.setItem(KEY, pin);
  } catch {
    // Private mode: the PIN only lives for this page.
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export const useDeliveryPin = () => useSyncExternalStore(subscribe, read, () => null);
