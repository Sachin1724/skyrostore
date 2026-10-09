import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { SupportView } from "./support-view";

export const metadata = {
  title: "UAV Support Center — Skyrostore",
  description:
    "Find answers, track your order, get technical support or contact our engineering team.",
};

export default function SupportPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-surface-soft py-10">
        <div className="mx-auto max-w-[1280px] px-8 md:px-10">
          <SupportView />
        </div>
      </main>
      <Footer />
    </>
  );
}
