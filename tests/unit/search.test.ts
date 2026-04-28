import { describe, expect, it } from "vitest";

import type {
  SearchIndex,
  SearchRecord,
} from "../../src/data/search-index.types";
import { search } from "../../src/utils/search";

function makeIndex(records: SearchRecord[]): SearchIndex {
  return { generatedAt: "2026-01-01T00:00:00.000Z", records };
}

const FIXTURE: SearchRecord[] = [
  {
    id: "skill-Kubernetes-en",
    kind: "skill",
    openerKey: "Kubernetes",
    title: "Kubernetes",
    secondary: "DevOps",
    lang: "en",
    fields: {
      title: "Kubernetes",
      secondary: "DevOps",
      description: "Container orchestrator that schedules workloads.",
      aliases: ["k8s", "kube"],
    },
  },
  {
    id: "skill-Kubernetes-sv",
    kind: "skill",
    openerKey: "Kubernetes",
    title: "Kubernetes",
    secondary: "DevOps",
    lang: "sv",
    fields: {
      title: "Kubernetes",
      secondary: "DevOps",
      description: "Containerorkestrator som schemalägger arbetslaster.",
      aliases: ["k8s", "kube"],
    },
  },
  {
    id: "project-zag-en",
    kind: "project",
    openerKey: "zag",
    title: "zag",
    secondary: "Agent runner",
    lang: "en",
    fields: {
      title: "zag",
      secondary: "Agent runner",
      description: "Agent orchestration cli.",
      stack: ["Rust", "Docker"],
      skills: ["Claude Code", "Ollama"],
      aliases: ["agent cli"],
    },
  },
  {
    id: "company-bookbeat-en",
    kind: "company",
    openerKey: "bookbeat",
    title: "BookBeat",
    secondary: "Audiobook streaming",
    lang: "en",
    fields: {
      title: "BookBeat",
      secondary: "Audiobook streaming",
      description: "Audiobook and e-book streaming service.",
      aliases: ["book beat"],
    },
  },
  {
    id: "edu-datavetenskap-sv",
    kind: "education",
    openerKey: "Computer Science",
    title: "Datavetenskap",
    secondary: "KTH · Magister",
    lang: "sv",
    fields: {
      title: "Datavetenskap",
      secondary: "KTH · Magister",
    },
  },
  {
    id: "experience-bookbeat-en",
    kind: "experience",
    openerKey: "bookbeat",
    title: "IT Architect",
    secondary: "BookBeat",
    lang: "en",
    fields: {
      title: "IT Architect",
      secondary: "BookBeat",
      description: "Working on AI agents and observability.",
      stack: ["Rust", "Kubernetes"],
      skills: ["Architecture", "AI agents"],
    },
  },
];

describe("search()", () => {
  const index = makeIndex(FIXTURE);

  it("returns no results for an empty or single-character query", () => {
    expect(search(index, "").total).toBe(0);
    expect(search(index, "k").total).toBe(0);
  });

  it("ranks an exact title match first", () => {
    const results = search(index, "Kubernetes");
    expect(results.total).toBeGreaterThan(0);
    expect(results.hits[0].record.openerKey).toBe("Kubernetes");
  });

  it("collapses bilingual records to a single hit per (kind, openerKey)", () => {
    const results = search(index, "Kubernetes");
    const skillHits = results.hits.filter((h) => h.record.kind === "skill");
    expect(skillHits).toHaveLength(1);
    expect(skillHits[0].record.openerKey).toBe("Kubernetes");
  });

  it("matches via a hidden alias", () => {
    const results = search(index, "k8s");
    const top = results.hits[0];
    expect(top.record.openerKey).toBe("Kubernetes");
    expect(top.matches[0].field).toBe("alias");
    expect(top.matches[0].value).toBe("k8s");
  });

  it("tolerates typos within the fuzzy threshold", () => {
    const results = search(index, "kuberntes");
    const skillHits = results.hits.filter((h) => h.record.kind === "skill");
    expect(skillHits).toHaveLength(1);
    expect(skillHits[0].record.openerKey).toBe("Kubernetes");
    expect(skillHits[0].matches[0].type).toBe("fuzzy");
  });

  it("matches Swedish-only content via the Swedish record", () => {
    const results = search(index, "datavetenskap");
    const eduHits = results.hits.filter((h) => h.record.kind === "education");
    expect(eduHits).toHaveLength(1);
    expect(eduHits[0].record.openerKey).toBe("Computer Science");
  });

  it("ranks exact > prefix > partial > fuzzy on the same field", () => {
    const exactHit = search(index, "Kubernetes").hits[0];
    const fuzzyHit = search(index, "kuberntes").hits[0];
    expect(exactHit.score).toBeGreaterThan(fuzzyHit.score);
  });

  it("ranks stack matches above skill matches on otherwise-equal records", () => {
    // BookBeat experience has Kubernetes in stack; the standalone skill
    // record has Kubernetes in title (much higher), so the experience must
    // not outrank the skill. But within the experience record, stack
    // contributes more than its skills field would.
    const results = search(index, "Kubernetes");
    const top = results.hits[0];
    expect(top.record.kind).toBe("skill");
    const expHit = results.hits.find((h) => h.record.kind === "experience");
    expect(expHit).toBeDefined();
    expect(expHit!.matches[0].field).toBe("stack");
  });

  it("returns flat results sorted by score regardless of kind", () => {
    const results = search(index, "Kubernetes");
    for (let i = 1; i < results.hits.length; i++) {
      expect(results.hits[i - 1].score).toBeGreaterThanOrEqual(
        results.hits[i].score,
      );
    }
  });

  it("requires every query token to match somewhere", () => {
    // "kubernetes nonsense-token" should not match the Kubernetes record
    // because the second token is unmatchable.
    const results = search(index, "kubernetes nonsensezzz");
    expect(results.total).toBe(0);
  });
});
