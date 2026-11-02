/**
 * Flat vector redraw of the Skyro bird: a faceted bird in flight, wings raised,
 * in the logo's blues. Replaces the raster source (UI/brand), which carries a
 * glow, a carbon background and a generator watermark and cannot be printed.
 */
export function SkyroMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className={className} aria-hidden="true">
      {/* far wing */}
      <path d="M9 6 L27 21 L21 24 Z" fill="var(--color-brand-bright, #2589E1)" />
      {/* near wing */}
      <path d="M4 16 L25 24 L18 28 Z" fill="var(--color-brand, #1D6AC2)" />
      {/* body and head, beak forward */}
      <path d="M17 28 L33 18 L42 17 L45 19 L39 21 L31 30 L22 33 Z" fill="var(--color-brand, #1D6AC2)" />
      {/* belly facet */}
      <path d="M22 33 L31 30 L26 36 Z" fill="var(--color-navy, #0A1A2F)" />
      {/* tail */}
      <path d="M22 33 L12 43 L18 33 Z" fill="var(--color-brand-bright, #2589E1)" />
      {/* eye */}
      <circle cx="38.5" cy="19" r="1.2" fill="var(--color-brand-cyan, #52E1F2)" />
    </svg>
  );
}

export function SkyroLogo({ className, light }: { className?: string; light?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <SkyroMark size={30} />
      <span className={`text-[20px] font-bold tracking-[-0.03em] ${light ? "text-white" : "text-navy"}`}>
        Skyrostore
      </span>
    </span>
  );
}
