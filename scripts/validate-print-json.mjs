#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..");
const generator = resolve(here, "generate-print.mjs");
const schema = resolve(repoRoot, "schemas", "print.schema.json");

const tmpDir = mkdtempSync(join(tmpdir(), "print-validate-"));
const outPath = join(tmpDir, "print.json");

try {
  const gen = spawnSync(process.execPath, [generator, `--out=${outPath}`], {
    stdio: ["ignore", "pipe", "inherit"],
    cwd: repoRoot,
  });
  if (gen.status !== 0) {
    console.error("Print generator failed.");
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
    console.error("Print JSON schema validation failed.");
    process.exit(validate.status ?? 1);
  }

  console.log("Print JSON validation passed.");
} finally {
  rmSync(tmpDir, { recursive: true, force: true });
}
