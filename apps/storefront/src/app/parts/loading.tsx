import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Bone, GridSkeleton } from "@/components/layout/skeleton";

export default function Loading() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-surface-soft">
        <section className="border-b border-border bg-white">
          <div className="flex flex-col justify-between px-5 py-8 md:flex-row md:items-center md:px-10">
            <div className="max-w-lg">
              <Bone className="h-5 w-40" />
              <Bone className="mt-3 h-10 w-56 md:h-12" />
              <Bone className="mt-1.5 h-5 w-72" />
            </div>
            <div className="mt-4 h-24 w-full max-w-[480px] md:mt-0 md:h-28" />
          </div>
        </section>
        <section className="px-8 py-8 md:px-10">
          <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
            <aside className="space-y-6">
              <div className="rounded-lg border border-border bg-white p-4">
                <Bone className="h-5 w-24" />
                <div className="mt-3 space-y-2">
                  {Array.from({ length: 6 }, (_, i) => (
                    <Bone key={i} className="h-5 w-full" />
                  ))}
                </div>
              </div>
            </aside>
            <div>
              <div className="rounded-lg border border-border bg-white px-4 py-3">
                <Bone className="h-5 w-24" />
              </div>
              <GridSkeleton className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
