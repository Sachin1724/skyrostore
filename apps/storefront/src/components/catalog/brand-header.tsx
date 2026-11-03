import { ShieldCheck, Truck, FileText } from "lucide-react";

interface BrandHeaderProps {
  brandTitle: string;
  count: number;
}

export function BrandHeader({ brandTitle, count }: BrandHeaderProps) {
  return (
    <div className="mb-6 rounded-xl border border-border-strong bg-white p-5 md:p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded bg-brand/10 px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wider text-brand">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
            Authorized Direct Distributor
          </div>
          <h1 className="mt-2 text-[clamp(1.75rem,1.3rem+1.5vw,2.4rem)] font-extrabold tracking-[-0.03em] text-navy">
            {brandTitle}
          </h1>
          <p className="mt-1 text-[14px] text-text-secondary max-w-[55ch]">
            Genuine {brandTitle} multi-rotor components, flight controllers, and propulsion hardware with official manufacturer warranty and full GST input tax credit.
          </p>
        </div>

        <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center border-t md:border-t-0 border-border pt-3 md:pt-0">
          <span className="text-[28px] font-extrabold tabular-nums text-navy leading-none">
            {count}
          </span>
          <span className="text-[12px] font-bold text-text-muted">
            {count === 1 ? "Listed Component" : "Listed Components"}
          </span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-border pt-4 text-[12px] text-text-secondary">
        <div className="flex items-center gap-2">
          <Truck className="h-4 w-4 text-brand shrink-0" aria-hidden />
          <span>Same-Day Tracked Dispatch</span>
        </div>
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-brand shrink-0" aria-hidden />
          <span>100% Genuine Certified Hardware</span>
        </div>
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-brand shrink-0" aria-hidden />
          <span>GST Tax Invoices with ITC Breakdown</span>
        </div>
      </div>
    </div>
  );
}
