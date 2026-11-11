/**
 * Typo correction for searches that find nothing: each query word is swapped for the closest word in
 * the catalogue's own vocabulary (product titles, category and brand names). Short words allow one
 * edit, longer words two. Returns null when nothing changes.
 * ponytail: plain Levenshtein over a vocabulary of a few hundred words; move to pg_trgm in the backend
 * if the catalogue grows into the thousands.
 */
export function didYouMean(query: string, vocabulary: Iterable<string>): string | null {
  // Hyphenated names stay whole too, so "tmotor" finds "t-motor" (compared without the hyphen).
  const words = new Set<string>();
  for (const text of vocabulary)
    for (const w of text.toLowerCase().split(/[^a-z0-9-]+/)) for (const part of [w, ...w.split("-")]) if (part.replace(/-/g, "").length >= 3) words.add(part);

  let changed = false;
  const fixed = query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => {
      if (words.has(word) || /\d/.test(word) || word.length < 3) return word;
      const limit = word.length <= 4 ? 1 : 2;
      let best: string | null = null;
      let bestDistance = limit + 1;
      for (const candidate of words) {
        if (Math.abs(candidate.length - word.length) > limit) continue;
        const d = distance(word, candidate.replace(/-/g, ""));
        if (d < bestDistance) [best, bestDistance] = [candidate, d];
      }
      if (best) changed = true;
      return best ?? word;
    })
    .join(" ");
  return changed ? fixed : null;
}

function distance(a: string, b: string): number {
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    for (let j = 1; j <= b.length; j++) row[j] = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = row;
  }
  return prev[b.length];
}
