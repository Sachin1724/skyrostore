import Link from "next/link";
import { TrendingUp, Search } from "lucide-react";

const POPULAR_SEARCHES = [
  "T-Motor",
  "Pixhawk 6X",
  "Hobbywing ESC",
  "6S LiPo Battery",
  "Carbon Fiber Frame",
  "15-inch Propeller",
  "Cube Orange",
  "RTK GNSS",
  "Telemetry Radio",
  "Brushless Motor",
];

export function SearchSuggestions({ currentQuery }: { currentQuery?: string }) {
  return (
    <div className="mb-6 rounded-xl border border-border bg-white p-4 md:p-5 shadow-sm">
      <div className="flex items-center gap-2 text-[12px] font-bold text-navy">
        <TrendingUp className="h-4 w-4 text-brand" aria-hidden />
        <span>Popular Engineering Searches:</span>
      </div>

      <div className="mt-2.5 flex flex-wrap gap-2">
        {POPULAR_SEARCHES.map((term) => {
          const isSelected = currentQuery?.toLowerCase() === term.toLowerCase();
          return (
            <Link
              key={term}
              href={`/search?q=${encodeURIComponent(term)}`}
              className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[12px] font-semibold transition-all ${
                isSelected
                  ? "border-brand bg-brand text-white"
                  : "border-border bg-surface-soft text-navy hover:border-brand hover:bg-white hover:text-brand"
              }`}
            >
              <Search className="h-3 w-3 opacity-60" aria-hidden />
              <span>{term}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
