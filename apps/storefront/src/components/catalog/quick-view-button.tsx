"use client";

import { Eye } from "lucide-react";
import type { HttpTypes } from "@medusajs/types";

interface QuickViewButtonProps {
  product: HttpTypes.StoreProduct;
  className?: string;
  variant?: "icon" | "pill";
}

export function QuickViewButton({ product, className = "", variant = "icon" }: QuickViewButtonProps) {
  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    window.dispatchEvent(
      new CustomEvent("skyro:open_quickview", {
        detail: product,
      })
    );
  }

  if (variant === "pill") {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-label={`Quick view ${product.title}`}
        className={`inline-flex items-center gap-1.5 rounded bg-white px-3 py-1.5 text-[13px] font-bold text-navy transition-all hover:bg-navy hover:text-white ${className}`}
      >
        <Eye className="h-3.5 w-3.5" aria-hidden />
        <span>Quick View</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={`Quick view ${product.title}`}
      className={`flex h-8 w-8 items-center justify-center rounded-full bg-white text-navy transition-transform hover:scale-110 hover:text-brand ${className}`}
    >
      <Eye className="h-4 w-4" aria-hidden />
    </button>
  );
}
