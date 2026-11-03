import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Bone, GridSkeleton } from "@/components/layout/skeleton";

export default function Loading() {
  return (
    <>
      <Header />
      <main className="px-8 py-6 md:px-10">
        <h1 className="text-[28px] font-bold tracking-[-0.025em] text-graphite">UAVs</h1>
        <Bone className="mt-1 h-5 w-full max-w-xl" />
        <div className="mt-8">
          <GridSkeleton className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4" />
        </div>
      </main>
      <Footer />
    </>
  );
}
