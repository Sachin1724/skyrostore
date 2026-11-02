import Link from "next/link";
import { SkyroMark } from "@/components/brand/logo";

const LINKS = [
  { href: "/parts", label: "Parts" },
  { href: "/uavs", label: "Drones" },
  { href: "/build", label: "Build a drone" },
  { href: "/bulk-orders", label: "Bulk orders" },
  { href: "/support", label: "Support" },
  { href: "/account/orders", label: "Track an order" },
];

const POLICIES = [
  { href: "/policies/shipping", label: "Shipping" },
  { href: "/policies/refunds", label: "Returns and refunds" },
  { href: "/policies/terms", label: "Terms" },
  { href: "/policies/privacy", label: "Privacy" },
];

/** The close of every page: the name at full width, then the few links that matter. */
export function Footer() {
  return (
    <footer className="bg-navy text-white">
      <div className="px-5 pb-10 pt-20 md:px-10">
        <div className="grid gap-12 md:grid-cols-[1.2fr_1fr_1fr]">
          <p className="max-w-[34ch] text-[18px] leading-[1.5] text-[#C9D6E6]">
            Drone parts and complete UAVs, checked for compatibility before they ship from Odisha.
          </p>
          <ul className="space-y-3 text-[16px]">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-white transition-colors hover:text-brand-cyan">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <ul className="space-y-3 text-[16px]">
            {POLICIES.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-white transition-colors hover:text-brand-cyan">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-20 flex items-end gap-3 md:gap-5" aria-hidden="true">
          <SkyroMark size={96} className="h-[clamp(3.5rem,9vw,8.5rem)] w-auto shrink-0" />
          <span className="text-[clamp(3.5rem,13vw,12rem)] font-bold leading-[0.8] tracking-[-0.05em]">
            skyrostore
          </span>
        </div>
        <p className="mt-8 text-[14px] text-[#9FB3CB]">&copy; {new Date().getFullYear()} Skyrostore. Payments by Razorpay.</p>
      </div>
    </footer>
  );
}
