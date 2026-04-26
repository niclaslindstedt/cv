#!/usr/bin/env node
// Validates the assembled CV (src/data/cv.json + src/data/cv/*.json) against
// schemas/cv.schema.json. Replaces the previous ajv-cli invocation since the
// committed cv.json is a skeleton with "{...}" placeholders that need expanding
// before the schema can pass.

import { readFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

import { loadCv } from "../src/data/load-cv.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "..");
const schemaPath = resolve(repoRoot, "schemas", "cv.schema.json");

const schema = JSON.parse(readFileSync(schemaPath, "utf8"));

const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);
const validate = ajv.compile(schema);

const cv = loadCv();
if (validate(cv)) {
  console.log(
    `CV validation passed (${relative(repoRoot, schemaPath)}, assembled from src/data/cv.json + src/data/cv/*.json).`,
  );
  process.exit(0);
}

console.error("CV validation failed:");
for (const err of validate.errors ?? []) {
  const path = err.instancePath || "/";
  const extra = err.params ? ` ${JSON.stringify(err.params)}` : "";
  console.error(`  ${path} ${err.message}${extra}`);
}
process.exit(1);
