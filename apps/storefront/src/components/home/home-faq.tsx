import { HelpCircle } from "lucide-react";

interface FAQItem {
  q: string;
  a: string;
}

interface HomeFaqProps {
  faq: FAQItem[];
}

export function HomeFaq({ faq }: HomeFaqProps) {
  if (faq.length === 0) return null;

  return (
    <section aria-labelledby="home-faq-heading" className="rounded-xl border border-border bg-white p-6 md:p-8 shadow-sm">
      <div className="flex items-center gap-2 border-b border-border pb-3.5">
        <HelpCircle className="h-5 w-5 text-brand" aria-hidden />
        <div>
          <span className="block text-[11px] font-extrabold uppercase tracking-wider text-brand">
            Builder Support
          </span>
          <h2
            id="home-faq-heading"
            className="text-[clamp(1.3rem,1.1rem+0.8vw,1.65rem)] font-extrabold tracking-[-0.02em] text-navy"
          >
            Frequently Asked Questions
          </h2>
        </div>
      </div>

      <div className="mt-4 divide-y divide-border">
        {faq.map(({ q, a }, i) => (
          <details key={q} open={i === 0} className="group py-3 first:pt-1 last:pb-1">
            <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-bold text-navy hover:text-brand transition-colors">
              <span>{q}</span>
              <span
                aria-hidden
                className="text-[20px] font-bold text-brand transition-transform duration-200 group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <p className="mt-2 text-[14px] leading-relaxed text-text-secondary pr-6">
              {a}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
