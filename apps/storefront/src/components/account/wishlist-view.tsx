"use client";

import { ProductTile } from "@/components/product/product-tile";
import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, Trash2, ShoppingCart, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { ProductMediaFallback } from "@/components/product/product-media-fallback";

interface WishlistItem {
  productId: string;
  variantId?: string;
  title: string;
  handle: string;
  thumbnail: string | null;
  price: number | null;
  currency: string;
  inStock: boolean;
}

const STORAGE_KEY = "skyro_wishlist_ids_v1";

export function WishlistView() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [addedMap, setAddedMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function loadWishlist() {
      try {
        // Try backend first
        const res = await fetch("/api/wishlist");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.items) && data.items.length > 0) {
            setItems(data.items);
            setLoading(false);
            return;
          }
        }

        // Fallback to local storage ids
        const local = localStorage.getItem(STORAGE_KEY);
        const ids: string[] = local ? JSON.parse(local) : [];

        if (ids.length === 0) {
          setItems([]);
          setLoading(false);
          return;
        }

        // Fetch product summaries for local wishlist items
        const fetched: WishlistItem[] = [];
        for (const id of ids.slice(0, 16)) {
          try {
            const pRes = await fetch(`/api/search/suggest?q=${encodeURIComponent(id)}`);
            if (pRes.ok) {
              const pData = await pRes.json();
              if (pData.products?.[0]) {
                const p = pData.products[0];
                const v = p.variants?.[0];
                fetched.push({
                  productId: p.id,
                  variantId: v?.id,
                  title: p.title.replace("[DEV] ", ""),
                  handle: p.handle,
                  thumbnail: p.thumbnail,
                  price: v?.calculated_price?.calculated_amount ?? null,
                  currency: v?.calculated_price?.currency_code ?? "inr",
                  inStock: v?.inventory_quantity == null || v.inventory_quantity > 0,
                });
              }
            }
          } catch {
            // Skip failed lookup
          }
        }
        setItems(fetched);
      } catch {
        // Fallback
      } finally {
        setLoading(false);
      }
    }

    loadWishlist();
  }, []);

  async function handleRemove(productId: string) {
    try {
      await fetch(`/api/wishlist?product_id=${encodeURIComponent(productId)}`, {
        method: "DELETE",
      });

      const next = items.filter((i) => i.productId !== productId);
      setItems(next);

      const local = localStorage.getItem(STORAGE_KEY);
      if (local) {
        const ids: string[] = JSON.parse(local);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(ids.filter((id) => id !== productId)));
      }

      window.dispatchEvent(
        new CustomEvent("skyro:wishlist_updated", {
          detail: { productId, wishlisted: false },
        })
      );
    } catch {
      // Fallback
    }
  }

  function handleAddToCart(item: WishlistItem) {
    if (!item.variantId) return;

    startTransition(async () => {
      try {
        const res = await fetch("/api/cart/add", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ variantId: item.variantId, quantity: 1 }),
        });

        if (res.ok) {
          setAddedMap((prev) => ({ ...prev, [item.productId]: true }));
          window.dispatchEvent(new CustomEvent("skyro:cart_updated"));
          setTimeout(() => {
            setAddedMap((prev) => ({ ...prev, [item.productId]: false }));
          }, 2000);
        }
      } catch {
        // Fallback
      }
    });
  }

  if (loading) {
    return (
      <div className="card p-6">
        <div className="skeleton h-48 rounded-lg" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="card p-8 md:p-14 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-soft text-brand">
          <Heart className="h-6 w-6" aria-hidden />
        </div>
        <h3 className="mt-4 text-[20px] font-extrabold text-navy">Your Wishlist is Empty</h3>
        <p className="mt-1.5 text-[14px] text-text-secondary max-w-[44ch] mx-auto">
          Save motors, flight controllers, and batteries while browsing to review and purchase later.
        </p>
        <Link
          href="/parts"
          className="btn btn-primary mt-6"
        >
          Explore UAV Catalogue
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <div className="border-b border-border pb-4 flex items-center justify-between">
        <div>
          <h2 className="text-[20px] font-extrabold text-navy">Saved Components</h2>
          <p className="text-[13px] text-text-muted">
            {items.length} {items.length === 1 ? "hardware item" : "hardware items"} saved
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((item) => (
          <ProductTile
            key={item.productId}
            href={`/products/${item.handle}`}
            image={item.thumbnail}
            fallback={<ProductMediaFallback title={item.title} />}
            title={item.title}
            price={<p className="text-[16px] font-semibold tabular-nums text-navy">{item.price != null ? formatPrice(item.price, item.currency) : "Price on request"}</p>}
            status={<p className={`text-[13px] font-medium ${item.inStock ? "text-success" : "text-text-muted"}`}>{item.inStock ? "In stock" : "Out of stock"}</p>}
            overlay={
              <button
                type="button"
                onClick={() => handleRemove(item.productId)}
                aria-label={`Remove ${item.title} from wishlist`}
                className="absolute right-2.5 top-2.5 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white text-text-muted transition-colors hover:text-error"
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </button>
            }
            action={
              <button
                type="button"
                onClick={() => handleAddToCart(item)}
                disabled={!item.inStock || isPending}
                className={`btn btn-sm ${addedMap[item.productId] ? "btn-light" : "btn-primary"}`}
              >
                {isPending && !addedMap[item.productId] ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : addedMap[item.productId] ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" aria-hidden /> Added
                  </>
                ) : (
                  "Move to cart"
                )}
              </button>
            }
          />
        ))}
      </div>
    </div>
  );
}
