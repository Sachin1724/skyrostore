"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import type { SiteContent } from "@/app/api/site-content/route";
import { UploadButton, LibraryButton } from "../products/image-uploader";

const EMPTY: SiteContent = { heroSlides: [], heroTitle: "", heroSentence: "", faq: [], closingTitle: "", closingSentence: "" };
const input = "mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none";

function Field({ label, value, onChange, max, long }: { label: string; value: string; onChange: (v: string) => void; max: number; long?: boolean }) {
  return (
    <label className="block text-sm font-medium text-gray-700">
      {label}
      {long ? (
        <textarea rows={3} maxLength={max} value={value} onChange={(e) => onChange(e.target.value)} className={input} />
      ) : (
        <input maxLength={max} value={value} onChange={(e) => onChange(e.target.value)} className={input} />
      )}
    </label>
  );
}

export function ContentEditor({ storefrontUrl }: { storefrontUrl: string }) {
  const [content, setContent] = useState<SiteContent | null>(null);
  const [published, setPublished] = useState<SiteContent | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/site-content")
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || "Could not load content");
        setPublished(data.published);
        setContent({ ...EMPTY, ...(data.draft ?? data.published ?? {}) });
      })
      .catch((err: Error) => setMessage({ ok: false, text: err.message }));
  }, []);

  if (!content) {
    return <p className="mt-6 text-sm text-gray-500">{message?.text ?? "Loading…"}</p>;
  }

  const set = (patch: Partial<SiteContent>) => setContent({ ...content, ...patch });
  const setFaq = (faq: SiteContent["faq"]) => set({ faq });
  const move = (i: number, by: number) => {
    const faq = [...content.faq];
    [faq[i], faq[i + by]] = [faq[i + by], faq[i]];
    setFaq(faq);
  };

  async function save(publish: boolean) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/site-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, publish }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save");
      setContent({ ...EMPTY, ...data.content });
      if (publish) setPublished(data.content);
      setMessage({
        ok: true,
        text: !publish
          ? "Draft saved. The live site is unchanged."
          : data.refreshed
          ? "Published. The homepage shows it now."
          : "Published. The storefront could not be told to refresh, so it can take up to an hour to show.",
      });
    } catch (err: unknown) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : "Could not save" });
    } finally {
      setBusy(false);
    }
  }

  const unpublished = JSON.stringify({ ...EMPTY, ...published }) !== JSON.stringify(content);

  return (
    <div className="mt-6 space-y-6">
      <section className="rounded-md border border-gray-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-gray-900">Banner slides</h2>
        <p className="mt-1 text-sm text-gray-500">Wide images (about 1920 x 600) at the top of the homepage, up to 6. With none, the site shows its standard banner.</p>
        <ol className="mt-4 space-y-4">
          {content.heroSlides.map((s, i) => {
            const setSlide = (patch: Partial<typeof s>) => set({ heroSlides: content.heroSlides.map((x, j) => (j === i ? { ...x, ...patch } : x)) });
            return (
              <li key={i} className="rounded border border-gray-200 p-3">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Slide {i + 1}</span>
                  <button type="button" aria-label="Remove slide" onClick={() => set({ heroSlides: content.heroSlides.filter((_, j) => j !== i) })} className="hover:text-rose-600"><Trash2 className="h-4 w-4" /></button>
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {s.image && <img src={s.image} alt="" className="mt-2 h-24 w-full rounded border border-gray-200 object-cover" />}
                <div className="mt-2 flex gap-2">
                  <UploadButton multiple={false} label={s.image ? "Replace image" : "Upload image"} onUploaded={(urls) => setSlide({ image: urls[0] || "" })} />
                  <LibraryButton onPicked={(urls) => setSlide({ image: urls[0] || "" })} />
                </div>
                <div className="mt-3 space-y-3">
                  <Field label="Headline (optional)" value={s.title} onChange={(title) => setSlide({ title })} max={80} />
                  <Field label="Line under it (optional)" value={s.text} onChange={(text) => setSlide({ text })} max={160} />
                  <Field label="Button text (optional)" value={s.cta} onChange={(cta) => setSlide({ cta })} max={30} />
                  <Field label="Link, for example /parts or /brands/dji" value={s.href} onChange={(href) => setSlide({ href })} max={200} />
                </div>
              </li>
            );
          })}
        </ol>
        <button type="button" disabled={content.heroSlides.length >= 6} onClick={() => set({ heroSlides: [...content.heroSlides, { image: "", title: "", text: "", cta: "", href: "" }] })} className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-gray-900 hover:underline disabled:opacity-40">
          <Plus className="h-4 w-4" /> Add a slide
        </button>
      </section>

      <section className="space-y-4 rounded-md border border-gray-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-gray-900">Top of the page</h2>
        <Field label="Headline" value={content.heroTitle} onChange={(heroTitle) => set({ heroTitle })} max={80} />
        <Field label="Sentence under the headline" value={content.heroSentence} onChange={(heroSentence) => set({ heroSentence })} max={240} long />
      </section>

      <section className="rounded-md border border-gray-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-gray-900">Questions and answers</h2>
        <p className="mt-1 text-sm text-gray-500">Shown in this order. With none, the site keeps its standard questions.</p>
        <ol className="mt-4 space-y-4">
          {content.faq.map((item, i) => (
            <li key={i} className="rounded border border-gray-200 p-3">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Question {i + 1}</span>
                <span className="flex gap-2">
                  <button type="button" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)} className="hover:text-gray-900 disabled:opacity-30"><ArrowUp className="h-4 w-4" /></button>
                  <button type="button" aria-label="Move down" disabled={i === content.faq.length - 1} onClick={() => move(i, 1)} className="hover:text-gray-900 disabled:opacity-30"><ArrowDown className="h-4 w-4" /></button>
                  <button type="button" aria-label="Remove question" onClick={() => setFaq(content.faq.filter((_, j) => j !== i))} className="hover:text-rose-600"><Trash2 className="h-4 w-4" /></button>
                </span>
              </div>
              <div className="mt-2 space-y-3">
                <Field label="Question" value={item.q} onChange={(q) => setFaq(content.faq.map((f, j) => (j === i ? { ...f, q } : f)))} max={160} />
                <Field label="Answer" value={item.a} onChange={(a) => setFaq(content.faq.map((f, j) => (j === i ? { ...f, a } : f)))} max={800} long />
              </div>
            </li>
          ))}
        </ol>
        <button
          type="button"
          disabled={content.faq.length >= 20}
          onClick={() => setFaq([...content.faq, { q: "", a: "" }])}
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-gray-900 hover:underline disabled:opacity-40"
        >
          <Plus className="h-4 w-4" /> Add a question
        </button>
      </section>

      <section className="space-y-4 rounded-md border border-gray-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-gray-900">Bulk order band</h2>
        <Field label="Heading" value={content.closingTitle} onChange={(closingTitle) => set({ closingTitle })} max={80} />
        <Field label="Sentence" value={content.closingSentence} onChange={(closingSentence) => set({ closingSentence })} max={240} long />
      </section>

      <p className="text-sm text-gray-500">Empty fields keep the site&apos;s standard text. Questions missing a question or an answer are dropped on save.</p>

      <div className="sticky bottom-0 flex flex-wrap items-center gap-3 border-t border-gray-200 bg-gray-50 py-4">
        <button type="button" disabled={busy} onClick={() => save(false)} className="rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100 disabled:opacity-50">
          Save draft
        </button>
        <button type="button" disabled={busy} onClick={() => save(true)} className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black disabled:opacity-50">
          Publish
        </button>
        <a href={storefrontUrl} target="_blank" rel="noreferrer" className="text-sm font-medium text-gray-700 hover:underline">
          View the live homepage
        </a>
        <span aria-live="polite" className={`text-sm ${message?.ok === false ? "text-rose-700" : "text-gray-600"}`}>
          {message?.text ?? (unpublished ? "Changes not published yet." : "")}
        </span>
      </div>
    </div>
  );
}
