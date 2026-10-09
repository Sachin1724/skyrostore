import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { AccountView } from "@/components/account/account-view";

export const metadata = { title: "Account" };

export default function AccountPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-[640px] px-8 py-8 md:px-10">
        <AccountView />
      </main>
      <Footer />
    </>
  );
}
