import Link from "next/link";
import { BackLink } from "@/components/layout/back-link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { isSignedIn } from "@/lib/session";
import { AccountNav } from "@/components/account/account-nav";
import { OrderDashboard } from "@/components/account/order-dashboard";

export const metadata = {
  title: "My Orders & Tracking — Skyrostore",
  description: "Track your orders, view details, download invoices and manage returns.",
};

export default async function OrdersPage() {
  const signedIn = await isSignedIn();
  return (
    <>
      <Header />
      <main id="main" className="min-h-screen bg-surface-soft pb-20">
        <div className="mx-auto max-w-[1760px] px-4 md:px-8">
          {/* Breadcrumbs */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-4">
          <BackLink fallback="/account" />
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5  text-[13px] text-text-secondary">
            <Link href="/" className="hover:text-brand">Home</Link>
            <span aria-hidden>/</span>
            <Link href="/account" className="hover:text-brand">Account</Link>
            <span aria-hidden>/</span>
            <span className="font-semibold text-navy">Orders</span>
          </nav>
        </div>

          <h1 className="pb-6 pt-4 text-[clamp(1.6rem,1.2rem+1.4vw,2.1rem)] font-extrabold tracking-[-0.03em] text-navy">
            Orders &amp; Tracking
          </h1>

          <div className="flex flex-col lg:flex-row gap-8 items-start">
            {signedIn ? <AccountNav /> : null}
            <div className="flex-1 min-w-0 w-full">
              <OrderDashboard />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
