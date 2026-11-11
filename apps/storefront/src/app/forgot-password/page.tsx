import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata = {
  title: "Forgot password",
  description: "Reset the password for your Skyrostore account.",
};

export default function ForgotPasswordPage() {
  return (
    <>
      <Header />
      <main id="main" className="min-h-screen bg-surface-soft pb-20">
        <div className="mx-auto max-w-[560px] px-4 pt-6 md:px-8">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 pb-6 text-[13px] text-text-secondary">
            <Link href="/" className="hover:text-brand">Home</Link>
            <span aria-hidden>/</span>
            <Link href="/account" className="hover:text-brand">Account</Link>
            <span aria-hidden>/</span>
            <span className="font-semibold text-navy">Forgot password</span>
          </nav>
          <ForgotPasswordForm />
        </div>
      </main>
      <Footer />
    </>
  );
}
