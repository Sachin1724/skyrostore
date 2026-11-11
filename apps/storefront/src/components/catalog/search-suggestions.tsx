import Link from "next/link";

/** Quick links under the search results: real category and brand names, never invented terms. */
export function SearchSuggestions({ currentQuery, terms }: { currentQuery?: string; terms: string[] }) {
  if (terms.length === 0) return null;
  return (
    <div className="mb-5 flex flex-wrap items-center gap-2">
      <span className="text-[13px] text-text-muted">Try:</span>
      {terms.map((term) => {
        const on = currentQuery?.toLowerCase() === term.toLowerCase();
        return (
          <Link
            key={term}
            href={`/search?q=${encodeURIComponent(term)}`}
            className={`rounded-full px-3 py-1.5 text-[13px] ${on ? "bg-navy text-white" : "bg-white text-navy hover:bg-surface-muted"}`}
          >
            {term}
          </Link>
        );
      })}
    </div>
  );
}
