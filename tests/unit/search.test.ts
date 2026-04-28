import { describe, expect, it } from "vitest";

import type {
  SearchIndex,
  SearchRecord,
} from "../../src/data/search-index.types";
import { buildFuse, search } from "../../src/utils/search";

function makeIndex(records: SearchRecord[]): SearchIndex {
  return { generatedAt: "2026-01-01T00:00:00.000Z", records };
}

const FIXTURE: SearchRecord[] = [
  {
    id: "skill-Kubernetes-en",
    kind: "skill",
    openerKey: "Kubernetes",
    title: "Kubernetes",
    secondary: "Cloud / containers",
    lang: "en",
    haystack: "kubernetes · cloud / containers · container orchestrator",
  },
  {
    id: "skill-Kubernetes-sv",
    kind: "skill",
    openerKey: "Kubernetes",
    title: "Kubernetes",
    secondary: "Moln / containrar",
    lang: "sv",
    haystack: "kubernetes · moln / containrar",
  },
  {
    id: "project-zag-en",
    kind: "project",
    openerKey: "zag",
    title: "zag",
    secondary: "Agent runner",
    lang: "en",
    haystack: "zag · agent runner · agent orchestration cli",
  },
  {
    id: "company-bookbeat-en",
    kind: "company",
    openerKey: "bookbeat",
    title: "BookBeat",
    secondary: "Audiobook streaming",
    lang: "en",
    haystack: "bookbeat · audiobook streaming",
  },
  {
    id: "edu-datavetenskap-sv",
    kind: "education",
    openerKey: "Computer Science",
    title: "Datavetenskap",
    secondary: "KTH · Magister",
    lang: "sv",
    haystack: "datavetenskap · kth · magister",
  },
];

describe("search()", () => {
  const fuse = buildFuse(makeIndex(FIXTURE));

  it("returns no results for an empty or single-character query", () => {
    expect(search(fuse, "").total).toBe(0);
    expect(search(fuse, "k").total).toBe(0);
  });

  it("ranks an exact title match first", () => {
    const results = search(fuse, "Kubernetes");
    expect(results.total).toBeGreaterThan(0);
    expect(results.groups[0].hits[0].record.openerKey).toBe("Kubernetes");
  });

  it("collapses bilingual records to a single hit per (kind, openerKey)", () => {
    const results = search(fuse, "Kubernetes");
    const skillHits =
      results.groups.find((g) => g.kind === "skill")?.hits ?? [];
    expect(skillHits.length).toBe(1);
    expect(skillHits[0].record.openerKey).toBe("Kubernetes");
  });

  it("tolerates typos within the fuzzy threshold", () => {
    const results = search(fuse, "kuberntes");
    const skillHits =
      results.groups.find((g) => g.kind === "skill")?.hits ?? [];
    expect(skillHits.length).toBe(1);
    expect(skillHits[0].record.openerKey).toBe("Kubernetes");
  });

  it("matches Swedish-only content via the Swedish record", () => {
    const results = search(fuse, "datavetenskap");
    const eduHits =
      results.groups.find((g) => g.kind === "education")?.hits ?? [];
    expect(eduHits.length).toBe(1);
    expect(eduHits[0].record.openerKey).toBe("Computer Science");
  });

  it("groups results by kind in the canonical order", () => {
    const results = search(fuse, "agent");
    const kinds = results.groups.map((g) => g.kind);
    // "project" must come before "skill" (canonical order).
    if (kinds.includes("project") && kinds.includes("skill")) {
      expect(kinds.indexOf("project")).toBeLessThan(kinds.indexOf("skill"));
    }
  });
});
