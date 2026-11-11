import Link from "next/link";
import { SkyroLogo } from "@/components/brand/logo";

const COLUMNS = [
  {
    title: "Help",
    links: [
      { href: "/account/orders", label: "Track an order" },
      { href: "/policies/shipping", label: "Shipping" },
      { href: "/policies/refunds", label: "Returns and refunds" },
      { href: "/support", label: "Help and support" },
    ],
  },
  {
    title: "Shop",
    links: [
      { href: "/parts", label: "All parts" },
      { href: "/uavs", label: "Drones" },
      { href: "/brands", label: "Brands" },
      { href: "/build", label: "Build your drone" },
    ],
  },
  {
    title: "Business",
    links: [
      { href: "/bulk-orders", label: "Bulk orders" },
      { href: "/bulk-orders/request", label: "Request a quote" },
      { href: "/account/bulk-requests", label: "Your quotations" },
    ],
  },
];

// Phone, WhatsApp, registered address and social links join this block once the owner confirms them.
const CONTACT = [
  { label: "Orders and products", email: "support@skyrostore.com" },
  { label: "Bulk orders", email: "bulk@skyrostore.com" },
];

const POLICIES = [
  { href: "/policies/shipping", label: "Shipping" },
  { href: "/policies/refunds", label: "Returns" },
  { href: "/policies/terms", label: "Terms" },
  { href: "/policies/privacy", label: "Privacy" },
];

export function Footer() {
  return (
    <footer className="bg-navy text-on-dark">
      <div className="mx-auto grid max-w-[1760px] gap-6 px-4 pb-8 pt-10 sm:grid-cols-2 sm:gap-10 sm:pb-10 sm:pt-14 md:px-8 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="space-y-4">
          <SkyroLogo variant="full" />
          <p className="max-w-[34ch] text-[14px] leading-relaxed text-on-dark">
            Drone parts and complete UAVs, checked for compatibility before they ship from Odisha.
          </p>
          <ul className="space-y-2 text-[14px]">
            {CONTACT.map((c) => (
              <li key={c.email}>
                <span className="block text-[13px] text-on-dark-muted">{c.label}</span>
                <a href={`mailto:${c.email}`} className="text-white hover:underline">{c.email}</a>
              </li>
            ))}
          </ul>
        </div>
        {/* Phones: each column folds into a tap-to-open group, so the footer is a few rows, not a long list. */}
        <div className="divide-y divide-white/10 sm:hidden">
          {COLUMNS.map((col) => (
            <details key={col.title} className="group">
              <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between text-[15px] font-bold text-white [&::-webkit-details-marker]:hidden">
                {col.title}
                <span aria-hidden className="text-[20px] font-normal text-on-dark-muted transition-transform group-open:rotate-45">+</span>
              </summary>
              <ul className="pb-3 text-[14px]">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="block py-2.5 text-on-dark hover:text-white">{l.label}</Link>
                  </li>
                ))}
              </ul>
            </details>
          ))}
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title} className="hidden sm:block">
            <h2 className="text-[14px] font-bold text-white">{col.title}</h2>
            <ul className="mt-3 space-y-2.5 text-[14px]">
              {col.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-on-dark transition-colors hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="bg-graphite-soft/30">
        <div className="mx-auto flex max-w-[1760px] flex-wrap items-center justify-between gap-4 px-4 py-5 text-[13px] text-on-dark-muted md:px-8">
          <p className="flex flex-wrap gap-x-3 gap-y-1">
            <span>&copy; {new Date().getFullYear()} Skyrostore</span>
            {POLICIES.map((p) => (
              <Link key={p.href} href={p.href} className="hover:text-white">{p.label}</Link>
            ))}
          </p>
          <p>Payments by UPI, cards and netbanking, secured by Razorpay</p>
        </div>
      </div>
    </footer>
  );
}
