import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { loadCvWithParts } from "../../src/data/load-cv.mjs";

let tmp: string;

function write(relative: string, value: unknown): string {
  const path = join(tmp, relative);
  mkdirSync(join(path, ".."), { recursive: true });
  writeFileSync(path, JSON.stringify(value));
  return path;
}

beforeEach(() => {
  tmp = mkdtempSync(join(tmpdir(), "load-cv-"));
});

afterEach(() => {
  rmSync(tmp, { recursive: true, force: true });
  delete process.env.CV_LOCAL;
});

describe("loadCvWithParts placeholder expansion", () => {
  it("replaces top-level '{...}' sentinels with the matching cv/<key>.json", () => {
    const root = write("cv.json", {
      name: "Test",
      focus: "{...}",
      projects: "{...}",
    });
    write("cv/focus.json", [{ id: "f1" }]);
    write("cv/projects.json", [{ id: "p1" }]);

    const { cv, parts } = loadCvWithParts(root);

    expect(cv.name).toBe("Test");
    expect(cv.focus).toEqual([{ id: "f1" }]);
    expect(cv.projects).toEqual([{ id: "p1" }]);
    expect(parts).toHaveLength(2);
  });

  it("leaves non-sentinel top-level values untouched", () => {
    const root = write("cv.json", {
      name: "Test",
      meta: { siteUrl: "https://example.com" },
      focus: "{...}",
    });
    write("cv/focus.json", []);

    const { cv } = loadCvWithParts(root);

    expect(cv.meta).toEqual({ siteUrl: "https://example.com" });
  });
});

describe("loadCvWithParts local override deep merge", () => {
  it("ignores cv.local.json when CV_LOCAL is unset", () => {
    const root = write("cv.json", { name: "Public", focus: "{...}" });
    write("cv/focus.json", []);
    write("cv.local.json", { name: "Private" });

    const { cv, overridePath } = loadCvWithParts(root);

    expect(cv.name).toBe("Public");
    expect(overridePath).toBeNull();
  });

  it("applies cv.local.json when CV_LOCAL=1", () => {
    process.env.CV_LOCAL = "1";
    const root = write("cv.json", { name: "Public", focus: "{...}" });
    write("cv/focus.json", []);
    write("cv.local.json", { name: "Private" });

    const { cv, overridePath } = loadCvWithParts(root);

    expect(cv.name).toBe("Private");
    expect(overridePath).toMatch(/cv\.local\.json$/);
  });

  it("treats CV_LOCAL=0 and CV_LOCAL=false as disabled", () => {
    for (const flag of ["0", "false", "False"]) {
      process.env.CV_LOCAL = flag;
      const root = write(`cv-${flag}.json`, { name: "Public", focus: "{...}" });
      write("cv/focus.json", []);
      write(`cv-${flag}.local.json`, { name: "Private" });

      const { cv } = loadCvWithParts(root);
      expect(cv.name, `flag=${flag}`).toBe("Public");
    }
  });

  it("merges plain objects key-by-key, override winning", () => {
    process.env.CV_LOCAL = "1";
    const root = write("cv.json", {
      contact: { email: "public@x", phone: null, country: "SE" },
      focus: "{...}",
    });
    write("cv/focus.json", []);
    write("cv.local.json", {
      contact: { email: "private@x", phone: "+46" },
    });

    const { cv } = loadCvWithParts(root);

    expect(cv.contact).toEqual({
      email: "private@x",
      phone: "+46",
      country: "SE",
    });
  });

  it("merges arrays element-by-element, with null preserving the base entry", () => {
    process.env.CV_LOCAL = "1";
    const root = write("cv.json", {
      experience: [{ id: "a" }, { id: "b" }, { id: "c" }],
      focus: "{...}",
    });
    write("cv/focus.json", []);
    write("cv.local.json", {
      experience: [{ extra: 1 }, null, { id: "c-override" }, { id: "d" }],
    });

    const { cv } = loadCvWithParts(root);

    expect(cv.experience).toEqual([
      { id: "a", extra: 1 },
      { id: "b" },
      { id: "c-override" },
      { id: "d" },
    ]);
  });

  it("scalar override replaces base scalar", () => {
    process.env.CV_LOCAL = "1";
    const root = write("cv.json", { name: "Old", focus: "{...}" });
    write("cv/focus.json", []);
    write("cv.local.json", { name: "New" });

    const { cv } = loadCvWithParts(root);

    expect(cv.name).toBe("New");
  });

  it("does nothing when CV_LOCAL=1 but no override file exists", () => {
    process.env.CV_LOCAL = "1";
    const root = write("cv.json", { name: "Public", focus: "{...}" });
    write("cv/focus.json", []);

    const { cv, overridePath } = loadCvWithParts(root);

    expect(cv.name).toBe("Public");
    expect(overridePath).toBeNull();
  });
});
