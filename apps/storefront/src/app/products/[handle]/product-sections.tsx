"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Copy, FileText, Package } from "lucide-react";
import type { TechnicalSpecificationField } from "@/lib/technical-specs";
import { fileSize, type Listing } from "@/lib/listing";

const GROUP_ORDER = ["General", "Performance", "Electrical", "Mechanical", "Dimensions", "Compatibility"];

/**
 * The long half of the product page: a sticky row of section tabs and the sections
 * themselves. A tab exists only when its section has data; tabs are plain #anchors,
 * so every section is deep-linkable and works without script.
 */
export function ProductSections({
  description,
  specs,
  listing,
}: {
  description: string | null;
  specs: TechnicalSpecificationField[];
  listing: Listing;
}) {
  const sections = [
    { id: "overview", label: "Overview", show: Boolean(description || listing.key_features.length) },
    { id: "specifications", label: "Specifications", show: true },
    { id: "in-the-box", label: "In the Box", show: listing.in_the_box.length > 0 },
    { id: "documents", label: "Documents", show: listing.documents.length > 0 },
  ].filter((s) => s.show);
  const [active, setActive] = useState(sections[0]?.id);

  // Highlight the tab of the section currently under the sticky bars.
  useEffect(() => {
    const els = sections.map((s) => document.getElementById(s.id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (hit) setActive(hit.target.id);
      },
      { rootMargin: "-200px 0px -55% 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sections.map((s) => s.id).join()]);

  const groups = GROUP_ORDER.map((g) => ({ name: g, rows: specs.filter((r) => (r.group ?? "General") === g) }))
    .concat([{ name: "Other", rows: specs.filter((r) => !GROUP_ORDER.includes(r.group ?? "General")) }])
    .filter((g) => g.rows.length);

  return (
    <div className="mt-10">
      <nav aria-label="Product sections" className="sticky top-[121px] z-20 border-b border-border bg-page/95 backdrop-blur md:top-[77px] lg:top-[125px]">
        <ul className="flex gap-1 overflow-x-auto [scrollbar-width:none]">
          {sections.map((s) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                aria-current={active === s.id ? "true" : undefined}
                className={`relative inline-flex h-12 items-center whitespace-nowrap px-3 text-[15px] first:pl-0 font-semibold transition-colors ${
                  active === s.id ? "text-brand" : "text-text-secondary hover:text-navy"
                }`}
              >
                {s.label}
                <span
                  aria-hidden
                  className={`absolute inset-x-3 bottom-0 h-[3px] rounded-t bg-brand transition-[opacity,scale] duration-200 ease-out ${active === s.id ? "opacity-100" : "scale-x-50 opacity-0"}`}
                />
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="space-y-4 pt-4">
        {sections.some((s) => s.id === "overview") ? (
          <Section id="overview" title="Overview">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
              {description ? <p className="whitespace-pre-line text-[16px] leading-relaxed text-text-secondary">{description}</p> : <div />}
              {listing.key_features.length ? (
                <div className="rounded-lg bg-surface-soft p-5">
                  <h3 className="text-[15px] font-bold text-navy">Key Features</h3>
                  <ul className="mt-3 space-y-2.5">
                    {listing.key_features.map((f) => (
                      <li key={f} className="flex gap-2.5 text-[15px] leading-snug text-navy">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" strokeWidth={2.5} aria-hidden />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </Section>
        ) : null}

        <Section id="specifications" title="Specifications" action={specs.length ? <CopySpecs specs={specs} /> : null}>
          {specs.length ? (
            <div className="grid gap-x-8 gap-y-6 lg:grid-cols-2">
              {groups.map((g) => (
                <table key={g.name} className="w-full self-start text-left text-[14px]">
                  <caption className="pb-2 text-left text-[13px] font-bold text-text-secondary">{g.name}</caption>
                  <tbody>
                    {g.rows.map((row, i) => (
                      <tr key={row.key} className={i % 2 ? "" : "bg-surface-soft"}>
                        <th scope="row" className="w-1/2 px-3 py-2.5 font-medium text-text-secondary">{row.label}</th>
                        <td className="px-3 py-2.5 font-semibold tabular-nums text-navy">
                          {String(row.value)}
                          {row.unit ? ` ${row.unit}` : ""}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ))}
            </div>
          ) : (
            <p className="text-[15px] text-text-secondary">
              Not published yet. <Link href="/support" className="font-semibold text-brand">Ask support</Link> for the datasheet.
            </p>
          )}
        </Section>

        {listing.in_the_box.length ? (
          <Section id="in-the-box" title="In the Box">
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {listing.in_the_box.map((item) => (
                <li key={item} className="flex items-center gap-2.5 rounded-md border border-border px-3 py-2.5 text-[15px] text-navy">
                  <Package className="h-4 w-4 shrink-0 text-brand" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </Section>
        ) : null}

        {listing.documents.length ? (
          <Section id="documents" title="Documents">
            <ul className="grid gap-2 sm:grid-cols-2">
              {listing.documents.map((d) => (
                <li key={d.url}>
                  <a
                    href={d.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 rounded-md border border-border px-3 py-3 transition-colors hover:border-brand"
                  >
                    <FileText className="h-5 w-5 shrink-0 text-brand" aria-hidden />
                    <span className="min-w-0 flex-1 truncate text-[15px] font-semibold text-navy">{d.name}</span>
                    <span className="shrink-0 text-[13px] tabular-nums text-text-muted">PDF{fileSize(d.size) ? ` · ${fileSize(d.size)}` : ""}</span>
                  </a>
                </li>
              ))}
            </ul>
          </Section>
        ) : null}
      </div>
    </div>
  );
}

function Section({ id, title, action, children }: { id: string; title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-[190px] rounded-lg border border-border bg-white p-5 md:p-6">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 id={`${id}-title`} className="text-[19px] font-extrabold tracking-[-0.01em] text-navy">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

/** Copies the spec table as plain "Label: value unit" lines, for BOMs and emails. */
function CopySpecs({ specs }: { specs: TechnicalSpecificationField[] }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        const text = specs.map((r) => `${r.label}: ${r.value}${r.unit ? ` ${r.unit}` : ""}`).join("\n");
        await navigator.clipboard?.writeText(text).catch(() => undefined);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }}
      className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border-strong px-3 text-[13px] font-semibold text-navy hover:border-brand hover:text-brand"
    >
      {copied ? <Check className="fade-in h-4 w-4 text-success" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
      <span aria-live="polite">{copied ? "Copied" : "Copy Specs"}</span>
    </button>
  );
}
