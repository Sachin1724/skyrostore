import { Bone, CardSkeleton } from "@/components/layout/skeleton";

// Home page skeleton: banner, brand strip, product row.
export default function Loading() {
  return (
    <main id="main" className="min-h-screen bg-surface-soft pb-20" role="status" aria-label="Loading">
      <div className="mx-auto max-w-[1760px] space-y-8 px-4 pt-5 md:px-8 md:pt-6">
        <Bone className="aspect-[16/9] w-full rounded-xl sm:aspect-[3/1]" />
        <Bone className="h-16 w-full" />
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => <CardSkeleton key={i} />)}
        </div>
      </div>
    </main>
  );
}
