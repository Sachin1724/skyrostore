import { Suspense } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { AccountView } from "@/components/account/account-view";

export const metadata = {
  title: "Account — Skyrostore",
  description: "Sign in to access your orders, courier tracking, and tax invoices.",
};

export default function AccountPage() {
  return (
    <>
      <Header />
      <main id="main" className="min-h-screen bg-surface-soft pb-20">
        <div className="mx-auto max-w-[560px] px-4 pt-6 md:px-8">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 pb-6 text-[13px] text-text-secondary">
            <Link href="/" className="hover:text-brand">Home</Link>
            <span aria-hidden>/</span>
            <span className="font-semibold text-navy">Account</span>
          </nav>
          <Suspense fallback={<div className="skeleton h-80 rounded-xl" />}>
            <AccountView />
          </Suspense>
        </div>
      </main>
      <Footer />
    </>
  );
}
