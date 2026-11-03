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
          <Bone className="h-8 w-8" />
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
