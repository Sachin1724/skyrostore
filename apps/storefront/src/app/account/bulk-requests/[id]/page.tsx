import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { RequestDetailClient } from "./request-detail-client";

export const metadata = { title: "Request Details | Skyrostore" };

const BASE = process.env.NEXT_PUBLIC_MEDUSA_URL || "http://localhost:9000";
const PK = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "pk_11e52cb93d15418c56289d434fee7c53a391460b6a393b72ad48192afe3c4816";

export default async function CustomerRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("customer_token")?.value;

  if (!token) {
    redirect("/account");
  }

  let requestData: any = null;
  try {
    const res = await fetch(`${BASE}/store/bulk-orders/${id}`, {
      headers: {
        "x-publishable-api-key": PK,
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (res.status === 404) {
      notFound();
    }

    if (res.ok) {
      const json = await res.json();
      requestData = json.request;
    }
  } catch (err) {
    console.error("Error fetching bulk request details:", err);
  }

  if (!requestData) {
    notFound();
  }

  return (
    <>
      <Header />
      <main className="mx-auto max-w-[1020px] px-8 py-10 md:px-10">
        <nav className="text-[11px] font-mono uppercase tracking-[0.08em] text-text-muted">
          <Link href="/account" className="hover:text-text-secondary">Account</Link>
          <span className="mx-2 text-text-disabled">/</span>
          <Link href="/account/bulk-requests" className="hover:text-text-secondary">Bulk Requests</Link>
          <span className="mx-2 text-text-disabled">/</span>
          <span className="text-graphite">{requestData.reference_no}</span>
        </nav>

        <div className="mt-6">
          <RequestDetailClient initialRequest={requestData} />
        </div>
      </main>
      <Footer />
    </>
  );
}
