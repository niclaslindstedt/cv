import Fuse, { type FuseResult, type IFuseOptions } from "fuse.js";
import { useEffect, useMemo, useState } from "react";

import type {
  SearchIndex,
  SearchKind,
  SearchRecord,
} from "../data/search-index.types";

export type SearchHit = {
  record: SearchRecord;
  score: number;
};

export type SearchResults = {
  total: number;
  groups: Array<{ kind: SearchKind; hits: SearchHit[] }>;
};

const KIND_ORDER: SearchKind[] = [
  "summary",
  "focus",
  "experience",
  "assignment",
  "project",
  "company",
  "education",
  "course",
  "skill",
];

const FUSE_OPTIONS: IFuseOptions<SearchRecord> = {
  includeScore: true,
  ignoreLocation: true,
  threshold: 0.35,
  minMatchCharLength: 2,
  keys: [
    { name: "title", weight: 0.6 },
    { name: "secondary", weight: 0.25 },
    { name: "haystack", weight: 0.15 },
  ],
};

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

export function buildFuse(index: SearchIndex): Fuse<SearchRecord> {
  return new Fuse(index.records, FUSE_OPTIONS);
}

function normalizeQuery(query: string): string {
  return query
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function dedupeAndGroup(raw: Array<FuseResult<SearchRecord>>): SearchResults {
  // Each addressable item is indexed twice (en + sv). Collapse to a single
  // hit per (kind, openerKey) pair, keeping the better score.
  const best = new Map<string, SearchHit>();
  for (const r of raw) {
    const key = `${r.item.kind}:${r.item.openerKey}`;
    const score = r.score ?? 1;
    const existing = best.get(key);
    if (!existing || score < existing.score) {
      best.set(key, { record: r.item, score });
    }
  }
  const flat = [...best.values()].sort((a, b) => a.score - b.score);
  const byKind = new Map<SearchKind, SearchHit[]>();
  for (const hit of flat) {
    const list = byKind.get(hit.record.kind) ?? [];
    list.push(hit);
    byKind.set(hit.record.kind, list);
  }
  const groups: SearchResults["groups"] = [];
  for (const kind of KIND_ORDER) {
    const hits = byKind.get(kind);
    if (hits && hits.length > 0) groups.push({ kind, hits });
  }
  return { total: flat.length, groups };
}

export function search(fuse: Fuse<SearchRecord>, query: string): SearchResults {
  const q = normalizeQuery(query);
  if (q.length < 2) return { total: 0, groups: [] };
  const raw = fuse.search(q, { limit: 60 });
  return dedupeAndGroup(raw);
}

export function useSearch(
  query: string,
  enabled: boolean,
): { results: SearchResults; ready: boolean } {
  const index = useSearchIndex(enabled);
  const fuse = useMemo(() => (index ? buildFuse(index) : null), [index]);
  const results = useMemo(() => {
    if (!fuse) return { total: 0, groups: [] } as SearchResults;
    return search(fuse, query);
  }, [fuse, query]);
  return { results, ready: !!index };
}
