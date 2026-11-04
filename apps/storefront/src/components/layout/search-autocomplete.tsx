"use client";

import { Fragment, useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Search, Loader2, Clock, X } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { track } from "@/lib/analytics";

type Suggestion = {
  id: string;
  title: string;
  handle: string;
  thumbnail: string | null;
  category: string | null;
  brand: string | null;
  price: number | null;
  currency_code: string | null;
  in_stock: boolean;
};

type Place = { kind: string; label: string; href: string };
type Row = { type: "place"; place: Place } | { type: "product"; suggestion: Suggestion };

const DEBOUNCE_MS = 180;
const MIN_QUERY = 2;
const RECENT_KEY = "skyro_recent_searches";
const RECENT_MAX = 6;

const readRecent = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
  } catch {
    return [];
  }
};

/** Bolds the part of a title that matches what was typed. */
function Highlight({ text, query }: { text: string; query: string }) {
  const words = query.trim().split(/\s+/).filter((w) => w.length > 1).map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  if (words.length === 0) return <>{text}</>;
  return (
    <>
      {text.split(new RegExp(`(${words.join("|")})`, "ig")).map((part, i) =>
        i % 2 ? <strong key={i} className="font-semibold text-navy">{part}</strong> : <Fragment key={i}>{part}</Fragment>
      )}
    </>
  );
}

/** `category` scopes "see all results" to a category handle; `browse` are real categories offered when the box is empty. */
export function SearchAutocomplete({
  className = "",
  category = "",
  browse = [],
}: {
  className?: string;
  category?: string;
  browse?: { name: string; handle: string }[];
}) {
  const router = useRouter();
  const listId = useId();

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const typed = query.trim().length >= MIN_QUERY;
  const rows: Row[] = [
    ...places.map((place): Row => ({ type: "place", place })),
    ...suggestions.map((suggestion): Row => ({ type: "product", suggestion })),
  ];

  // Debounced fetch. Each keystroke aborts the previous request so a slow
  // earlier response can never overwrite a newer one.
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < MIN_QUERY) {
      setSuggestions([]);
      setPlaces([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => {
      setLoading(true);
      fetch(`/api/search/suggest?q=${encodeURIComponent(trimmed)}`, { signal: controller.signal })
        .then((r) => (r.ok ? r.json() : { suggestions: [], places: [] }))
        .then((data) => {
          setSuggestions(data.suggestions || []);
          setPlaces(data.places || []);
          setActiveIndex(-1);
        })
        .catch(() => undefined)
        .finally(() => setLoading(false));
    }, DEBOUNCE_MS);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query]);

  // Close when the pointer leaves the widget.
  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  function remember(term: string) {
    const next = [term, ...readRecent().filter((t) => t.toLowerCase() !== term.toLowerCase())].slice(0, RECENT_MAX);
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {}
  }

  function goToResults(term: string) {
    const trimmed = term.trim();
    if (!trimmed) return;
    track("search_performed", { search_query: trimmed, metadata: { source: "header" } });
    remember(trimmed);
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(trimmed)}${category ? `&category=${encodeURIComponent(category)}` : ""}`);
  }

  function goToProduct(suggestion: Suggestion, position: number) {
    track("search_performed", { search_query: query.trim(), product_id: suggestion.id, metadata: { source: "header_suggestion", position } });
    remember(query.trim());
    setOpen(false);
    setQuery("");
    router.push(`/products/${suggestion.handle}`);
  }

  function goToPlace(place: Place) {
    setOpen(false);
    setQuery("");
    router.push(place.href);
  }

  function choose(row: Row, index: number) {
    if (row.type === "place") goToPlace(row.place);
    else goToProduct(row.suggestion, index - places.length);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }
    if (!open || !typed || rows.length === 0) {
      if (event.key === "Enter") {
        event.preventDefault();
        goToResults(query);
      }
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => (i + 1) % rows.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => (i <= 0 ? rows.length - 1 : i - 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (activeIndex >= 0) choose(rows[activeIndex], activeIndex);
      else goToResults(query);
    }
  }

  const showPanel = open && (typed || recent.length > 0 || browse.length > 0);

  return (
    <div ref={containerRef} className={`relative h-full ${className}`}>
      <form
        className="flex h-full"
        onSubmit={(event) => {
          event.preventDefault();
          goToResults(query);
        }}
      >
        <label htmlFor={`${listId}-input`} className="sr-only">
          Search products and parts
        </label>
        <input
          id={`${listId}-input`}
          ref={inputRef}
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            setRecent(readRecent());
            setOpen(true);
          }}
          onKeyDown={onKeyDown}
          placeholder="Search motors, flight controllers, frames…"
          autoComplete="off"
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={activeIndex >= 0 ? `${listId}-option-${activeIndex}` : undefined}
          className="h-full min-w-0 flex-1 bg-transparent pl-5 pr-2 text-[16px] text-navy placeholder:text-text-muted focus:outline-none"
        />
        <button type="submit" aria-label="Search" className="flex w-12 shrink-0 items-center justify-center text-text-secondary transition-colors hover:text-navy">
          {loading ? <Loader2 className="h-5 w-5 animate-spin" strokeWidth={2} aria-hidden /> : <Search className="h-5 w-5" strokeWidth={2.2} aria-hidden />}
        </button>
      </form>

      {/* Result count for assistive tech; the list itself is visual. */}
      <p aria-live="polite" className="sr-only">
        {showPanel && typed && !loading ? `${rows.length} suggestion${rows.length === 1 ? "" : "s"} for ${query.trim()}` : ""}
      </p>

      {showPanel && (
        <div className="pop-in absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden card shadow-lg" style={{ minWidth: "340px" }}>
          {!typed ? (
            <div className="p-4">
              {recent.length > 0 && (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-[13px] font-medium text-text-muted">Recent searches</p>
                    <button
                      type="button"
                      onClick={() => {
                        try {
                          localStorage.removeItem(RECENT_KEY);
                        } catch {}
                        setRecent([]);
                      }}
                      className="text-[13px] text-text-muted hover:text-navy"
                    >
                      Clear
                    </button>
                  </div>
                  <ul className="mt-1">
                    {recent.map((term) => (
                      <li key={term}>
                        <button type="button" onClick={() => goToResults(term)} className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-[14px] text-navy hover:bg-surface-soft">
                          <Clock className="h-4 w-4 text-text-muted" aria-hidden />
                          {term}
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
              {browse.length > 0 && (
                <>
                  <p className={`text-[13px] font-medium text-text-muted ${recent.length ? "mt-3" : ""}`}>Browse</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {browse.slice(0, 8).map((c) => (
                      <button
                        key={c.handle}
                        type="button"
                        onClick={() => goToPlace({ kind: "Category", label: c.name, href: `/parts?category=${c.handle}` })}
                        className="rounded-full bg-surface-soft px-3 py-1.5 text-[13px] text-navy hover:bg-surface-muted"
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : rows.length === 0 ? (
            <p className="px-4 py-3 text-[14px] text-text-muted">{loading ? "Searching…" : `No products match “${query.trim()}”.`}</p>
          ) : (
            <ul id={listId} role="listbox" aria-label="Suggestions">
              {rows.map((row, index) => (
                <li key={row.type === "place" ? `p-${row.place.href}` : row.suggestion.id} id={`${listId}-option-${index}`} role="option" aria-selected={index === activeIndex}>
                  {row.type === "place" ? (
                    <button
                      type="button"
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => choose(row, index)}
                      className={`flex w-full items-center gap-3 px-4 py-2.5 text-left ${index === activeIndex ? "bg-surface-soft" : ""}`}
                    >
                      <Search className="h-4 w-4 text-text-muted" aria-hidden />
                      <span className="flex-1 truncate text-[14px] text-text-secondary">
                        <Highlight text={row.place.label} query={query} />
                      </span>
                      <span className="text-[13px] text-text-muted">{row.place.kind}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => choose(row, index)}
                      className={`flex w-full items-center gap-3 px-4 py-2.5 text-left ${index === activeIndex ? "bg-surface-soft" : ""}`}
                    >
                      <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-surface-soft">
                        {row.suggestion.thumbnail ? (
                          <Image src={row.suggestion.thumbnail} alt="" width={40} height={40} className="h-full w-full object-contain" />
                        ) : (
                          <Search className="h-3.5 w-3.5 text-text-muted" strokeWidth={1.6} />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14px] text-text-secondary">
                          <Highlight text={row.suggestion.title} query={query} />
                        </span>
                        <span className="block truncate text-[13px] text-text-muted">
                          {[row.suggestion.brand, row.suggestion.category].filter(Boolean).join(" · ") || "UAV component"}
                          {!row.suggestion.in_stock ? " · Out of stock" : ""}
                        </span>
                      </span>
                      {row.suggestion.price !== null && (
                        <span className="shrink-0 text-[14px] font-medium tabular-nums text-navy">{formatPrice(row.suggestion.price, row.suggestion.currency_code || "INR")}</span>
                      )}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}

          {typed && (
            <button type="button" onClick={() => goToResults(query)} className="block w-full border-t border-border bg-surface-soft px-4 py-2.5 text-left text-[13px] font-medium text-navy hover:bg-surface-muted">
              See all results for “{query.trim()}”
            </button>
          )}
        </div>
      )}
    </div>
  );
}
