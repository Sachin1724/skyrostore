"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, User } from "lucide-react";

const LINKS = [
  { href: "/account/orders", label: "Your orders" },
  { href: "/account/wishlist", label: "Wishlist" },
  { href: "/account/builds", label: "Saved builds" },
  { href: "/account/bulk-requests", label: "Quotations" },
  { href: "/account/addresses", label: "Addresses" },
  { href: "/account", label: "Your details" },
  { href: "/support", label: "Help and support" },
];

/** Account entry in the header: greeting plus a menu of account pages, opening on hover or click. */
export function AccountMenu() {
  const pathname = usePathname();
  const [name, setName] = useState<string | null | undefined>(undefined); // undefined = loading, null = signed out
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    fetch("/api/account/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setName(d?.customer ? d.customer.first_name || d.customer.email.split("@")[0] || "there" : null))
      .catch(() => setName(null));
  }, [pathname]);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const hover = (next: boolean) => (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(next), next ? 120 : 250);
  };

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
    window.location.href = "/";
  }

  const signedIn = Boolean(name);

  return (
    <div ref={ref} className="relative" onPointerEnter={hover(true)} onPointerLeave={hover(false)}>
      {/* Phones and tablets: a plain link, the account page has every section. */}
      <Link href="/account" aria-label="Account" className="flex h-11 min-w-11 items-center justify-center text-navy hover:text-brand lg:hidden">
        <User className="h-[22px] w-[22px]" strokeWidth={1.8} aria-hidden />
      </Link>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((v) => !v)}
        className="hidden h-11 items-center gap-1 text-left text-navy hover:text-brand lg:flex"
      >
        <span className="leading-tight">
          <span className="block max-w-[14ch] truncate text-[12px] text-text-secondary">{signedIn ? `Hello, ${name}` : "Hello, sign in"}</span>
          <span className="block text-[14px] font-semibold">Account</span>
        </span>
        <ChevronDown className="mt-3 h-3.5 w-3.5" aria-hidden />
      </button>
      {open ? (
        <div className="pop-in absolute right-0 top-[calc(100%+6px)] z-[60] w-64 card p-2 shadow-[0_12px_32px_rgba(10,26,47,0.12)]">
          {name === null ? (
            <div className="border-b border-border p-3">
              <Link href="/account" className="btn btn-primary w-full">Sign in</Link>
              <p className="mt-2 text-center text-[13px] text-text-secondary">
                New here? <Link href="/account" className="font-semibold text-brand hover:text-navy">Create an account</Link>
              </p>
            </div>
          ) : null}
          <ul className="py-1">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="block rounded-md px-3 py-2 text-[14px] text-navy hover:bg-surface-soft hover:text-brand">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          {signedIn ? (
            <button type="button" onClick={signOut} className="w-full rounded-md border-t border-border px-3 py-2.5 text-left text-[14px] text-text-secondary hover:bg-surface-soft hover:text-navy">
              Sign out
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
