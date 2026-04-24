#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const cvPath = resolve(here, "..", "src", "data", "cv.json");
const cv = JSON.parse(readFileSync(cvPath, "utf8"));

const known = new Set(cv.skills.flatMap((group) => group.items));
const errors = [];

function check(path, tags) {
  if (!Array.isArray(tags)) return;
  for (const tag of tags) {
    if (!known.has(tag)) errors.push(`${path}: unknown skill "${tag}"`);
  }
}

const companies = new Map(cv.companies.map((c) => [c.id, c]));
function requireCompany(path, id) {
  if (!companies.has(id)) {
    errors.push(`${path}: unknown company id "${id}"`);
    return `<unknown:${id}>`;
  }
  return companies.get(id).name;
}

cv.projects.forEach((p, i) => check(`projects[${i}] (${p.name})`, p.skills));
cv.experience.forEach((e, i) => {
  const companyLabel = requireCompany(
    `experience[${i}].companyId`,
    e.companyId,
  );
  check(`experience[${i}] (${companyLabel})`, e.skills);
  (e.assignments ?? []).forEach((a, j) => {
    const clientLabel = requireCompany(
      `experience[${i}].assignments[${j}].clientId`,
      a.clientId,
    );
    check(`experience[${i}].assignments[${j}] (${clientLabel})`, a.skills);
  });
});
(cv.education ?? []).forEach((ed, i) =>
  check(`education[${i}] (${ed.institution})`, ed.skills),
);

if (errors.length) {
  console.error("CV validation failed:");
  for (const e of errors) console.error(`  - ${e}`);
  console.error(
    `\nEvery skill tag must appear in one of the skills.* buckets in cv.json,` +
      `\nand every companyId/clientId must reference an entry in companies[].`,
  );
  process.exit(1);
}

console.log(
  `CV validation passed (${known.size} known skills, ${companies.size} companies, all references resolved).`,
);
