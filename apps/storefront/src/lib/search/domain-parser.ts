/**
 * UAV engineering shorthand a product title never spells out, so a plain
 * substring search for "fc" or "esc" misses everything. Expand the acronym
 * into the phrase actual titles use; lib/data/products.ts searches every form.
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
  // Everyday words for what the catalogue calls something else.
  drone: "quadcopter",
  drones: "quadcopter",
  uav: "quadcopter",
  quad: "quadcopter",
  prop: "propeller",
  props: "propeller",
  autopilot: "flight controller",
  battery: "lipo",
  batteries: "lipo",
};

/** "motors" -> "motor", "batteries" -> "battery"; spec tokens like "6s" and short words stay as typed. */
export function singular(word: string): string {
  if (word.length < 4 || /\d/.test(word)) return word;
  if (word.endsWith("ies")) return word.slice(0, -3) + "y";
  if (word.endsWith("ss")) return word;
  return word.endsWith("s") ? word.slice(0, -1) : word;
}

/** Every way to look one query word up: as typed, singular, and its catalogue synonym. */
export function wordForms(word: string): string[] {
  const w = word.toLowerCase();
  return [...new Set([w, singular(w), ACRONYM_MAP[w], ACRONYM_MAP[singular(w)]].filter((x): x is string => Boolean(x)))];
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
