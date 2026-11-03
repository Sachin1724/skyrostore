import Link from "next/link";
import { cookies } from "next/headers";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { AccountNav } from "@/components/account/account-nav";
import { BulkRequestsDashboard, type BulkRequestItem } from "@/components/account/bulk-requests-dashboard";
import { Plus } from "lucide-react";

export const metadata = {
  title: "B2B & Bulk UAV Quotations — Skyrostore",
  description: "Track enterprise purchase requests, review formal engineering quotations, and manage institutional build orders.",
};

const BASE = process.env.NEXT_PUBLIC_MEDUSA_URL || "http://localhost:9000";
const PK = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "pk_11e52cb93d15418c56289d434fee7c53a391460b6a393b72ad48192afe3c4816";

export default async function CustomerBulkRequestsPage() {
  const cookieStore = await cookies();
  const token =
    cookieStore.get("customer_token")?.value ||
    cookieStore.get("medusa_auth_token")?.value;

  let requests: BulkRequestItem[] = [];

  if (token) {
    try {
      const res = await fetch(`${BASE}/store/bulk-orders`, {
        headers: {
          "x-publishable-api-key": PK,
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        requests = data.requests || [];
      }
    } catch (err) {
      console.warn("Server-side bulk requests fetch error, falling back to client hydration:", err);
    }
  }

  return (
    <>
      <Header />
      <main id="main" className="min-h-screen bg-surface-soft pb-20">
        <div className="mx-auto max-w-[1376px] px-4 md:px-8">
          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 pt-5 text-[13px] text-text-secondary">
            <Link href="/" className="hover:text-brand">Home</Link>
            <span aria-hidden>/</span>
            <Link href="/account" className="hover:text-brand">Account</Link>
            <span aria-hidden>/</span>
            <span className="font-semibold text-navy">Bulk Quotations</span>
          </nav>

          {/* Header Title & Top RFQ CTA */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-6 pt-4">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand">
                Institutional Procurement Portal
              </span>
              <h1 className="mt-1 text-[clamp(1.6rem,1.2rem+1.4vw,2.1rem)] font-extrabold tracking-[-0.03em] text-navy">
                B2B &amp; Bulk UAV Quotations
              </h1>
            </div>

            <Link
              href="/bulk-orders/request"
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-navy px-5 text-[13px] font-extrabold text-white hover:bg-brand transition-colors shadow-2xs"
            >
              <Plus className="h-4 w-4" aria-hidden />
              <span>Submit New RFQ</span>
            </Link>
          </div>

          {/* Consistent Account Layout with Navigation Sidebar */}
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            <AccountNav />

            <div className="flex-1 min-w-0 w-full">
              <BulkRequestsDashboard
                initialRequests={requests}
                isAuthenticated={Boolean(token)}
              />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
