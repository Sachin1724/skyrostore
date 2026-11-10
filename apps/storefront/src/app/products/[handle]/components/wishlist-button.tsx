"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { getVisitorId } from "@/lib/analytics";

const STORAGE_KEY = "skyro_wishlist_ids_v1";
export const WISHLIST_EVENT = "skyro:wishlist_updated";

interface WishlistButtonProps {
  productId: string;
  variantId?: string;
  className?: string;
  showLabel?: boolean;
}

export function WishlistButton({
  productId,
  className = "",
  showLabel = false,
}: WishlistButtonProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const ids: string[] = stored ? JSON.parse(stored) : [];
      setIsSaved(ids.includes(productId));
    } catch {
      // Ignored
    }

    const handleUpdate = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        const ids: string[] = stored ? JSON.parse(stored) : [];
        setIsSaved(ids.includes(productId));
      } catch {
        // Ignored
      }
    };

    window.addEventListener(WISHLIST_EVENT, handleUpdate);
    return () => window.removeEventListener(WISHLIST_EVENT, handleUpdate);
  }, [productId]);

  async function toggleWishlist(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    const nextState = !isSaved;
    setIsSaved(nextState);
    setPulse(true);
    setTimeout(() => setPulse(false), 180);

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      let ids: string[] = stored ? JSON.parse(stored) : [];

      if (nextState) {
        ids = Array.from(new Set([...ids, productId]));
      } else {
        ids = ids.filter((id) => id !== productId);
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
      window.dispatchEvent(new Event(WISHLIST_EVENT));

      // Asynchronously sync with backend
      fetch("/api/wishlist", {
        method: nextState ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json", "x-visitor-id": getVisitorId() },
        body: JSON.stringify({ product_id: productId }),
      }).catch(() => null);
    } catch {
      // Ignored
    }
  }

  return (
    <button
      type="button"
      onClick={toggleWishlist}
      aria-label={isSaved ? "Remove from wishlist" : "Save to wishlist"}
      aria-pressed={isSaved}
      className={`inline-flex items-center justify-center transition-colors ${className}`}
    >
      <Heart
        data-pulse={pulse}
        className={`heart-pop h-5 w-5 transition-colors ${
          mounted && isSaved
            ? "fill-error text-error"
            : "text-text-muted hover:text-error"
        }`}
        strokeWidth={mounted && isSaved ? 2 : 1.7}
      />
      {showLabel ? (
        <span className="ml-2 text-[14px] font-semibold text-navy">
          {mounted && isSaved ? "Saved to Wishlist" : "Save to Wishlist"}
        </span>
      ) : null}
    </button>
  );
}
