// Assembles src/data/cv.json from its split category parts.
//
// The committed src/data/cv.json is a skeleton: top-level keys whose
// value is the literal sentinel "{...}" are expanded by reading the
// matching part file from src/data/cv/<key>.json.
//
// All consumers (Vite, scripts, validation) go through this loader so
// the on-disk shape is the same in every context.

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const PLACEHOLDER = "{...}";

const here = dirname(fileURLToPath(import.meta.url));
const DEFAULT_ROOT = join(here, "cv.json");

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
  return { cv, parts };
}

export function loadCv(rootPath = DEFAULT_ROOT) {
  return loadCvWithParts(rootPath).cv;
}

export const CV_PLACEHOLDER = PLACEHOLDER;
