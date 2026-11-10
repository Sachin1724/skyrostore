/**
 * UAV engineering shorthand a product title never spells out, so a plain
 * substring search for "fc" or "esc" misses everything. Expand the acronym
 * into the phrase actual titles use, and let the existing multi-word search
 * (already in /api/search/suggest) try both.
 */
const ACRONYM_MAP: Record<string, string> = {
  fc: "flight controller",
  esc: "electronic speed controller",
  vtx: "video transmitter",
  vrx: "video receiver",
  rx: "receiver",
  tx: "transmitter",
  lipo: "battery",
  "li-po": "battery",
  gps: "gps",
  pdb: "power distribution board",
  bec: "battery eliminator circuit",
  elrs: "expresslrs receiver",
  fpv: "fpv",
};

/** The query itself, plus any acronym it contains expanded to the full phrase — not a replacement, an addition. */
export function expandAcronyms(query: string): string[] {
  const lower = query.toLowerCase().trim();
  const words = lower.split(/\s+/);
  const expansions = new Set<string>();
  for (const w of words) {
    const expansion = ACRONYM_MAP[w];
    if (expansion && expansion !== w) {
      expansions.add(lower.replace(new RegExp(`\\b${w}\\b`), expansion));
    }
  }
  return [...expansions];
}

export interface ParsedSpecs {
  kv?: number;
  cells?: number;
  amps?: number;
  stator?: string;
  dimensions?: string;
}

const KV_RE = /\b(\d{3,5})\s*kv\b/i;
const CELLS_RE = /\b([1-9])s\b/i;
const AMPS_RE = /\b(\d{1,3})\s*a\b/i;
const STATOR_RE = /\b(\d{4})\b/;
const DIMENSIONS_RE = /\b(\d{1,3}(?:\.\d)?)\s*x\s*(\d{1,3}(?:\.\d)?)\b/i;

/** Pulls engineering spec tokens out of a free-text query, e.g. "6s 45a esc" -> { cells: 6, amps: 45 }. */
export function parseQuerySpecs(query: string): ParsedSpecs {
  const specs: ParsedSpecs = {};
  const kv = query.match(KV_RE);
  if (kv) specs.kv = Number(kv[1]);
  const cells = query.match(CELLS_RE);
  if (cells) specs.cells = Number(cells[1]);
  const amps = query.match(AMPS_RE);
  if (amps) specs.amps = Number(amps[1]);
  const dims = query.match(DIMENSIONS_RE);
  if (dims) specs.dimensions = `${dims[1]}x${dims[2]}`;
  else {
    const stator = query.match(STATOR_RE);
    if (stator) specs.stator = stator[1];
  }
  return specs;
}
