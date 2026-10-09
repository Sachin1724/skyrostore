import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import Link from "next/link";

export const metadata = { title: "Order Confirmed" };

export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ order_id?: string }>;
}) {
  const { order_id } = await searchParams;

  return (
    <>
      <Header />
      <main className="mx-auto max-w-[640px] px-8 py-16 text-center md:px-10">
        <div
          className="mx-auto mb-6 flex h-16 w-16 items-center justify-center text-success"
          style={{
            borderRadius: "var(--radius-md)",
            background: "var(--color-success-soft)",
          }}
        >
          <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-[28px] font-bold tracking-[-0.025em] text-graphite">
          Order Confirmed
        </h1>
        <p className="mt-2 text-[14px] text-text-secondary">
          Your order has been placed successfully.
        </p>
        {order_id && (
          <p className="mt-4 font-mono text-[11px] text-text-muted">
            Order ID: {order_id}
          </p>
        )}
        <div className="mt-8 flex justify-center gap-3">
          <Link
            href="/parts"
            className="px-5 py-2.5 text-[13px] font-medium text-text-secondary transition-colors hover:text-graphite"
            style={{
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--color-border)",
            }}
          >
            Continue Shopping
          </Link>
          <Link
            href="/account/orders"
            className="px-5 py-2.5 text-[13px] font-semibold text-white bg-graphite transition-colors hover:bg-graphite-soft"
            style={{ borderRadius: "var(--radius-sm)" }}
          >
            View Orders
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
