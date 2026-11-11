import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { SupportView } from "./support-view";

export const metadata = {
  title: "Help and support",
  description:
    "Find technical answers, track your Delhivery order, check pin code delivery times, or reach our avionics applications desk.",
};

export default function SupportPage() {
  return (
    <>
      <Header />
      <main id="main" className="min-h-screen bg-surface-soft pb-20">
        <div className="mx-auto max-w-[1760px] px-4 md:px-8">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 pt-5 text-[13px] text-text-secondary">
            <Link href="/" className="hover:text-brand">Home</Link>
            <span aria-hidden>/</span>
            <span className="font-semibold text-navy">Support Center</span>
          </nav>

          <SupportView />
        </div>
      </main>
      <Footer />
    </>
  );
}
