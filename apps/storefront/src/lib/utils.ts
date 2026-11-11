import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Strips the seed marker so it never reaches customers. */
export const cleanName = (name: string) => name.replace("[DEV] ", "");

/** ₹14,999 for whole rupees (as Indian stores print it), ₹1,144.08 when there are paise. */
export function formatPrice(amount: number, currency = "INR") {
  const digits = amount % 100 === 0 ? 0 : 2;
  return new Intl.NumberFormat("en-IN", { style: "currency", currency, minimumFractionDigits: digits, maximumFractionDigits: digits }).format(
    amount / 100
  );
}
