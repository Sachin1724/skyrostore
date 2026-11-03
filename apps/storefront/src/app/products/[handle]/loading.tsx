import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Bone } from "@/components/layout/skeleton";

// Mirrors ProductDetailClient: breadcrumb, photo, then name, price and actions.
export default function Loading() {
  return (
    <>
      <Header />
      <main id="main">
        <div className="min-h-screen bg-surface-soft px-5 pb-28 md:px-10 lg:pb-24" role="status" aria-label="Loading product">
          <Bone className="mt-8 h-5 w-64" />
          <section className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)]">
            <div className="aspect-square bg-white" />
            <div className="lg:pt-4">
              <Bone className="h-5 w-40" />
              <Bone className="mt-2 h-[clamp(2rem,1.4rem+2.4vw,3.25rem)] w-4/5" />
              <Bone className="mt-5 h-6 w-full" />
              <Bone className="mt-1 h-6 w-2/3" />
              <Bone className="mt-8 h-10 w-40" />
              <Bone className="mt-1 h-6 w-28" />
              <div className="mt-8 flex gap-3">
                <Bone className="h-12 w-[118px]" />
                <Bone className="h-12 w-36" />
                <Bone className="h-12 w-32" />
              </div>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
