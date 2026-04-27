import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import { describe, expect, it } from "vitest";

import { loadCv } from "../../src/data/load-cv.mjs";

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

describe("CV schema roundtrip", () => {
  it("validates the assembled CV against schemas/cv.schema.json", () => {
    const validate = compile(loadSchema("cv.schema.json"));
    const cv = loadCv();
    const ok = validate(cv);
    if (!ok) {
      const message = (validate.errors ?? [])
        .map((e) => `${e.instancePath || "/"} ${e.message}`)
        .join("\n");
      throw new Error(`CV failed schema validation:\n${message}`);
    }
    expect(ok).toBe(true);
  });

  it("expands all top-level placeholders from cv/<key>.json parts", () => {
    const cv = loadCv() as Record<string, unknown>;
    for (const [key, value] of Object.entries(cv)) {
      expect(value, `${key} should not still be the "{...}" sentinel`).not.toBe(
        "{...}",
      );
    }
  });
});

describe("Generated artifact schemas", () => {
  it("validates src/data/timeline.json (if present) against timeline.schema.json", () => {
    const path = resolve(repoRoot, "src", "data", "timeline.json");
    let raw: string;
    try {
      raw = readFileSync(path, "utf8");
    } catch {
      // Generated artifact — skip if it hasn't been built yet.
      return;
    }
    const validate = compile(loadSchema("timeline.schema.json"));
    const ok = validate(JSON.parse(raw));
    if (!ok) {
      const message = (validate.errors ?? [])
        .map((e) => `${e.instancePath || "/"} ${e.message}`)
        .join("\n");
      throw new Error(`timeline.json failed schema validation:\n${message}`);
    }
    expect(ok).toBe(true);
  });

  it("validates src/data/print.json (if present) against print.schema.json", () => {
    const path = resolve(repoRoot, "src", "data", "print.json");
    let raw: string;
    try {
      raw = readFileSync(path, "utf8");
    } catch {
      return;
    }
    const validate = compile(loadSchema("print.schema.json"));
    const ok = validate(JSON.parse(raw));
    if (!ok) {
      const message = (validate.errors ?? [])
        .map((e) => `${e.instancePath || "/"} ${e.message}`)
        .join("\n");
      throw new Error(`print.json failed schema validation:\n${message}`);
    }
    expect(ok).toBe(true);
  });
});
