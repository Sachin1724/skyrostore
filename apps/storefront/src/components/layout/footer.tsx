import Link from "next/link";

const FOOTER_SECTIONS = [
  {
    title: "Products",
    links: [
      { href: "/uavs", label: "UAVs" },
      { href: "/parts", label: "Components" },
      { href: "/build", label: "Build Your UAV" },
      { href: "/bulk-orders", label: "Bulk & Custom Orders" },
      { href: "/accessories", label: "Accessories" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/enterprise", label: "Enterprise" },
      { href: "/contact", label: "Contact" },
      { href: "/support", label: "Support" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/terms", label: "Terms & Conditions" },
      { href: "/shipping-policy", label: "Shipping Policy" },
      { href: "/refund-policy", label: "Refund Policy" },
    ],
  },
] as const;

export function Footer() {
  return (
    <footer className="bg-graphite text-text-muted" style={{ borderTop: "1px solid var(--color-border)" }}>
      <div className="mx-auto max-w-[1280px] px-8 py-12 md:px-10">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div>
            <p className="text-[13px] font-bold tracking-[-0.01em] text-white">SKYROSTORE</p>
            <p className="mt-3 text-[12px] leading-relaxed text-text-disabled">
              Professional UAVs and components for mapping, inspection, agriculture, and custom aerial systems.
            </p>
          </div>
          {FOOTER_SECTIONS.map((section) => (
            <div key={section.title}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-text-muted">
                {section.title}
              </p>
              <ul className="mt-3 space-y-2">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-[12px] text-text-disabled transition-colors hover:text-white">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 pt-6 text-[11px] text-text-muted" style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          &copy; {new Date().getFullYear()} Skyrostore. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
