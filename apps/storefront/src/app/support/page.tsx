import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export const metadata = { title: "Support" };

export default function SupportPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-[1280px] px-8 py-8 md:px-10">
        <h1 className="text-[28px] font-bold tracking-[-0.025em] text-graphite">Support</h1>
        <p className="mt-1 text-[14px] text-text-secondary">
          Contact us for technical support, order inquiries, or custom UAV requirements.
        </p>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <div className="p-5" style={{ borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}>
            <h3 className="text-[14px] font-semibold text-graphite">Technical Support</h3>
            <p className="mt-2 text-[13px] text-text-secondary">
              Help with component compatibility, firmware, and flight controller setup.
            </p>
          </div>
          <div className="p-5" style={{ borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}>
            <h3 className="text-[14px] font-semibold text-graphite">Order Inquiries</h3>
            <p className="mt-2 text-[13px] text-text-secondary">
              Track shipments, returns, and order modifications.
            </p>
          </div>
          <div className="p-5" style={{ borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}>
            <h3 className="text-[14px] font-semibold text-graphite">Custom Builds</h3>
            <p className="mt-2 text-[13px] text-text-secondary">
              Consultation for enterprise UAV configurations and bulk orders.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
