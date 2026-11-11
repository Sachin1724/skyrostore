import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Bone } from "@/components/layout/skeleton";

export default function Loading() {
  return (
    <>
      <Header />
      <main id="main" className="bg-page">
        <div className="mx-auto min-h-screen max-w-[1760px] px-4 pb-28 md:px-8" role="status" aria-label="Loading product">
          {/* Breadcrumb Bone */}
          <Bone className="mt-5 h-4 w-64" />

          {/* Gallery + Buy Box Grid */}
          <section className="mt-4 grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-12">
            {/* Gallery Skeleton */}
            <div className="flex flex-col-reverse gap-4 lg:grid lg:grid-cols-[82px_minmax(0,1fr)]">
              <div className="flex gap-2.5 lg:flex-col">
                <Bone className="h-20 w-20 rounded-md" />
                <Bone className="h-20 w-20 rounded-md" />
                <Bone className="h-20 w-20 rounded-md" />
              </div>
              <div className="aspect-square w-full card" />
            </div>

            {/* Buy Box Skeleton */}
            <div>
              <Bone className="h-4 w-36" />
              <Bone className="mt-2 h-10 w-4/5" />
              <div className="mt-3 flex gap-2">
                <Bone className="h-6 w-20 rounded-md" />
                <Bone className="h-6 w-24 rounded-md" />
                <Bone className="h-6 w-16 rounded-md" />
              </div>
              <div className="mt-5 border-t border-border pt-5">
                <Bone className="h-10 w-48" />
                <Bone className="mt-2 h-5 w-28" />
                <div className="mt-4 space-y-2">
                  <Bone className="h-4 w-44" />
                  <Bone className="h-4 w-52" />
                </div>
              </div>

              <div className="mt-6 flex items-center gap-3">
                <Bone className="h-4 w-16" />
                <Bone className="h-11 w-32 rounded-md" />
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Bone className="h-12 rounded-md" />
                <Bone className="h-12 rounded-md" />
              </div>

              <div className="mt-5 h-[110px] rounded-lg border border-border bg-surface-soft" />
            </div>
          </section>

          {/* Trust Row Skeleton */}
          <div className="mt-12 h-20 card" />

          {/* Section Tabs Skeleton */}
          <div className="mt-10 border-b border-border pb-3">
            <div className="flex gap-4">
              <Bone className="h-8 w-28" />
              <Bone className="h-8 w-36" />
              <Bone className="h-8 w-24" />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
