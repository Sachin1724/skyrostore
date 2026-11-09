"use client";

import { useEffect, useState } from "react";

type Review = {
  id: string;
  product_id: string;
  author_name: string;
  rating: number;
  title: string;
  content: string;
  verified_purchase: boolean;
  status: "PENDING" | "APPROVED" | "REJECTED";
  created_at: string;
};

type Question = {
  id: string;
  product_id: string;
  author_name: string;
  question: string;
  answer: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  created_at: string;
};

const card = "rounded border border-gray-200 p-4";
const btn = "rounded px-3 py-1.5 text-xs font-medium disabled:opacity-50";

export function ModerationView() {
  const [tab, setTab] = useState<"reviews" | "questions">("reviews");
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function loadReviews() {
    fetch("/api/moderation/reviews?status=PENDING")
      .then((r) => r.json())
      .then((d) => setReviews(d.reviews ?? []))
      .catch(() => setError("Could not load reviews"));
  }
  function loadQuestions() {
    fetch("/api/moderation/questions")
      .then((r) => r.json())
      .then((d) => setQuestions((d.questions ?? []).filter((q: Question) => !q.answer)))
      .catch(() => setError("Could not load questions"));
  }

  useEffect(() => {
    loadReviews();
    loadQuestions();
  }, []);

  async function decideReview(id: string, status: "APPROVED" | "REJECTED") {
    setBusy(id);
    setError(null);
    try {
      const res = await fetch("/api/moderation/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ review_id: id, status }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Could not update review");
      setReviews((rs) => rs?.filter((r) => r.id !== id) ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update review");
    } finally {
      setBusy(null);
    }
  }

  async function decideQuestion(id: string, status: "APPROVED" | "REJECTED") {
    const answer = answers[id]?.trim();
    if (status === "APPROVED" && !answer) {
      setError("Write an answer before approving.");
      return;
    }
    setBusy(id);
    setError(null);
    try {
      const res = await fetch("/api/moderation/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(status === "APPROVED" ? { question_id: id, answer } : { question_id: id, status }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Could not update question");
      setQuestions((qs) => qs?.filter((q) => q.id !== id) ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update question");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mt-6 max-w-3xl">
      <div className="flex gap-4 border-b border-gray-200">
        <button
          onClick={() => setTab("reviews")}
          className={`pb-2 text-sm font-medium ${tab === "reviews" ? "border-b-2 border-gray-900 text-gray-900" : "text-gray-500"}`}
        >
          Reviews ({reviews?.length ?? "…"})
        </button>
        <button
          onClick={() => setTab("questions")}
          className={`pb-2 text-sm font-medium ${tab === "questions" ? "border-b-2 border-gray-900 text-gray-900" : "text-gray-500"}`}
        >
          Questions ({questions?.length ?? "…"})
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {tab === "reviews" ? (
        <div className="mt-4 space-y-3">
          {reviews?.length === 0 && <p className="text-sm text-gray-500">Nothing pending.</p>}
          {reviews?.map((r) => (
            <div key={r.id} className={card}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {r.title} — {r.rating}★ {r.verified_purchase && <span className="text-xs text-green-700">verified purchase</span>}
                  </p>
                  <p className="mt-1 text-sm text-gray-700">{r.content}</p>
                  <p className="mt-1 text-xs text-gray-400">{r.author_name} · product {r.product_id}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button disabled={busy === r.id} onClick={() => decideReview(r.id, "APPROVED")} className={`${btn} bg-green-100 text-green-800`}>
                    Approve
                  </button>
                  <button disabled={busy === r.id} onClick={() => decideReview(r.id, "REJECTED")} className={`${btn} bg-red-100 text-red-800`}>
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {questions?.length === 0 && <p className="text-sm text-gray-500">Nothing pending.</p>}
          {questions?.map((q) => (
            <div key={q.id} className={card}>
              <p className="text-sm font-semibold text-gray-900">{q.question}</p>
              <p className="mt-1 text-xs text-gray-400">{q.author_name} · product {q.product_id}</p>
              <textarea
                rows={2}
                placeholder="Write an answer…"
                value={answers[q.id] ?? ""}
                onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                className="mt-2 w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none"
              />
              <div className="mt-2 flex gap-2">
                <button disabled={busy === q.id} onClick={() => decideQuestion(q.id, "APPROVED")} className={`${btn} bg-green-100 text-green-800`}>
                  Answer &amp; publish
                </button>
                <button disabled={busy === q.id} onClick={() => decideQuestion(q.id, "REJECTED")} className={`${btn} bg-red-100 text-red-800`}>
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
