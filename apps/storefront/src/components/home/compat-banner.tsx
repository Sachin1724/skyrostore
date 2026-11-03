import Link from "next/link";
import { CheckCircle2, Cpu, ArrowRight } from "lucide-react";
import { CompatCheck } from "@/components/home/compat-check";

interface CompatBannerProps {
  options: Record<string, Array<{ variant_id: string; title: string; price: number | null; summary: string }>>;
}

const RULES = [
  "ESC rating must provide minimum 20% headroom over motor peak burst draw",
  "Battery cell voltage (S) must align with motor stator KV and ESC rating",
  "Frame arm clearance must exceed selected propeller diameter",
];

export function CompatBanner({ options }: CompatBannerProps) {
  return (
    <section
      aria-labelledby="compatibility-engine-heading"
      className="overflow-hidden rounded-xl border border-border-strong bg-brand-soft p-5 md:p-8 lg:p-10 shadow-sm"
    >
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)] lg:items-center">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded bg-brand/10 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-brand">
            <Cpu className="h-3.5 w-3.5" aria-hidden />
            Engineering Validation
          </div>

          <h2
            id="compatibility-engine-heading"
            className="mt-2 text-[clamp(1.4rem,1.1rem+1.2vw,2rem)] font-extrabold tracking-[-0.02em] text-navy"
          >
            Check your parts fit before you pay
          </h2>

          <p className="mt-2 text-[14px] md:text-[15px] leading-relaxed text-text-secondary">
            Select a motor, propeller, and battery below. The engine evaluates published voltage limits, continuous amperage, and load parameters in real time.
          </p>

          <ul className="mt-5 space-y-2.5 text-[13px] text-navy font-medium">
            {RULES.map((rule) => (
              <li key={rule} className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-success mt-0.5" aria-hidden />
                <span>{rule}</span>
              </li>
            ))}
          </ul>

          <div className="mt-6 pt-5 border-t border-border">
            <Link
              href="/build"
              className="inline-flex items-center gap-1.5 text-[14px] font-bold text-brand hover:text-navy transition-colors"
            >
              Open Full Multi-Rotor Build Configurator
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>

        {/* Live Interactive Checker */}
        <div className="rounded-lg border border-border bg-white p-5 shadow-sm">
          <CompatCheck options={options} />
        </div>
      </div>
    </section>
  );
}
