import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Bone } from "@/components/layout/skeleton";

// Mirrors ProductDetailClient: breadcrumb, gallery, then name, price, actions and delivery check.
export default function Loading() {
  return (
    <>
      <Header />
      <main id="main" className="bg-page">
        <div className="mx-auto min-h-screen max-w-[1376px] px-4 pb-28 md:px-8" role="status" aria-label="Loading product">
          <Bone className="mt-5 h-4 w-64" />
          <section className="mt-4 grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-12">
            <div className="aspect-square rounded-lg border border-border bg-white" />
            <div>
              <Bone className="h-5 w-40" />
              <Bone className="mt-2 h-10 w-4/5" />
              <Bone className="mt-3 h-7 w-56" />
              <Bone className="mt-5 h-10 w-44" />
              <Bone className="mt-2 h-5 w-28" />
              <Bone className="mt-5 h-11 w-48" />
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Bone className="h-12" />
                <Bone className="h-12" />
              </div>
              <div className="mt-5 h-[124px] rounded-lg border border-border bg-surface-soft" />
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
