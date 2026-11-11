import Link from "next/link";
import Image from "next/image";

/**
 * The one product card. Catalog, shelves, the builder and the account pages all render this,
 * so the image box, text sizes and spacing are the same everywhere. Callers pass content only.
 */
export function ProductTile({
  href,
  image,
  fallback,
  eyebrow,
  title,
  spec,
  price,
  status,
  action,
  overlay,
  badge,
  footer,
  selected = false,
  priority = false,
}: {
  href?: string;
  image?: string | null;
  fallback: React.ReactNode;
  eyebrow?: string;
  title: string;
  spec?: string;
  price: React.ReactNode;
  status?: React.ReactNode;
  action?: React.ReactNode;
  overlay?: React.ReactNode;
  badge?: React.ReactNode;
  /** Full-width row under the price, for a labelled "Add to cart" button. */
  footer?: React.ReactNode;
  selected?: boolean;
  priority?: boolean;
}) {
  const media = (
    <>
      {image ? (
        <Image
          src={image}
          alt=""
          fill
          priority={priority}
          sizes="(min-width: 1280px) 20vw, (min-width: 640px) 33vw, 50vw"
          className="object-contain p-3 transition-transform duration-300 ease-out group-hover:scale-[1.04]"
        />
      ) : (
        fallback
      )}
      {badge}
    </>
  );
  // One frame everywhere: square and white like the product photos themselves, so nothing is letterboxed.
  const mediaClass = "relative block aspect-square w-full bg-white";

  return (
    <article
      className={`group card relative flex h-full flex-col overflow-hidden transition-[box-shadow,translate] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_2px_4px_rgba(0,0,0,0.04),0_12px_24px_rgba(0,0,0,0.08)] ${
        selected ? "outline outline-2 -outline-offset-1 outline-navy" : ""
      }`}
    >
      {overlay}
      {href ? (
        <Link href={href} tabIndex={-1} aria-hidden className={mediaClass}>
          {media}
        </Link>
      ) : (
        <div className={mediaClass}>{media}</div>
      )}
      <div className="flex flex-1 flex-col gap-1 p-3.5">
        {eyebrow ? <p className="truncate text-[13px] text-text-muted">{eyebrow}</p> : null}
        <h3 className="line-clamp-2 min-h-[2.6em] text-[14px] font-medium leading-snug text-navy">
          {href ? (
            <Link href={href} className="hover:text-brand">
              {title}
            </Link>
          ) : (
            title
          )}
        </h3>
        {spec ? <p className="truncate text-[13px] tabular-nums text-text-secondary">{spec}</p> : null}
        {/* Price keeps its width; on a narrow card the action wraps under it instead of overlapping. */}
        <div className="mt-auto flex flex-wrap items-end justify-between gap-2 pt-2">
          <div className="whitespace-nowrap">
            {price}
            {status}
          </div>
          {action}
        </div>
        {footer ? <div className="pt-2">{footer}</div> : null}
      </div>
    </article>
  );
}
