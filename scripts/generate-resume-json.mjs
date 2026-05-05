// Emits dist/resume.json after `vite build`, plus a dist/cv.json alias.
// The on-disk src/data/cv.json is a skeleton of "{...}" placeholders pointing
// at src/data/cv/*.json — agents shouldn't have to know that. This writes the
// fully assembled CV so the deployed site exposes a single JSON document that
// mirrors what the React app consumes, discoverable via robots.txt,
// sitemap.xml, llms.txt, and a <link rel="alternate" type="application/json">
// in <head>.
//
// /cv.json is the same bytes as /resume.json — it covers the path LLMs
// commonly guess when looking for a structured CV.
//
// Per-project commit stats from src/data/project-stats.json (refreshed daily
// by data-refresh.yml) are aggregated across each project's GitHub repos and
// inlined as `projects[].stats` so agents see the same firstCommit /
// lastCommit / totalCommits the rendered site shows. Stats drop out
// gracefully when the cache is disabled or missing.
//
// Local overrides (CV_LOCAL=1) are respected so `make local` produces a
// dist/resume.json that matches the locally-rendered site and the local PDF.
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
    "dist/ does not exist — run `vite build` before generate-resume-json.",
  );
  process.exit(1);
}

const cv = loadCv();
// Strip the IDE-only $schema pointer; the deployed file shouldn't claim a
// path that only exists in the source tree.
delete cv.$schema;

const projectStats = loadProjectStats();
if (projectStats?.enabled && Array.isArray(cv.projects)) {
  cv.projects = cv.projects.map((project) => {
    const stats = aggregateStats(project.github, projectStats);
    return stats ? { ...project, stats } : project;
  });
}

const json = `${JSON.stringify(cv, null, 2)}\n`;
const outPath = path.join(distDir, "resume.json");
fs.writeFileSync(outPath, json);
console.log(`Wrote ${path.relative(ROOT, outPath)}.`);

const aliasPath = path.join(distDir, "cv.json");
fs.writeFileSync(aliasPath, json);
console.log(`Wrote ${path.relative(ROOT, aliasPath)} (alias of resume.json).`);

function loadProjectStats() {
  const statsPath = path.join(ROOT, "src", "data", "project-stats.json");
  if (!fs.existsSync(statsPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(statsPath, "utf8"));
  } catch (err) {
    console.warn(`Could not parse project-stats.json (${err.message}).`);
    return null;
  }
}

function aggregateStats(repos, file) {
  if (!Array.isArray(repos) || repos.length === 0) return undefined;
  const matched = [];
  for (const ref of repos) {
    const stats = file.projects?.[`${ref.owner}/${ref.repo}`];
    if (stats) matched.push(stats);
  }
  if (matched.length === 0) return undefined;
  if (matched.length === 1) return matched[0];

  let firstCommitDate = null;
  let lastCommitDate = null;
  let totalCommits = 0;
  for (const s of matched) {
    if (
      s.firstCommitDate &&
      (!firstCommitDate || s.firstCommitDate < firstCommitDate)
    ) {
      firstCommitDate = s.firstCommitDate;
    }
    if (
      s.lastCommitDate &&
      (!lastCommitDate || s.lastCommitDate > lastCommitDate)
    ) {
      lastCommitDate = s.lastCommitDate;
    }
    totalCommits += s.totalCommits ?? 0;
  }
  return {
    owner: matched[0].owner,
    repo: matched[0].repo,
    username: matched[0].username,
    firstCommitDate,
    lastCommitDate,
    totalCommits,
  };
}
