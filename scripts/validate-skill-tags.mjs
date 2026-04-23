#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const cvPath = resolve(here, "..", "src", "data", "cv.json");
const cv = JSON.parse(readFileSync(cvPath, "utf8"));

const known = new Set(Object.values(cv.skills).flat());
const errors = [];

function check(path, tags) {
  if (!Array.isArray(tags)) return;
  for (const tag of tags) {
    if (!known.has(tag)) errors.push(`${path}: unknown skill "${tag}"`);
  }
}

cv.projects.forEach((p, i) => check(`projects[${i}] (${p.name})`, p.skills));
cv.experience.forEach((e, i) => {
  check(`experience[${i}] (${e.company})`, e.skills);
  (e.assignments ?? []).forEach((a, j) =>
    check(`experience[${i}].assignments[${j}] (${a.client})`, a.skills),
  );
});
(cv.education ?? []).forEach((ed, i) =>
  check(`education[${i}] (${ed.institution})`, ed.skills),
);

if (errors.length) {
  console.error("Skill-tag validation failed:");
  for (const e of errors) console.error(`  - ${e}`);
  console.error(
    `\nEvery skill tag must appear in one of the skills.* buckets in cv.json.`,
  );
  process.exit(1);
}

console.log(
  `Skill-tag validation passed (${known.size} known skills, all tags resolved).`,
);
