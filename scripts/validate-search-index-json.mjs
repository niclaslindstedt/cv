#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..");
const generator = resolve(here, "generate-search-index.mjs");
const schema = resolve(repoRoot, "schemas", "search-index.schema.json");

const tmpDir = mkdtempSync(join(tmpdir(), "search-index-validate-"));
const outPath = join(tmpDir, "search-index.json");

try {
  const gen = spawnSync(process.execPath, [generator, `--out=${outPath}`], {
    stdio: ["ignore", "pipe", "inherit"],
    cwd: repoRoot,
  });
  if (gen.status !== 0) {
    console.error("Search index generator failed.");
    process.exit(gen.status ?? 1);
  }

  const validate = spawnSync(
    "npx",
    [
      "ajv",
      "validate",
      "-c",
      "ajv-formats",
      "--spec=draft2020",
      "--strict=false",
      "-s",
      schema,
      "-d",
      outPath,
    ],
    { stdio: "inherit", cwd: repoRoot },
  );
  if (validate.status !== 0) {
    console.error("Search index JSON schema validation failed.");
    process.exit(validate.status ?? 1);
  }

  console.log("Search index JSON validation passed.");
} finally {
  rmSync(tmpDir, { recursive: true, force: true });
}
