import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { describe, expect, it } from "vitest";

import { loadCv } from "../../src/data/load-cv.mjs";
import searchIndex from "../../src/data/search-index.json";
import type { SearchIndex } from "../../src/data/search-index.types";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..", "..");

function loadSchema(name: string): Record<string, unknown> {
  const path = resolve(repoRoot, "schemas", name);
  return JSON.parse(readFileSync(path, "utf8"));
}

function compile(schema: Record<string, unknown>) {
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  return ajv.compile(schema);
}

describe("Search index", () => {
  const index = searchIndex as unknown as SearchIndex;

  it("validates against schemas/search-index.schema.json", () => {
    const validate = compile(loadSchema("search-index.schema.json"));
    const ok = validate(index);
    if (!ok) {
      const message = (validate.errors ?? [])
        .map((e) => `${e.instancePath || "/"} ${e.message}`)
        .join("\n");
      throw new Error(`Search index failed schema validation:\n${message}`);
    }
    expect(ok).toBe(true);
  });

  it("contains records for every searchable kind", () => {
    const kinds = new Set(index.records.map((r) => r.kind));
    expect(kinds).toContain("project");
    expect(kinds).toContain("experience");
    expect(kinds).toContain("skill");
    expect(kinds).toContain("focus");
    expect(kinds).toContain("course");
    expect(kinds).toContain("education");
  });

  it("emits both English and Swedish records", () => {
    const langs = new Set(index.records.map((r) => r.lang));
    expect(langs).toContain("en");
    expect(langs).toContain("sv");
  });

  it("normalises diacritics in the haystack", () => {
    for (const r of index.records) {
      // Combining diacritical marks should never survive normalisation.
      expect(r.haystack).not.toMatch(/[̀-ͯ]/);
      // Normalised haystack is always lowercase.
      expect(r.haystack).toBe(r.haystack.toLowerCase());
    }
  });

  it("resolves every openerKey back to a CV item", () => {
    const cv = loadCv();
    const projects = new Set(cv.projects.map((p) => p.name));
    const companies = new Set(cv.companies.map((c) => c.id));
    const focusAreas = new Set(cv.focus.map((f) => f.area.en));
    const educationFields = new Set(cv.education.map((e) => e.field.en));
    const courseNames = new Set(cv.courses.map((c) => c.name.en));
    const skills = new Set<string>();
    for (const group of cv.skills) for (const s of group.items) skills.add(s);

    for (const r of index.records) {
      switch (r.kind) {
        case "project":
          expect(projects.has(r.openerKey)).toBe(true);
          break;
        case "company":
        case "experience":
        case "assignment":
          expect(companies.has(r.openerKey)).toBe(true);
          break;
        case "focus":
          expect(focusAreas.has(r.openerKey)).toBe(true);
          break;
        case "education":
          expect(educationFields.has(r.openerKey)).toBe(true);
          break;
        case "course":
          expect(courseNames.has(r.openerKey)).toBe(true);
          break;
        case "skill":
          expect(skills.has(r.openerKey)).toBe(true);
          break;
        case "summary":
          expect(r.openerKey).toBe("summary");
          break;
      }
    }
  });
});
