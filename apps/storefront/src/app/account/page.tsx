import { Suspense } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { AccountView } from "@/components/account/account-view";

export const metadata = { title: "Account" };

export default function AccountPage() {
  return (
    <>
      <Header />
      <main id="main" className="mx-auto max-w-[640px] px-8 py-8 md:px-10">
        <Suspense fallback={<p className="text-[13px] text-text-muted">Loading…</p>}>
          <AccountView />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
