#!/usr/bin/env node
// Ensure the generated data files in src/data/ exist. If any are missing
// (e.g. fresh checkout / fresh `npm ci`), run the full generate:data
// pipeline. When all files are present, exit silently — this lets
// commands that only need the files to *exist* (lint, typecheck) skip
// the GitHub API fan-out that generate:data triggers.
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const dataDir = resolve(here, "..", "src", "data");

const required = [
  "github-activity.json",
  "project-stats.json",
  "timeline.json",
  "print.json",
  "search-index.json",
];

const missing = required.filter((f) => !existsSync(resolve(dataDir, f)));
if (missing.length === 0) {
  process.exit(0);
}

console.log(
  `ensure-generated-data: missing ${missing.join(", ")} — running generate:data.`,
);
const result = spawnSync(
  process.platform === "win32" ? "npm.cmd" : "npm",
  ["run", "generate:data"],
  { stdio: "inherit" },
);
process.exit(result.status ?? 1);
