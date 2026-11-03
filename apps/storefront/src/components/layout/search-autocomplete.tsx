"use client";

import { useEffect, useId, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Search, Loader2 } from "lucide-react";
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

const DEBOUNCE_MS = 180;
const MIN_QUERY = 2;

/** `category` scopes "see all results" to a category handle; suggestions stay catalogue-wide. */
export function SearchAutocomplete({ className = "", category = "" }: { className?: string; category?: string }) {
  const router = useRouter();
  const listId = useId();

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced fetch. Each keystroke aborts the previous request so a slow
  // earlier response can never overwrite a newer one.
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < MIN_QUERY) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => {
      setLoading(true);
      fetch(`/api/search/suggest?q=${encodeURIComponent(trimmed)}`, {
        signal: controller.signal,
      })
        .then((r) => (r.ok ? r.json() : { suggestions: [] }))
        .then((data) => {
          setSuggestions(data.suggestions || []);
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

  // Close when focus or the pointer leaves the widget.
  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  function goToResults(term: string) {
    const trimmed = term.trim();
    if (!trimmed) return;
    track("search_performed", { search_query: trimmed, metadata: { source: "header" } });
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(trimmed)}${category ? `&category=${encodeURIComponent(category)}` : ""}`);
  }

  function goToProduct(suggestion: Suggestion, position: number) {
    track("search_performed", {
      search_query: query.trim(),
      product_id: suggestion.id,
      metadata: { source: "header_suggestion", position },
    });
    setOpen(false);
    setQuery("");
    router.push(`/products/${suggestion.handle}`);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }
    if (!open || suggestions.length === 0) {
      if (event.key === "Enter") {
        event.preventDefault();
        goToResults(query);
      }
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (activeIndex >= 0) goToProduct(suggestions[activeIndex], activeIndex);
      else goToResults(query);
    }
  }

  const showPanel = open && query.trim().length >= MIN_QUERY;

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
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search motors, flight controllers, frames…"
          autoComplete="off"
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            activeIndex >= 0 ? `${listId}-option-${activeIndex}` : undefined
          }
          className="h-full min-w-0 flex-1 bg-white pl-4 pr-2 text-[15px] font-medium text-navy placeholder:text-text-muted focus:outline-none"
        />
        <button
          type="submit"
          aria-label="Search"
          className="flex w-12 shrink-0 items-center justify-center rounded-r-[4px] bg-brand text-white transition-colors hover:bg-navy md:w-14"
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" strokeWidth={2} aria-hidden />
          ) : (
            <Search className="h-5 w-5" strokeWidth={2.2} aria-hidden />
          )}
        </button>
      </form>

      {/* Result count for assistive tech; the list itself is visual. */}
      <p aria-live="polite" className="sr-only">
        {showPanel && !loading
          ? `${suggestions.length} suggestion${suggestions.length === 1 ? "" : "s"} for ${query.trim()}`
          : ""}
      </p>

      {showPanel && (
        <div
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-md border border-border bg-white shadow-lg"
          style={{ minWidth: "320px" }}
        >
          {suggestions.length === 0 ? (
            <p className="px-3 py-3 text-[14px] text-text-muted">
              {loading ? "Searching…" : `No products match “${query.trim()}”.`}
            </p>
          ) : (
            <ul id={listId} role="listbox" aria-label="Product suggestions">
              {suggestions.map((suggestion, index) => (
                <li
                  key={suggestion.id}
                  id={`${listId}-option-${index}`}
                  role="option"
                  aria-selected={index === activeIndex}
                >
                  <button
                    type="button"
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => goToProduct(suggestion, index)}
                    className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                      index === activeIndex ? "bg-surface-soft" : "bg-white"
                    }`}
                  >
                    <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded border border-border bg-surface-soft">
                      {suggestion.thumbnail ? (
                        <Image
                          src={suggestion.thumbnail}
                          alt=""
                          width={40}
                          height={40}
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <Search className="h-3.5 w-3.5 text-text-muted" strokeWidth={1.6} />
                      )}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-semibold text-graphite">
                        {suggestion.title}
                      </span>
                      <span className="block truncate text-[13px] text-text-muted">
                        {[suggestion.brand, suggestion.category].filter(Boolean).join(" · ") ||
                          "UAV component"}
                        {!suggestion.in_stock ? " · Out of stock" : ""}
                      </span>
                    </span>

                    {suggestion.price !== null && (
                      <span className="shrink-0 tabular-nums text-[14px] font-bold text-graphite">
                        {formatPrice(suggestion.price, suggestion.currency_code || "INR")}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}

          <button
            type="button"
            onClick={() => goToResults(query)}
            className="block w-full border-t border-border bg-surface-soft px-3 py-2 text-left text-[13px] font-semibold text-graphite hover:bg-accent-hover"
          >
            See all results for “{query.trim()}”
          </button>
        </div>
      )}
    </div>
  );
}
