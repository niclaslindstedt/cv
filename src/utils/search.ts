import { useEffect, useMemo, useState } from "react";

import type {
  SearchField,
  SearchIndex,
  SearchKind,
  SearchMatch,
  SearchMatchType,
  SearchRecord,
} from "../data/search-index.types";

export type { SearchMatch, SearchMatchType };

export type SearchHit = {
  record: SearchRecord;
  score: number;
  matches: SearchMatch[];
};

export type SearchResults = {
  total: number;
  hits: SearchHit[];
};

// Field weights — higher means a match in this field counts for more.
// Order: title > alias > stack > skill > secondary > description.
const FIELD_WEIGHTS: Record<SearchField, number> = {
  title: 100,
  alias: 75,
  stack: 60,
  skill: 50,
  secondary: 40,
  description: 25,
};

// Match-type modifiers — multiplied with the field weight.
const MATCH_MODIFIERS: Record<SearchMatchType, number> = {
  exact: 1,
  prefix: 0.85,
  partial: 0.65,
  fuzzy: 0.4,
};

const RESULT_LIMIT = 60;
const MIN_QUERY_LENGTH = 2;
const FUZZY_MIN_LENGTH = 4;

let cachedIndex: SearchIndex | null = null;
let inflight: Promise<SearchIndex> | null = null;

async function loadIndex(): Promise<SearchIndex> {
  if (cachedIndex) return cachedIndex;
  if (inflight) return inflight;
  inflight = import("../data/search-index.json").then((mod) => {
    cachedIndex = mod.default as unknown as SearchIndex;
    return cachedIndex;
  });
  return inflight;
}

export function useSearchIndex(enabled: boolean): SearchIndex | null {
  const [index, setIndex] = useState<SearchIndex | null>(cachedIndex);
  useEffect(() => {
    if (!enabled || index) return;
    let cancelled = false;
    loadIndex().then((loaded) => {
      if (!cancelled) setIndex(loaded);
    });
    return () => {
      cancelled = true;
    };
  }, [enabled, index]);
  return index;
}

export function normalize(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function tokenizeQuery(query: string): string[] {
  return normalize(query)
    .split(/\s+/)
    .filter((t) => t.length > 0);
}

function escapeRegex(token: string): string {
  return token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Damerau–Levenshtein distance, capped at `max` for early exit.
function editDistance(a: string, b: string, max: number): number {
  const al = a.length;
  const bl = b.length;
  if (Math.abs(al - bl) > max) return max + 1;
  if (al === 0) return bl;
  if (bl === 0) return al;
  let prevPrev = new Array(bl + 1);
  let prev = new Array(bl + 1);
  let curr = new Array(bl + 1);
  for (let j = 0; j <= bl; j++) prev[j] = j;
  for (let i = 1; i <= al; i++) {
    curr[0] = i;
    let rowMin = curr[0];
    for (let j = 1; j <= bl; j++) {
      const cost = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1;
      let v = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
      if (
        i > 1 &&
        j > 1 &&
        a.charCodeAt(i - 1) === b.charCodeAt(j - 2) &&
        a.charCodeAt(i - 2) === b.charCodeAt(j - 1)
      ) {
        v = Math.min(v, prevPrev[j - 2] + 1);
      }
      curr[j] = v;
      if (v < rowMin) rowMin = v;
    }
    if (rowMin > max) return max + 1;
    [prevPrev, prev, curr] = [prev, curr, prevPrev];
  }
  return prev[bl];
}

function maxFuzzyDistance(token: string): number {
  if (token.length < FUZZY_MIN_LENGTH) return 0;
  if (token.length <= 6) return 1;
  return 2;
}

// Match a single query token against a single source string. Returns the
// strongest match type found, or null if no match.
function matchString(token: string, source: string): SearchMatchType | null {
  if (!source) return null;
  const normalized = normalize(source);
  if (normalized === token) return "exact";
  // Whole-word checks. We treat any non-alphanumeric as a word boundary so
  // strings like "C#/.NET" can be matched on "c#" or ".net".
  const escaped = escapeRegex(token);
  const wholeWord = new RegExp(`(^|[^a-z0-9])${escaped}(?![a-z0-9])`, "i");
  if (wholeWord.test(normalized)) return "exact";
  const prefix = new RegExp(`(^|[^a-z0-9])${escaped}`, "i");
  if (prefix.test(normalized)) return "prefix";
  if (normalized.includes(token)) return "partial";
  // Fuzzy: split into word-like atoms, check edit distance against each.
  const max = maxFuzzyDistance(token);
  if (max === 0) return null;
  const atoms = normalized.split(/[^a-z0-9]+/).filter((a) => a.length >= 2);
  for (const atom of atoms) {
    if (Math.abs(atom.length - token.length) > max) continue;
    if (editDistance(atom, token, max) <= max) return "fuzzy";
  }
  return null;
}

type FieldEntry = { field: SearchField; value: string };

function collectFieldEntries(record: SearchRecord): FieldEntry[] {
  const entries: FieldEntry[] = [];
  const f = record.fields;
  entries.push({ field: "title", value: f.title });
  for (const alias of f.aliases ?? []) {
    entries.push({ field: "alias", value: alias });
  }
  for (const item of f.stack ?? []) {
    entries.push({ field: "stack", value: item });
  }
  for (const item of f.skills ?? []) {
    entries.push({ field: "skill", value: item });
  }
  if (f.secondary) entries.push({ field: "secondary", value: f.secondary });
  if (f.description) {
    entries.push({ field: "description", value: f.description });
  }
  return entries;
}

function rankMatchType(type: SearchMatchType): number {
  // Higher rank = stronger match. Used to pick the "explanation" match.
  return ["fuzzy", "partial", "prefix", "exact"].indexOf(type);
}

function scoreRecord(
  record: SearchRecord,
  tokens: string[],
): { score: number; matches: SearchMatch[] } | null {
  const entries = collectFieldEntries(record);
  let totalScore = 0;
  const bestPerToken: Array<{
    contribution: number;
    match: SearchMatch | null;
  }> = tokens.map(() => ({ contribution: 0, match: null }));

  for (const entry of entries) {
    const fieldWeight = FIELD_WEIGHTS[entry.field];
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      const type = matchString(token, entry.value);
      if (!type) continue;
      const contribution = fieldWeight * MATCH_MODIFIERS[type];
      const slot = bestPerToken[i];
      if (contribution > slot.contribution) {
        slot.contribution = contribution;
        slot.match = { field: entry.field, value: entry.value, type };
      }
    }
  }

  // Every token must contribute something — otherwise the result isn't
  // really about the user's query.
  const matches: SearchMatch[] = [];
  for (const slot of bestPerToken) {
    if (slot.contribution === 0 || !slot.match) return null;
    totalScore += slot.contribution;
    matches.push(slot.match);
  }
  // Sort the explanations strongest-first so the top one is the most
  // representative match for the row.
  matches.sort((a, b) => {
    const fieldDelta = FIELD_WEIGHTS[b.field] - FIELD_WEIGHTS[a.field];
    if (fieldDelta !== 0) return fieldDelta;
    return rankMatchType(b.type) - rankMatchType(a.type);
  });
  return { score: totalScore, matches };
}

function dedupeBilingual(hits: SearchHit[]): SearchHit[] {
  const best = new Map<string, SearchHit>();
  for (const hit of hits) {
    const key = `${hit.record.kind}:${hit.record.openerKey}`;
    const existing = best.get(key);
    if (!existing || hit.score > existing.score) best.set(key, hit);
  }
  return [...best.values()];
}

export function search(index: SearchIndex, query: string): SearchResults {
  const tokens = tokenizeQuery(query);
  if (tokens.length === 0) return { total: 0, hits: [] };
  // Reject single-character queries unless they're targeted (e.g. "c#").
  const meaningful = tokens.some((t) => t.length >= MIN_QUERY_LENGTH);
  if (!meaningful) return { total: 0, hits: [] };

  const raw: SearchHit[] = [];
  for (const record of index.records) {
    const scored = scoreRecord(record, tokens);
    if (!scored) continue;
    raw.push({ record, score: scored.score, matches: scored.matches });
  }
  const collapsed = dedupeBilingual(raw);
  collapsed.sort((a, b) => b.score - a.score);
  const limited = collapsed.slice(0, RESULT_LIMIT);
  return { total: collapsed.length, hits: limited };
}

export type GroupKindOrder = SearchKind;

export function useSearch(
  query: string,
  enabled: boolean,
): { results: SearchResults; ready: boolean } {
  const index = useSearchIndex(enabled);
  const results = useMemo(() => {
    if (!index) return { total: 0, hits: [] } as SearchResults;
    return search(index, query);
  }, [index, query]);
  return { results, ready: !!index };
}
