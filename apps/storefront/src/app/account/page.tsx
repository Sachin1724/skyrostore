import { Suspense } from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { AccountNav } from "@/components/account/account-nav";
import { AccountView } from "@/components/account/account-view";
import { ProfileView } from "@/components/account/profile-view";

export const metadata = {
  title: "Account — Skyrostore",
  description: "Sign in to access your orders, courier tracking, and tax invoices.",
};

/**
 * Signed out this is the sign-in form; signed in it is "My details". Navigation lives in
 * AccountNav alone, so no section is offered twice on the same screen.
 * It never redirects, so the back button out of a sub-page lands here and stays.
 */
export default async function AccountPage() {
  const signedIn = Boolean((await cookies()).get("customer_token")?.value);

  return (
    <>
      <Header />
      <main id="main" className="min-h-screen bg-surface-soft pb-20">
        <div className={`mx-auto px-4 pt-6 md:px-8 ${signedIn ? "max-w-[1760px]" : "max-w-[560px]"}`}>
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 pb-6 text-[13px] text-text-secondary">
            <Link href="/" className="hover:text-brand">Home</Link>
            <span aria-hidden>/</span>
            <span className="font-semibold text-navy">Account</span>
          </nav>

          {signedIn ? (
            <div className="flex flex-col items-start gap-8 lg:flex-row">
              <AccountNav />
              <div className="w-full min-w-0 flex-1">
                <h1 className="text-[clamp(1.6rem,1.2rem+1.4vw,2.1rem)] font-semibold text-navy">Your account</h1>
                <div className="mt-6">
                  <ProfileView />
                </div>
              </div>
            </div>
          ) : (
            <Suspense fallback={<div className="skeleton h-80 rounded-xl" />}>
              <AccountView />
            </Suspense>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
