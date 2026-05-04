// Emits dist/cv.json after `vite build`. The on-disk src/data/cv.json is a
// skeleton of "{...}" placeholders pointing at src/data/cv/*.json — agents
// shouldn't have to know that. This writes the fully assembled CV so the
// deployed site exposes a single JSON document that mirrors what the React
// app consumes, discoverable via robots.txt, sitemap.xml, and a
// <link rel="alternate" type="application/json"> in <head>.
//
// Local overrides (CV_LOCAL=1) are respected so `make local` produces a
// dist/cv.json that matches the locally-rendered site and the local PDF.
// The public deploy never sets CV_LOCAL, so private content stays out.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadCv } from "../src/data/load-cv.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const distDir = path.join(ROOT, "dist");
if (!fs.existsSync(distDir)) {
  console.error(
    "dist/ does not exist — run `vite build` before generate-cv-json.",
  );
  process.exit(1);
}

const cv = loadCv();
// Strip the IDE-only $schema pointer; the deployed file shouldn't claim a
// path that only exists in the source tree.
delete cv.$schema;

const outPath = path.join(distDir, "cv.json");
fs.writeFileSync(outPath, `${JSON.stringify(cv, null, 2)}\n`);
console.log(`Wrote ${path.relative(ROOT, outPath)}.`);
