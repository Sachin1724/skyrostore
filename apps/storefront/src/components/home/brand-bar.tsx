import Link from "next/link";

/**
 * The real brands in the catalogue as a slow scrolling band. The list is
 * doubled so the loop is seamless; it pauses on hover or keyboard focus and
 * stands still under reduced motion (globals.css).
 */
export function BrandBar({ brands }: { brands: Array<{ handle: string; title: string; logo?: string | null }> }) {
  // A band of one or two names reads as broken; it appears once the catalogue has three brands.
  if (brands.length < 3) return null;
  const loop = [...brands, ...brands];
  return (
    <section aria-label="Brands we stock" className="brand-bar overflow-hidden border-y border-border bg-white py-5">
      <ul className="brand-bar-track flex w-max gap-14 pr-14">
        {loop.map((b, i) => (
          <li key={`${b.handle}-${i}`} aria-hidden={i >= brands.length ? true : undefined}>
            <Link
              href={`/brands/${b.handle}`}
              tabIndex={i >= brands.length ? -1 : undefined}
              className="whitespace-nowrap flex h-12 items-center text-xl font-bold text-navy hover:text-brand"
            >
              {b.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={b.logo} alt={b.title} className="h-12 w-auto max-w-[180px] object-contain" />
              ) : (
                b.title
              )}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
