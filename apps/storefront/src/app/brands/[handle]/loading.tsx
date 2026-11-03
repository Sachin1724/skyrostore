import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Bone, GridSkeleton } from "@/components/layout/skeleton";

export default function Loading() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-surface-soft">
        <div className="px-8 py-10 md:px-10">
          <Bone className="h-5 w-48" />
          <Bone className="mt-3 h-10 w-64" />
          <Bone className="mt-1.5 h-5 w-24" />
          <section className="mt-10">
            <Bone className="h-6 w-40" />
            <GridSkeleton className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" count={4} />
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
