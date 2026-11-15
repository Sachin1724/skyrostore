"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Toaster } from "sonner";
import { AdminSidebar, type NavCounts } from "@/components/layout/sidebar";
import { AdminTopBar } from "@/components/layout/topbar";

/** Sidebar is always visible from `md` up; on a phone it slides in behind a menu button. */
export function AdminShell({
  counts,
  storefrontUrl,
  operatorEmail,
  role,
  children,
}: {
  counts: NavCounts;
  storefrontUrl: string;
  operatorEmail: string | null;
  role: "owner" | "staff";
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Navigating closes the drawer.
  useEffect(() => setOpen(false), [pathname]);

  return (
    <div className="flex h-screen">
      <AdminSidebar counts={counts} role={role} open={open} onClose={() => setOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <AdminTopBar storefrontUrl={storefrontUrl} operatorEmail={operatorEmail} onMenu={() => setOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
      <Toaster position="top-right" richColors closeButton />
    </div>
  );
}
