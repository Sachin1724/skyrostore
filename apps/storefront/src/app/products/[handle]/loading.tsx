import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Bone } from "@/components/layout/skeleton";

// Mirrors ProductDetailClient's top section: breadcrumb, gallery, core info, buy box.
export default function Loading() {
  return (
    <>
      <Header />
      <main>
        <div className="min-h-screen bg-white" role="status" aria-label="Loading product">
          <div className="px-5 pt-6 pb-4 md:px-10">
            <Bone className="h-5 w-72" />
          </div>
          <section className="px-8 py-4 md:px-10">
            <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
              <div className="grid gap-8 md:grid-cols-[1fr_1.1fr]">
                <div className="aspect-square rounded-lg border border-border bg-surface-soft" />
                <div>
                  <Bone className="h-5 w-28" />
                  <Bone className="mt-1 h-9 w-4/5" />
                  <Bone className="mt-1.5 h-5 w-full" />
                  <Bone className="mt-1 h-5 w-2/3" />
                  <Bone className="mt-6 h-9 w-32" />
                  <Bone className="mt-6 h-20 w-full" />
                </div>
              </div>
              <div className="rounded-lg border border-border bg-white p-6">
                <Bone className="h-5 w-24" />
                <Bone className="mt-4 h-10 w-full" />
                <Bone className="mt-4 h-11 w-full" />
                <Bone className="mt-3 h-11 w-full" />
              </div>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
