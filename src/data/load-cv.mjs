// Assembles src/data/cv.json from its split category parts.
//
// The committed src/data/cv.json is a skeleton: top-level keys whose
// value is the literal sentinel "{...}" are expanded by reading the
// matching part file from src/data/cv/<key>.json.
//
// All consumers (Vite, scripts, validation) go through this loader so
// the on-disk shape is the same in every context.
//
// Local overrides:
//   When the env var CV_LOCAL=1 is set, an optional gitignored override
//   file at src/data/cv.local.json is deep-merged into the assembled
//   CV. This lets a user generate PDFs that contain sensitive info
//   (email, phone, fuller job descriptions, …) without committing any
//   of it. Merge rules:
//     * Plain objects merge key-by-key; override values win.
//     * Arrays merge element-by-element by index; null in the override
//       preserves the base entry, missing tail entries leave the base
//       intact, extra override entries are appended.
//     * Scalars in the override replace the base.

import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const PLACEHOLDER = "{...}";

const here = dirname(fileURLToPath(import.meta.url));
const DEFAULT_ROOT = join(here, "cv.json");
const LOCAL_OVERRIDE_FILENAME = "cv.local.json";

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function deepMerge(base, override) {
  if (override === undefined) return base;
  if (Array.isArray(base) && Array.isArray(override)) {
    const result = base.slice();
    for (let i = 0; i < override.length; i++) {
      const item = override[i];
      if (item === null || item === undefined) continue;
      if (i < result.length) {
        result[i] = deepMerge(result[i], item);
      } else {
        result.push(item);
      }
    }
    return result;
  }
  if (isPlainObject(base) && isPlainObject(override)) {
    const result = { ...base };
    for (const [key, value] of Object.entries(override)) {
      if (value === undefined) continue;
      result[key] = key in result ? deepMerge(result[key], value) : value;
    }
    return result;
  }
  return override;
}

function localOverrideEnabled() {
  const flag = process.env.CV_LOCAL;
  if (!flag) return false;
  return flag !== "0" && flag.toLowerCase() !== "false";
}

export function loadCvWithParts(rootPath = DEFAULT_ROOT) {
  const cv = JSON.parse(readFileSync(rootPath, "utf8"));
  const partsDir = join(dirname(rootPath), "cv");
  const parts = [];
  for (const [key, value] of Object.entries(cv)) {
    if (value === PLACEHOLDER) {
      const partPath = join(partsDir, `${key}.json`);
      parts.push(partPath);
      cv[key] = JSON.parse(readFileSync(partPath, "utf8"));
    }
  }
  let merged = cv;
  let overridePath = null;
  if (localOverrideEnabled()) {
    const candidate = join(dirname(rootPath), LOCAL_OVERRIDE_FILENAME);
    if (existsSync(candidate)) {
      const override = JSON.parse(readFileSync(candidate, "utf8"));
      merged = deepMerge(cv, override);
      overridePath = candidate;
    }
  }
  return { cv: merged, parts, overridePath };
}

export function loadCv(rootPath = DEFAULT_ROOT) {
  return loadCvWithParts(rootPath).cv;
}

export const CV_PLACEHOLDER = PLACEHOLDER;
