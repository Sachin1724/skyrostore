"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

/** Category-bar link that shows when it is the page you are on. */
export function NavLink({ href, className = "", children }: { href: string; className?: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const [path, query] = href.split("?");
  const category = new URLSearchParams(query).get("category");
  const active = category ? pathname === path && params.get("category") === category : pathname === path || pathname.startsWith(path + "/");

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`relative whitespace-nowrap py-3 transition-colors hover:text-navy ${active ? "text-navy" : ""} ${className}
        after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:rounded-full after:bg-navy after:transition-opacity ${active ? "after:opacity-100" : "after:opacity-0"}`}
    >
      {children}
    </Link>
  );
}
