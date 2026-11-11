import { Suspense } from "react";
import Link from "next/link";
import { BackLink } from "@/components/layout/back-link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CartView } from "@/components/cart/cart-view";
import { RecentlyViewed } from "@/components/product/recently-viewed";
import { getSiteSettings } from "@/lib/data/site-settings";

export const metadata = {
  title: "Cart",
  description: "Review UAV components in your shopping cart, calculate shipping, and proceed to secure checkout.",
};

export default async function CartPage() {
  const { freeShippingThreshold, deliveryCharge } = await getSiteSettings();
  return (
    <>
      <Header />
      <main id="main" className="min-h-screen bg-surface-soft pb-20">
        <div className="mx-auto max-w-[1760px] px-4 md:px-8">
          {/* Breadcrumbs */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-4">
          <BackLink fallback="/parts" />
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5  text-[13px] text-text-secondary">
            <Link href="/" className="hover:text-brand">Home</Link>
            <span aria-hidden>/</span>
            <span className="font-semibold text-navy">Cart</span>
          </nav>
        </div>

          <h1 className="pb-5 pt-4 text-[clamp(1.6rem,1.2rem+1.4vw,2.1rem)] font-extrabold tracking-[-0.03em] text-navy">
            Your cart
          </h1>

          <Suspense>
            <CartView freeShippingThreshold={freeShippingThreshold} deliveryCharge={deliveryCharge} />
          </Suspense>

          <div className="mt-14">
            <RecentlyViewed title="Recently viewed" />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
