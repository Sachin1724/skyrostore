// Route skeletons: same boxes as the real layout, one slow tone pulse, no spinners.

export function Bone({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`skeleton ${className}`} />;
}

// Mirrors ProductCard: square media, category, two-line title, spec, price/stock + add.
export function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-white">
      <div className="aspect-square bg-surface-soft" />
      <div className="space-y-1.5 p-4">
        <Bone className="h-4 w-1/2" />
        <Bone className="h-[2.7em] w-4/5" />
        <Bone className="h-4 w-3/5" />
        <div className="flex items-end justify-between pt-2">
          <div className="space-y-1">
            <Bone className="h-6 w-20" />
            <Bone className="h-4 w-16" />
          </div>
          <Bone className="h-10 w-10" />
        </div>
      </div>
    </div>
  );
}

// Mirrors CatalogView: breadcrumb, title, filter rail, toolbar, product grid.
export function CatalogSkeleton() {
  return (
    <main id="main" className="min-h-screen bg-page pb-20" role="status" aria-label="Loading products">
      <div className="mx-auto max-w-[1376px] px-4 md:px-8">
        <Bone className="mt-5 h-4 w-48" />
        <Bone className="mt-3 h-9 w-64" />
        <div className="mt-5 grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[264px_minmax(0,1fr)] lg:gap-8">
          <div className="hidden h-[520px] rounded-lg border border-border bg-white lg:block" />
          <div>
            <div className="h-[62px] rounded-lg border border-border bg-white" />
            <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 2xl:grid-cols-4">
              {Array.from({ length: 8 }, (_, i) => <CardSkeleton key={i} />)}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
