"use client";

import { useEffect, useState, useRef } from "react";
import { Check, Star, User, X } from "lucide-react";

interface Review {
  id: string;
  author_name: string;
  rating: number;
  title: string;
  content: string;
  verified_purchase: boolean;
  hardware_setup: string | null;
  created_at: string;
}

interface ProductReviewsProps {
  productId: string;
  productTitle: string;
}

export function ProductReviews({ productId, productTitle }: ProductReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [average, setAverage] = useState(0);
  const [total, setTotal] = useState(0);
  const [breakdown, setBreakdown] = useState<Record<number, number>>({ 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Form State
  const [formRating, setFormRating] = useState(5);
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formAuthor, setFormAuthor] = useState("");
  const [formSetup, setFormSetup] = useState("");

  const modalRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    fetch(`/api/products/${productId}/reviews`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setReviews(data.reviews || []);
          setAverage(data.average_rating || 0);
          setTotal(data.total_reviews || 0);
          setBreakdown(data.breakdown || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });
        }
      })
      .catch(() => null);
  }, [productId]);

  useEffect(() => {
    const dialog = modalRef.current;
    if (!dialog) return;
    if (isModalOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isModalOpen && dialog.open) {
      dialog.close();
    }
  }, [isModalOpen]);

  async function handleSubmitReview(e: React.FormEvent) {
    e.preventDefault();
    if (!formTitle || !formContent || !formAuthor || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/products/${productId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: formRating,
          title: formTitle,
          content: formContent,
          author_name: formAuthor,
          hardware_setup: formSetup,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const createdReview = data.review;
        if (createdReview) {
          setReviews((prev) => [createdReview, ...prev]);
          setTotal((prev) => prev + 1);
        }
        setSubmitted(true);
        setTimeout(() => {
          setIsModalOpen(false);
          setSubmitted(false);
          setFormTitle("");
          setFormContent("");
          setFormAuthor("");
          setFormSetup("");
        }, 1800);
      }
    } catch {
      // Ignored
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section id="reviews" aria-labelledby="reviews-heading" className="scroll-mt-36 pt-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6">
        <div>
          <h2 id="reviews-heading" className="text-[22px] font-extrabold tracking-[-0.02em] text-navy">
            Verified Builder Reviews
          </h2>
          <p className="mt-1 text-[14px] text-text-secondary">
            Authentic feedback from pilots and engineers testing on bench and field.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="self-start sm:self-auto rounded-md bg-navy px-5 py-2.5 text-[14px] font-bold text-white transition-colors hover:bg-brand"
        >
          Write a Review
        </button>
      </div>

      {total > 0 ? (
        <div className="mt-8 grid gap-8 lg:grid-cols-[280px_1fr]">
          {/* Summary Card */}
          <div className="card p-6">
            <div className="flex items-baseline gap-3">
              <span className="text-[44px] font-extrabold tabular-nums text-navy">{average}</span>
              <span className="text-[16px] text-text-secondary">out of 5</span>
            </div>

            <div className="mt-2 flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-5 w-5 ${
                    star <= Math.round(average)
                      ? "fill-brand text-brand"
                      : "fill-border text-border-strong"
                  }`}
                />
              ))}
              <span className="ml-2 text-[13px] font-semibold text-text-secondary tabular-nums">
                ({total} {total === 1 ? "review" : "reviews"})
              </span>
            </div>

            {/* Rating Breakdown Bars */}
            <div className="mt-6 space-y-2">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = breakdown[star] || 0;
                const percent = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={star} className="flex items-center gap-2 text-[13px] font-medium text-navy">
                    <span className="w-8 tabular-nums">{star} star</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-soft">
                      <div
                        className="h-full rounded-full bg-brand transition-all duration-300"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <span className="w-8 text-right text-text-secondary tabular-nums">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Review List */}
          <div className="space-y-4">
            {reviews.map((r) => (
              <article key={r.id} className="card p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-soft text-navy">
                      <User className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="block text-[14px] font-bold text-navy">{r.author_name}</span>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`h-3.5 w-3.5 ${
                              s <= r.rating ? "fill-brand text-brand" : "fill-border text-border-strong"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {r.verified_purchase ? (
                      <span className="flex items-center gap-1 rounded bg-success-soft px-2 py-0.5 text-[13px] font-bold text-success">
                        <Check className="h-3 w-3" strokeWidth={3} /> Verified Purchase
                      </span>
                    ) : null}
                    <time className="text-[13px] text-text-muted">
                      {new Date(r.created_at).toLocaleDateString("en-IN", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </time>
                  </div>
                </div>

                <h3 className="mt-3 text-[16px] font-bold text-navy">{r.title}</h3>
                <p className="mt-1.5 text-[14px] leading-relaxed text-text-secondary whitespace-pre-line">
                  {r.content}
                </p>

                {r.hardware_setup ? (
                  <div className="mt-3 inline-flex items-center gap-1.5 rounded bg-surface-soft px-2.5 py-1 text-[13px] font-semibold text-text-secondary">
                    <span className="font-bold text-navy">Hardware Setup:</span> {r.hardware_setup}
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-8 card p-8 text-center">
          <p className="text-[16px] font-bold text-navy">No reviews submitted yet.</p>
          <p className="mt-1 text-[14px] text-text-secondary max-w-[50ch] mx-auto">
            Be the first verified builder to review the {productTitle}. Share your flight logs, torque specs, and build notes.
          </p>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="mt-4 rounded-md bg-brand px-6 py-2.5 text-[14px] font-bold text-white transition-colors hover:bg-navy"
          >
            Leave First Review
          </button>
        </div>
      )}

      {/* Review Submission Modal */}
      <dialog
        ref={modalRef}
        onClose={() => setIsModalOpen(false)}
        className="pop m-auto w-[min(92vw,560px)] card p-6 shadow-2xl backdrop:bg-navy/70"
      >
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h3 className="text-[18px] font-bold text-navy">Write a Review</h3>
          <button
            type="button"
            onClick={() => setIsModalOpen(false)}
            aria-label="Close review dialog"
            className="text-text-muted hover:text-navy"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {submitted ? (
          <div className="py-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success-soft text-success">
              <Check className="h-6 w-6" strokeWidth={3} />
            </div>
            <p className="mt-3 text-[16px] font-bold text-navy">Thank You!</p>
            <p className="mt-1 text-[14px] text-text-secondary">
              Your verified review has been submitted.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmitReview} className="mt-4 space-y-4">
            <div>
              <label className="block text-[13px] font-bold text-navy">Overall Rating</label>
              <div className="mt-1.5 flex gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFormRating(star)}
                    className="p-1 hover:scale-110 transition-transform"
                    aria-label={`${star} star`}
                  >
                    <Star
                      className={`h-6 w-6 ${
                        star <= formRating ? "fill-brand text-brand" : "fill-border text-border-strong"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="rev-title" className="block text-[13px] font-bold text-navy">
                Review Headline
              </label>
              <input
                id="rev-title"
                required
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="e.g. Smooth throttle curve, excellent torque on 6S"
                className="mt-1 h-10 w-full rounded-md border border-border-strong bg-white px-3 text-[14px] text-navy"
              />
            </div>

            <div>
              <label htmlFor="rev-content" className="block text-[13px] font-bold text-navy">
                Written Review
              </label>
              <textarea
                id="rev-content"
                required
                rows={4}
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                placeholder="Describe your testing experience, flight efficiency, thermal dissipation, or setup notes..."
                className="mt-1 w-full rounded-md border border-border-strong bg-white p-3 text-[14px] text-navy"
              />
            </div>

            <div>
              <label htmlFor="rev-setup" className="block text-[13px] font-bold text-navy">
                Hardware Setup (Optional)
              </label>
              <input
                id="rev-setup"
                value={formSetup}
                onChange={(e) => setFormSetup(e.target.value)}
                placeholder="e.g. 7-inch CineWhoop, 50A ESC, 6S 4500mAh pack"
                className="mt-1 h-10 w-full rounded-md border border-border-strong bg-white px-3 text-[14px] text-navy"
              />
            </div>

            <div>
              <label htmlFor="rev-author" className="block text-[13px] font-bold text-navy">
                Your Name / Call-sign
              </label>
              <input
                id="rev-author"
                required
                value={formAuthor}
                onChange={(e) => setFormAuthor(e.target.value)}
                placeholder="e.g. Capt. Dinesh S. / Team Aeros"
                className="mt-1 h-10 w-full rounded-md border border-border-strong bg-white px-3 text-[14px] text-navy"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary w-full"
              >
                {submitting ? "Submitting Review..." : "Submit Verified Review"}
              </button>
            </div>
          </form>
        )}
      </dialog>
    </section>
  );
}
