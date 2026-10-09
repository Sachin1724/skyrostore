import Link from "next/link";
import { Linkedin, Youtube, Instagram, Twitter } from "lucide-react";

const FOOTER_SECTIONS = [
  {
    title: "Products",
    links: [
      { href: "/uavs", label: "UAVs" },
      { href: "/parts", label: "Components" },
      { href: "/build", label: "Build Your UAV" },
      { href: "/parts?category=accessories", label: "Accessories" },
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
            <p className="text-[14px] font-extrabold tracking-[-0.02em] text-white">SKYROSTORE</p>
            <p className="mt-3 text-[12px] leading-relaxed text-text-disabled">
              Professional UAVs and components for mapping, inspection, agriculture, and custom aerial systems.
            </p>
            <div className="mt-4 flex items-center gap-3 text-text-disabled">
              <a href="https://linkedin.com" target="_blank" rel="noreferrer" aria-label="LinkedIn" className="hover:text-white transition-colors">
                <Linkedin className="h-4 w-4" />
              </a>
              <a href="https://youtube.com" target="_blank" rel="noreferrer" aria-label="YouTube" className="hover:text-white transition-colors">
                <Youtube className="h-4 w-4" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram" className="hover:text-white transition-colors">
                <Instagram className="h-4 w-4" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noreferrer" aria-label="X" className="hover:text-white transition-colors">
                <Twitter className="h-4 w-4" />
              </a>
            </div>
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
        <div className="mt-12 flex flex-col items-center justify-between gap-2 pt-6 text-[11px] text-text-muted md:flex-row" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <p>&copy; 2026 Skyrostore. All rights reserved.</p>
          <p className="text-text-disabled">Built for a higher tomorrow.</p>
        </div>
      </div>
    </footer>
  );
}
