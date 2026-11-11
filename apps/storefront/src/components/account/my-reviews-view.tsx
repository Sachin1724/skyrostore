"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Star, Clock, CheckCircle2, XCircle } from "lucide-react";

type Review = {
  id: string;
  rating: number;
  title: string;
  content: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  created_at: string;
  product: { title: string; handle: string; thumbnail: string | null } | null;
};

const STATUS: Record<Review["status"], { label: string; icon: typeof Clock; className: string }> = {
  APPROVED: { label: "Published", icon: CheckCircle2, className: "text-success" },
  PENDING: { label: "Awaiting approval", icon: Clock, className: "text-amber-600" },
  REJECTED: { label: "Not published", icon: XCircle, className: "text-error" },
};

export function MyReviewsView() {
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/my-reviews")
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || "Could not load reviews");
        setReviews(data.reviews ?? []);
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  if (error) {
    return <p className="card p-6 text-[14px] text-error">{error}</p>;
  }

  if (!reviews) {
    return (
      <div className="card p-6">
        <div className="skeleton h-48 rounded-lg" />
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="card flex flex-col items-center gap-3 p-10 text-center">
        <Star className="h-8 w-8 text-text-muted" aria-hidden />
        <p className="text-[15px] font-bold text-navy">No reviews yet</p>
        <p className="max-w-xs text-[13px] text-text-secondary">
          Reviews you leave on product pages appear here, including ones still awaiting approval.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {reviews.map((r) => {
        const status = STATUS[r.status];
        const Icon = status.icon;
        return (
          <li key={r.id} className="card p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                {r.product ? (
                  <Link href={`/products/${r.product.handle}`} className="text-[13px] font-bold text-brand hover:underline">
                    {r.product.title}
                  </Link>
                ) : null}
                <p className="mt-1 text-[14px] font-bold text-navy">
                  {r.title} — {r.rating}★
                </p>
              </div>
              <p className="flex items-center gap-1.5 text-[12px] font-semibold">
                <Icon className={`h-3.5 w-3.5 ${status.className}`} aria-hidden />
                <span className={status.className}>{status.label}</span>
              </p>
            </div>
            <p className="mt-2 text-[13px] text-text-secondary">{r.content}</p>
            <p className="mt-2 text-[11px] text-text-muted">{new Date(r.created_at).toLocaleDateString("en-IN")}</p>
          </li>
        );
      })}
    </ul>
  );
}
