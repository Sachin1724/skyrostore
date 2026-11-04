"use client";

import { useEffect, useState } from "react";
import { Check, HelpCircle, MessageSquare, ShieldCheck } from "lucide-react";

interface Question {
  id: string;
  author_name: string;
  question: string;
  answer: string | null;
  answered_by: string | null;
  created_at: string;
  answered_at: string | null;
}

interface ProductQuestionsProps {
  productId: string;
  productTitle: string;
}

export function ProductQuestions({ productId, productTitle }: ProductQuestionsProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [total, setTotal] = useState(0);
  const [isAsking, setIsAsking] = useState(false);
  const [questionText, setQuestionText] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetch(`/api/products/${productId}/questions`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setQuestions(data.questions || []);
          setTotal(data.total_questions || 0);
        }
      })
      .catch(() => null);
  }, [productId]);

  async function handleAskQuestion(e: React.FormEvent) {
    e.preventDefault();
    if (!questionText || !authorName || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/products/${productId}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: questionText,
          author_name: authorName,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const createdQuestion = data.question;
        if (createdQuestion) {
          setQuestions((prev) => [createdQuestion, ...prev]);
          setTotal((prev) => prev + 1);
        }
        setSubmitted(true);
        setTimeout(() => {
          setIsAsking(false);
          setSubmitted(false);
          setQuestionText("");
          setAuthorName("");
        }, 2200);
      }
    } catch {
      // Ignored
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section id="questions" aria-labelledby="questions-heading" className="scroll-mt-36 pt-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6">
        <div>
          <h2 id="questions-heading" className="text-[22px] font-extrabold tracking-[-0.02em] text-navy">
            Questions &amp; Technical Answers
          </h2>
          <p className="mt-1 text-[14px] text-text-secondary">
            Verified wiring pinouts, voltage compatibility, and firmware advice from our engineering team.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAsking((prev) => !prev)}
          className="self-start sm:self-auto rounded-md border border-navy px-5 py-2.5 text-[14px] font-bold text-navy transition-colors hover:bg-navy hover:text-white"
        >
          {isAsking ? "Cancel Question" : "Ask a Question"}
        </button>
      </div>

      {/* Ask Question Form */}
      {isAsking ? (
        <div className="mt-6 rounded-lg border border-border bg-surface-soft p-5 sm:p-6">
          <h3 className="text-[16px] font-bold text-navy flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-brand" /> Ask About {productTitle}
          </h3>

          {submitted ? (
            <div className="mt-4 rounded bg-success-soft p-4 text-[14px] font-semibold text-success flex items-center gap-2">
              <Check className="h-5 w-5" /> Question submitted! Our engineering staff will review and respond shortly.
            </div>
          ) : (
            <form onSubmit={handleAskQuestion} className="mt-4 space-y-3">
              <div>
                <label htmlFor="q-text" className="block text-[13px] font-bold text-navy">
                  Your Technical Question
                </label>
                <textarea
                  id="q-text"
                  required
                  rows={3}
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder="e.g. Can this motor handle continuous full throttle on 6S with 15x5.5 propellers?"
                  className="mt-1 w-full rounded-md border border-border-strong bg-white p-3 text-[14px] text-navy"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="q-author" className="block text-[13px] font-bold text-navy">
                    Your Name / Organization
                  </label>
                  <input
                    id="q-author"
                    required
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder="e.g. Rahul M. / Aerobotics Lab"
                    className="mt-1 h-10 w-full rounded-md border border-border-strong bg-white px-3 text-[14px] text-navy"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn btn-primary w-full"
                  >
                    {submitting ? "Submitting..." : "Submit Question"}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      ) : null}

      {/* Questions List */}
      {total > 0 ? (
        <div className="mt-6 space-y-4">
          {questions.map((q) => (
            <article key={q.id} className="card p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand font-bold text-[13px]">
                  Q
                </div>
                <div className="flex-1">
                  <h3 className="text-[16px] font-bold text-navy">{q.question}</h3>
                  <div className="mt-1 flex items-center gap-2 text-[13px] text-text-muted">
                    <span>Asked by {q.author_name}</span>
                    <span>&bull;</span>
                    <time>
                      {new Date(q.created_at).toLocaleDateString("en-IN", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </time>
                  </div>
                </div>
              </div>

              {q.answer ? (
                <div className="mt-4 ml-10 rounded-md border-l-2 border-brand bg-surface-soft p-4">
                  <div className="flex items-center gap-1.5 text-[13px] font-bold text-brand">
                    <ShieldCheck className="h-4 w-4" />
                    <span>Answered by {q.answered_by || "Skyrostore Engineering Team"}</span>
                  </div>
                  <p className="mt-1.5 text-[14px] leading-relaxed text-navy whitespace-pre-line">
                    {q.answer}
                  </p>
                </div>
              ) : (
                <div className="mt-3 ml-10 text-[13px] text-text-muted italic">
                  Awaiting staff answer from Skyrostore technical desk.
                </div>
              )}
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-3 rounded-xl bg-white px-5 py-4">
          <MessageSquare className="h-5 w-5 shrink-0 text-text-muted" aria-hidden />
          <p className="flex-1 text-[14px] text-text-secondary">
            No questions yet. Ask about wiring, voltage tolerance or CAD files and our team answers here.
          </p>
          <button type="button" onClick={() => setIsAsking(true)} className="btn btn-secondary btn-sm">
            Ask a question
          </button>
        </div>
      )}
    </section>
  );
}
