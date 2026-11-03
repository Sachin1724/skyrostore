// Route skeletons: same boxes as the real layout, one slow tone pulse, no spinners.

export function Bone({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`skeleton ${className}`} />;
}

// Mirrors ProductCard: square media, brand/category, title, highlight, price row.
export function CardSkeleton() {
  return (
    <div className="rounded-md border border-border bg-surface">
      <div className="aspect-square rounded-t-md bg-surface-soft" />
      <div className="p-3">
        <Bone className="h-[18px] w-1/2" />
        <Bone className="mt-1 h-[19px] w-4/5" />
        <Bone className="mt-1 h-[18px] w-3/5" />
        <div className="mt-3 flex items-end justify-between pt-1">
          <div>
            <Bone className="h-[22px] w-20" />
            <Bone className="mt-0.5 h-[18px] w-16" />
          </div>
          <Bone className="h-10 w-10" />
        </div>
      </div>
    </div>
  );
}

export function GridSkeleton({ count = 8, className }: { count?: number; className: string }) {
  return (
    <div className={className} role="status" aria-label="Loading products">
      {Array.from({ length: count }, (_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

// Mirrors ProductRow: thumbnail, three text lines, price/stock, add button.
export function ListSkeleton({ count = 8 }: { count?: number }) {
  return (
    <ul className="mt-4 divide-y divide-border bg-white px-4 md:px-6" role="status" aria-label="Loading products">
      {Array.from({ length: count }, (_, i) => (
        <li key={i} className="flex items-center gap-4 py-4">
          <div className="h-16 w-16 shrink-0 bg-surface-soft md:h-20 md:w-20" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <Bone className="h-5 w-3/5" />
            <Bone className="h-4 w-2/5" />
            <Bone className="h-4 w-1/3" />
          </div>
          <div className="w-20 shrink-0 space-y-1.5">
            <Bone className="h-5 w-full" />
            <Bone className="h-4 w-full" />
          </div>
          <Bone className="h-10 w-10 shrink-0" />
        </li>
      ))}
    </ul>
  );
}
