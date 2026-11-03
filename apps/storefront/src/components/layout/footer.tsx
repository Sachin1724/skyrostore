import Link from "next/link";
import { SkyroLogo } from "@/components/brand/logo";

const COLUMNS = [
  {
    title: "Help",
    links: [
      { href: "/account/orders", label: "Track an order" },
      { href: "/policies/shipping", label: "Shipping" },
      { href: "/policies/refunds", label: "Returns and refunds" },
      { href: "/support", label: "Contact support" },
    ],
  },
  {
    title: "Shop",
    links: [
      { href: "/parts", label: "All parts" },
      { href: "/uavs", label: "Drones" },
      { href: "/brands", label: "Brands" },
      { href: "/build", label: "Build checker" },
    ],
  },
  {
    title: "Business",
    links: [
      { href: "/bulk-orders", label: "Bulk orders" },
      { href: "/bulk-orders/request", label: "Request a quote" },
      { href: "/account/bulk-requests", label: "My quotations" },
    ],
  },
];

const PAYMENT_METHODS = ["UPI", "Cards", "Netbanking", "Razorpay"];

export function Footer() {
  return (
    <footer className="bg-navy text-[#DCE7F3]">
      <div className="mx-auto grid max-w-[1376px] gap-10 px-4 pb-10 pt-14 sm:grid-cols-2 md:px-8 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="space-y-3">
          <SkyroLogo light />
          <p className="max-w-[34ch] text-[14px] leading-relaxed text-[#C9D6E6]">
            Drone parts and complete UAVs, checked for compatibility before they ship from Odisha.
          </p>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h2 className="text-[14px] font-bold text-white">{col.title}</h2>
            <ul className="mt-3 space-y-2.5 text-[14px]">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-[#C9D6E6] transition-colors hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-graphite-soft">
        <div className="mx-auto flex max-w-[1376px] flex-wrap items-center justify-between gap-4 px-4 py-5 text-[13px] text-[#9FB3CB] md:px-8">
          <p>
            &copy; {new Date().getFullYear()} Skyrostore ·{" "}
            <Link href="/policies/terms" className="hover:text-white">Terms</Link> ·{" "}
            <Link href="/policies/privacy" className="hover:text-white">Privacy</Link>
          </p>
          <ul aria-label="Payment methods" className="flex flex-wrap gap-2">
            {PAYMENT_METHODS.map((m) => (
              <li key={m} className="rounded border border-graphite-soft px-2.5 py-1 text-[#DCE7F3]">{m}</li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
