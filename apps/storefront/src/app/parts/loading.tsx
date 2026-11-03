import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Bone, ListSkeleton } from "@/components/layout/skeleton";

export default function Loading() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-surface-soft px-5 pb-24 md:px-10">
        <section className="pt-10 pb-10 lg:pt-16">
          <Bone className="h-5 w-40" />
          <Bone className="mt-4 h-[clamp(2.4rem,1.5rem+3.4vw,4.3rem)] w-full max-w-md" />
          <Bone className="mt-4 h-6 w-full max-w-[48ch]" />
        </section>
        <div className="grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="space-y-2">
            <Bone className="h-5 w-24" />
            {Array.from({ length: 6 }, (_, i) => (
              <Bone key={i} className="h-6 w-full" />
            ))}
          </aside>
          <div>
            <Bone className="h-6 w-28" />
            <ListSkeleton />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
