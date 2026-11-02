import Link from "next/link";

/**
 * The real brands in the catalogue as a slow scrolling band. The list is
 * doubled so the loop is seamless; it pauses on hover or keyboard focus and
 * stands still under reduced motion (globals.css).
 */
export function BrandBar({ brands }: { brands: Array<{ handle: string; title: string; count: number }> }) {
  // A band of one or two names reads as broken; it appears once the catalogue has three brands.
  if (brands.length < 3) return null;
  const loop = [...brands, ...brands];
  return (
    <section aria-label="Brands we stock" className="brand-bar overflow-hidden bg-brand py-7">
      <ul className="brand-bar-track flex w-max gap-14 pr-14">
        {loop.map((b, i) => (
          <li key={`${b.handle}-${i}`} aria-hidden={i >= brands.length ? true : undefined}>
            <Link
              href={`/brands/${b.handle}`}
              tabIndex={i >= brands.length ? -1 : undefined}
              className="whitespace-nowrap text-[clamp(1.75rem,1.2rem+2vw,3rem)] font-bold tracking-[-0.03em] text-white hover:text-brand-cyan"
            >
              {b.title}
              <span className="ml-3 align-middle text-[16px] font-normal text-[#CFE3F8]">{b.count}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
