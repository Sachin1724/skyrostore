import Link from "next/link";

export const PAGE_SIZE = 25;

/** `?page=` as a safe 1-based number. */
export const pageOf = (raw?: string) => Math.max(1, Math.floor(Number(raw)) || 1);

/** "Showing 21-40 of 312" with Previous/Next links that keep the other filters in the URL. */
export function Pagination({
  basePath,
  query,
  page,
  pageSize,
  total,
}: {
  basePath: string;
  query: Record<string, string | undefined>;
  page: number;
  pageSize: number;
  total: number;
}) {
  if (total <= 0) return null;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const href = (p: number) => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) if (v) qs.set(k, v);
    if (p > 1) qs.set("page", String(p));
    const s = qs.toString();
    return s ? `${basePath}?${s}` : basePath;
  };
  const btn = "rounded border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50";
  const off = "pointer-events-none opacity-40";
  return (
    <nav aria-label="Pagination" className="mt-4 flex items-center justify-between text-sm text-gray-500">
      <p>
        Showing {from}-{to} of {total}
      </p>
      <div className="flex gap-2">
        <Link href={href(page - 1)} aria-disabled={page <= 1} className={`${btn} ${page <= 1 ? off : ""}`}>
          Previous
        </Link>
        <Link href={href(page + 1)} aria-disabled={page >= pages} className={`${btn} ${page >= pages ? off : ""}`}>
          Next
        </Link>
      </div>
    </nav>
  );
}
