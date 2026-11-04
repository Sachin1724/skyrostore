import Link from "next/link";

interface FAQItem {
  q: string;
  a: string;
}

interface HomeFaqProps {
  faq: FAQItem[];
}

const SHOWN = 6;

/** Six questions in two columns, all closed. The rest live on the support page. */
export function HomeFaq({ faq }: HomeFaqProps) {
  if (faq.length === 0) return null;
  const shown = faq.slice(0, SHOWN);

  return (
    <section aria-labelledby="home-faq-heading" className="reveal">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 id="home-faq-heading" className="text-[clamp(1.4rem,1.1rem+1vw,1.75rem)] font-semibold text-navy">
          Common questions
        </h2>
        <Link href="/support" className="text-[14px] font-medium text-brand hover:text-navy">
          All questions and support
        </Link>
      </div>

      <div className="mt-5 grid items-start gap-x-6 gap-y-2 md:grid-cols-2">
        {shown.map(({ q, a }) => (
          <details key={q} className="group rounded-xl bg-white px-5 py-3">
            <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-medium text-navy transition-colors hover:text-brand">
              <span>{q}</span>
              <span aria-hidden className="text-[20px] text-text-muted transition-transform duration-200 group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="pb-1 pr-6 pt-1 text-[14px] leading-relaxed text-text-secondary">{a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
