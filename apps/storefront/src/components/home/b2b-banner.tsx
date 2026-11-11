import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface B2BBannerProps {
  title?: string;
  subtitle?: string;
}

export function B2BBanner({
  title = "Equipping a Research Lab, University Team, or Drone Fleet?",
  subtitle = "Direct institutional procurement with volume pricing, formal purchase orders, GST input tax credits, and scheduled batch shipments.",
}: B2BBannerProps) {
  return (
    <section
      aria-labelledby="b2b-procurement-heading"
      className="reveal relative overflow-hidden rounded-2xl bg-navy px-6 py-10 text-white md:px-12 md:py-14"
    >
      <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-[700px]">

          <h2
            id="b2b-procurement-heading"
            className="text-[clamp(1.6rem,1.2rem+1.4vw,2.4rem)] font-semibold text-white leading-tight"
          >
            {title}
          </h2>

          <p className="mt-2 text-[14px] md:text-[16px] leading-relaxed text-on-dark">
            {subtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/bulk-orders/request"
            className="btn btn-light"
          >
            Request a bulk quote
            <ArrowRight className="h-4 w-4 text-brand" aria-hidden />
          </Link>
          <Link
            href="/bulk-orders"
            className="inline-flex h-12 items-center rounded-full px-5 text-[16px] font-medium text-white hover:bg-white/10"
          >
            How bulk orders work
          </Link>
        </div>
      </div>
    </section>
  );
}
