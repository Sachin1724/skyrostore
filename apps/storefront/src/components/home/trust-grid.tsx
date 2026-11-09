import { Truck, ShieldCheck, Cpu, FileText } from "lucide-react";

const VALUE_PROPS = [
  {
    icon: Truck,
    title: "Same-Day Dispatch",
    subtitle: "Delhivery air express across 19,000+ PIN codes",
  },
  {
    icon: ShieldCheck,
    title: "100% Genuine Certified",
    subtitle: "Authorized distributor parts with manufacturer warranties",
  },
  {
    icon: Cpu,
    title: "Fit & Compatibility Engine",
    subtitle: "Parameter validation checks voltage, current & prop sizing",
  },
  {
    icon: FileText,
    title: "GST Tax Invoicing",
    subtitle: "18% ITC breakdown provided with every commercial order",
  },
];

export function TrustGrid() {
  return (
    <section aria-label="Trust & Guarantees" className="rounded-xl border border-border bg-white p-4 md:p-6 shadow-sm">
      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 divide-y sm:divide-y-0 lg:divide-x divide-border">
        {VALUE_PROPS.map(({ icon: Icon, title, subtitle }, index) => (
          <li
            key={title}
            className={`flex items-start gap-3.5 pt-3 sm:pt-0 ${
              index > 0 ? "lg:pl-6" : ""
            }`}
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
              <Icon className="h-5 w-5" strokeWidth={2} aria-hidden />
            </div>
            <div>
              <h3 className="text-[14px] font-bold text-navy leading-tight">{title}</h3>
              <p className="mt-1 text-[12px] leading-snug text-text-secondary">{subtitle}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
