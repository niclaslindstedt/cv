#!/usr/bin/env node
// Skill rating calculator — character-sheet style.
//
// Reads the assembled CV, computes a 0–10 rating for every skill from the
// experience, project, focus, and education data, then groups skills into
// category stats and highlights specialties. Output is printed to stdout.
//
// Run:  node scripts/skill-rating.mjs
//       node scripts/skill-rating.mjs --json     # raw JSON
//       node scripts/skill-rating.mjs --debug    # show contributing usages
//       node scripts/skill-rating.mjs --top=20   # change leaderboard length

import { existsSync, readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { loadCv } from "../src/data/load-cv.mjs";

const ARGS = new Set(process.argv.slice(2));
const JSON_OUT = ARGS.has("--json");
const DEBUG = ARGS.has("--debug");
const TOP_ARG = [...ARGS].find((a) => a.startsWith("--top="));
const TOP_N = TOP_ARG ? Number(TOP_ARG.split("=")[1]) : 15;

const TODAY = new Date("2026-05-03");

// ---------------------------------------------------------------------------
// Weights — knobs to tune.
// ---------------------------------------------------------------------------

// How much each kind of usage counts. Real paid work and current focus
// areas weigh the same — both say "this is what I do". Side projects are
// real but lighter in scope; courses are exposure, not mastery.
const SOURCE_WEIGHTS = {
  experience: 1.0,
  assignment: 1.0,
  project: 0.6,
  focus: 1.0,
  education: 0.15,
};

// A single job stops dominating after two effective years. Beyond that
// you're not getting more skilled at TypeScript, you're just doing more
// TypeScript.
const SOURCE_MONTHS_CAP = 24;

// Each current focus area says "I'm investing in this now" with equal
// voice, regardless of how long it's been a focus. Stops a 2016 focus
// area from outweighing a 2025 focus area on duration alone.
const FOCUS_FLAT_MONTHS = 24;

// Side-project effort is read from commit counts in project-stats.json
// (the data-cache branch). Calibration: a top contributor at real work
// produces 50–100 commits/week ≈ 200–430/month. Anchoring 1 effective
// month at 100 commits treats the user as a "solid steady output"
// contributor — generous enough to credit serious side work, strict
// enough that drive-by repos don't masquerade as years of experience.
const COMMITS_PER_EFFECTIVE_MONTH = 100;

// Fallback used only if a project has no github stats at all (e.g. a
// non-GitHub repo). Keeps the project from disappearing from the sheet.
const PROJECT_NO_STATS_MONTHS = 3;

// Identity adjustments. Niclas leads technically — he does, people follow —
// so the soft people-management skills shouldn't compound to the top of the
// sheet just because they appear on every senior role.
const SKILL_MULTIPLIERS = {
  Mentoring: 0.7,
  Leadership: 0.7,
  "Project management": 0.6,
};

// Recency curve — knowledge depreciates, but slowly.
function recencyFactor(monthsAgo) {
  if (monthsAgo <= 12) return 1.0;
  if (monthsAgo <= 36) return 0.8;
  if (monthsAgo <= 60) return 0.55;
  if (monthsAgo <= 120) return 0.3;
  return 0.15;
}

// 0–10 rating from absolute effective months. Piecewise so the user's
// verbal scale lands where the user puts it:
//   1  horrible           (5 effective months ≈ rating 3)
//   3  pretty bad         (15 ≈ 5)
//   5  could handle it    (40 ≈ 7)
//   7  good               (80 ≈ 9)
//   9  very good          (130+ ≈ 10)
//   10 perfect
// Anchored at boundaries so the function is continuous.
function rate(effective) {
  if (effective <= 0) return 0;
  let r;
  if (effective < 5) r = effective * 0.6;
  else if (effective < 15) r = 3 + (effective - 5) * 0.2;
  else if (effective < 40) r = 5 + (effective - 15) * 0.08;
  else if (effective < 80) r = 7 + (effective - 40) * 0.05;
  else r = Math.min(10, 9 + (effective - 80) * 0.02);
  return Math.round(r * 10) / 10;
}

// ---------------------------------------------------------------------------
// Date helpers.
// ---------------------------------------------------------------------------

function parseYm(ym) {
  if (!ym) return null;
  return new Date(`${ym}-01T00:00:00Z`);
}

function monthsBetween(startYm, endYm) {
  const s = parseYm(startYm);
  if (!s) return 0;
  const e = endYm ? parseYm(endYm) : TODAY;
  const months =
    (e.getUTCFullYear() - s.getUTCFullYear()) * 12 +
    (e.getUTCMonth() - s.getUTCMonth());
  return Math.max(months, 1);
}

function monthsSince(endYm) {
  if (!endYm) return 0; // ongoing — fully recent
  const d = parseYm(endYm);
  const months =
    (TODAY.getUTCFullYear() - d.getUTCFullYear()) * 12 +
    (TODAY.getUTCMonth() - d.getUTCMonth());
  return Math.max(0, months);
}

// ---------------------------------------------------------------------------
// Skill extraction.
// ---------------------------------------------------------------------------

// Normalise a stack-or-skills entry. Both arrays accept either a bare
// string ("TypeScript") or an object form ({ name, unused?, ratio? }).
// `ratio` (default 1.0, range 0–1) lets the user say "I only used this
// part of the time" — e.g. RAG at BookBeat is real but a few-months
// slice of a 24-month role, not the whole thing. Set ratio: 0.2 there
// and the contribution scales accordingly.
function normalizeSkillEntry(entry) {
  if (typeof entry === "string") {
    return { name: entry, unused: false, ratio: 1.0 };
  }
  const ratio = typeof entry.ratio === "number" ? entry.ratio : 1.0;
  return {
    name: entry.name,
    unused: !!entry.unused,
    ratio: Math.max(0, Math.min(1, ratio)),
  };
}

function collectSkills(node) {
  const stack = (node.stack ?? []).map(normalizeSkillEntry);
  const skills = (node.skills ?? []).map(normalizeSkillEntry);
  return [...stack, ...skills].filter((s) => !s.unused);
}

function pushUsage(
  usages,
  skill,
  source,
  sourceType,
  months,
  fte,
  weight,
  recency,
  ratio = 1.0,
) {
  const cappedMonths = Math.min(months, SOURCE_MONTHS_CAP);
  const skillMult = SKILL_MULTIPLIERS[skill] ?? 1.0;
  usages.push({
    skill,
    source,
    sourceType,
    months: cappedMonths,
    fte,
    weight,
    recency,
    skillMult,
    ratio,
    contribution: cappedMonths * fte * weight * recency * skillMult * ratio,
  });
}

// ---------------------------------------------------------------------------
// Main.
// ---------------------------------------------------------------------------

// Project stats come from src/data/project-stats.json when present (CI
// restores it from the data-cache branch before build); otherwise fall
// back to reading the cache branch directly via git.
function loadProjectStats() {
  const here = dirname(fileURLToPath(import.meta.url));
  const localPath = join(here, "..", "src", "data", "project-stats.json");
  if (existsSync(localPath)) {
    try {
      const parsed = JSON.parse(readFileSync(localPath, "utf8"));
      // The committed stub has enabled=false and an empty projects map;
      // ignore it and fall through to the data-cache branch.
      if (parsed?.projects && Object.keys(parsed.projects).length > 0) {
        return parsed;
      }
    } catch {
      // fall through
    }
  }
  for (const ref of ["origin/data-cache", "data-cache"]) {
    try {
      const out = execSync(`git show ${ref}:src/data/project-stats.json`, {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      });
      const parsed = JSON.parse(out);
      if (parsed?.projects && Object.keys(parsed.projects).length > 0) {
        return parsed;
      }
    } catch {
      // try next
    }
  }
  return null;
}

function statsForProject(project, projectStats) {
  const repos = project.github ?? [];
  let totalCommits = 0;
  let lastCommitDate = null;
  for (const r of repos) {
    const key = `${r.owner}/${r.repo}`;
    const s = projectStats?.projects?.[key];
    if (!s) continue;
    totalCommits += s.totalCommits ?? 0;
    if (
      s.lastCommitDate &&
      (!lastCommitDate || s.lastCommitDate > lastCommitDate)
    ) {
      lastCommitDate = s.lastCommitDate;
    }
  }
  return { totalCommits, lastCommitDate };
}

const cv = loadCv();
const projectStats = loadProjectStats();

const skillToCategory = {};
for (const cat of cv.skills) {
  for (const item of cat.items) {
    skillToCategory[item] = { key: cat.key, label: cat.label.en };
  }
}

const usages = [];

// Experience + assignments.
for (const exp of cv.experience) {
  const months = monthsBetween(exp.startDate, exp.endDate);
  const fte = exp.fte ?? 1.0;
  const recency = recencyFactor(monthsSince(exp.endDate));
  for (const s of collectSkills(exp)) {
    pushUsage(
      usages,
      s.name,
      `experience:${exp.companyId}`,
      "experience",
      months,
      fte,
      SOURCE_WEIGHTS.experience,
      recency,
      s.ratio,
    );
  }
  for (const a of exp.assignments ?? []) {
    const aMonths = monthsBetween(a.startDate, a.endDate);
    const aFte = a.fte ?? exp.fte ?? 1.0;
    const aRecency = recencyFactor(monthsSince(a.endDate));
    for (const s of collectSkills(a)) {
      pushUsage(
        usages,
        s.name,
        `assignment:${a.clientId}`,
        "assignment",
        aMonths,
        aFte,
        SOURCE_WEIGHTS.assignment,
        aRecency,
        s.ratio,
      );
    }
  }
}

// Projects — duration and recency from commit stats. Each effective
// month equals COMMITS_PER_EFFECTIVE_MONTH commits, so swarm's 2200+
// commits weigh more than ztf's 9.
for (const project of cv.projects) {
  const { totalCommits, lastCommitDate } = statsForProject(
    project,
    projectStats,
  );
  const months =
    totalCommits > 0
      ? totalCommits / COMMITS_PER_EFFECTIVE_MONTH
      : PROJECT_NO_STATS_MONTHS;
  const recency = lastCommitDate
    ? recencyFactor(monthsSince(lastCommitDate.slice(0, 7)))
    : 1.0;
  const tag = totalCommits > 0 ? `${totalCommits}c` : "no-stats";
  for (const s of collectSkills(project)) {
    pushUsage(
      usages,
      s.name,
      `project:${project.name} (${tag})`,
      "project",
      months,
      1.0,
      SOURCE_WEIGHTS.project,
      recency,
      s.ratio,
    );
  }
}

// Focus areas — flat-weighted: each current focus says "I'm investing in
// this now" with equal voice, regardless of when it started. Focus
// skills are plain strings (no ratio) by schema — focus is stance, not
// time allocation.
for (const focus of cv.focus) {
  for (const skill of focus.skills ?? []) {
    pushUsage(
      usages,
      skill,
      `focus:${focus.area.en}`,
      "focus",
      FOCUS_FLAT_MONTHS,
      1.0,
      SOURCE_WEIGHTS.focus,
      1.0,
    );
  }
}

// Aggregate.
const scoresMap = new Map();
for (const u of usages) {
  if (!scoresMap.has(u.skill)) {
    scoresMap.set(u.skill, { effective: 0, usages: [] });
  }
  const slot = scoresMap.get(u.skill);
  slot.effective += u.contribution;
  slot.usages.push(u);
}

const rated = [...scoresMap.entries()]
  .map(([name, slot]) => ({
    name,
    rating: rate(slot.effective),
    effective: Math.round(slot.effective * 10) / 10,
    category: skillToCategory[name]?.label ?? "Other",
    categoryKey: skillToCategory[name]?.key ?? "other",
    usages: slot.usages,
  }))
  .sort((a, b) => b.rating - a.rating || b.effective - a.effective);

// Skills declared but never used in any source.
const usedNames = new Set(rated.map((r) => r.name));
const orphanSkills = [];
for (const cat of cv.skills) {
  for (const item of cat.items) {
    if (!usedNames.has(item))
      orphanSkills.push({ name: item, category: cat.label.en });
  }
}

// Category stats — the "ability scores".
const categoryAgg = new Map();
for (const r of rated) {
  if (!categoryAgg.has(r.categoryKey)) {
    categoryAgg.set(r.categoryKey, {
      key: r.categoryKey,
      label: r.category,
      skills: [],
    });
  }
  categoryAgg.get(r.categoryKey).skills.push(r);
}

// Category headline weights — top skill counts twice as much as #2, which
// counts twice as much as #3. You get hired for the spike, not the
// average; the rating should reflect that specialties dominate.
const CATEGORY_WEIGHTS = [4, 2, 1];

const categories = [...categoryAgg.values()].map((c) => {
  const sorted = [...c.skills].sort((a, b) => b.rating - a.rating);
  // Average the strongest skills, but only count ones above "pretty bad".
  // A passing-mention tool (Azure DevOps for one assignment, Svelte on
  // one project) shouldn't drag down a domain the engineer is competent in.
  const meaningful = sorted.filter((s) => s.rating >= 3).slice(0, 3);
  const sample = meaningful.length ? meaningful : sorted.slice(0, 1);
  const w = CATEGORY_WEIGHTS.slice(0, sample.length);
  const wSum = w.reduce((a, b) => a + b, 0);
  const avg = sample.reduce((acc, s, i) => acc + s.rating * w[i], 0) / wSum;
  return {
    key: c.key,
    label: c.label,
    rating: Math.round(avg * 10) / 10,
    headline: sorted.slice(0, 3),
    bench: sorted.slice(3),
  };
});
categories.sort((a, b) => b.rating - a.rating);

// Specialties = focus areas, ranked by the average rating of their skills.
const specialties = cv.focus.map((f) => {
  const skillRatings = (f.skills ?? []).map((name) => {
    const r = rated.find((x) => x.name === name);
    return { name, rating: r?.rating ?? 0 };
  });
  const avg = skillRatings.length
    ? skillRatings.reduce((a, b) => a + b.rating, 0) / skillRatings.length
    : 0;
  return {
    area: f.area.en,
    since: f.since,
    rating: Math.round(avg * 10) / 10,
    skills: skillRatings,
  };
});
specialties.sort((a, b) => b.rating - a.rating);

// Pick a flavour "class" from the strongest categories. The picker reads
// the same signal a recruiter would: which two stat lines lead, and what
// kind of engineer that combination describes.
function pickClass(cats) {
  const top = cats.slice(0, 3).map((c) => c.key);
  const has = (k) => top.includes(k);

  if (has("ai") && has("practices")) return "AI Architect";
  if (has("ai") && has("compliance")) return "AI Security Architect";
  if (has("ai") && has("devops")) return "AI Platform Engineer";
  if (has("ai") && has("languages")) return "AI Systems Engineer";
  if (has("ai")) return "AI Engineer";
  if (has("practices") && has("compliance")) return "Security Architect";
  if (has("practices") && has("devops")) return "Platform Architect";
  if (has("practices") && has("languages")) return "Backend Architect";
  if (has("devops") && has("compliance")) return "Security / Platform Engineer";
  if (has("languages") && has("frameworks")) return "Full-Stack Developer";
  if (has("cloud") && has("devops")) return "Cloud / Platform Engineer";
  return "Software Engineer";
}

const characterClass = pickClass(categories);

// ---------------------------------------------------------------------------
// Output.
// ---------------------------------------------------------------------------

if (JSON_OUT) {
  console.log(
    JSON.stringify(
      {
        class: characterClass,
        categories,
        specialties,
        skills: rated.map(({ usages, ...rest }) =>
          DEBUG ? { ...rest, usages } : rest,
        ),
        orphanSkills,
        config: {
          SOURCE_WEIGHTS,
          SOURCE_MONTHS_CAP,
          FOCUS_FLAT_MONTHS,
          COMMITS_PER_EFFECTIVE_MONTH,
          PROJECT_NO_STATS_MONTHS,
          SKILL_MULTIPLIERS,
          today: TODAY.toISOString().slice(0, 10),
        },
      },
      null,
      2,
    ),
  );
  process.exit(0);
}

const bar = (rating) => {
  const filled = Math.round(rating);
  return "█".repeat(filled) + "░".repeat(10 - filled);
};

const line = (n = 72) => "─".repeat(n);

console.log();
console.log(`  ${cv.name} — Character Sheet`);
console.log(`  Class: ${characterClass}`);
console.log(`  As of: ${TODAY.toISOString().slice(0, 10)}`);
console.log();
console.log(line());
console.log("  CATEGORY STATS  (weighted top 3, spike counts most)");
console.log(line());
for (const c of categories) {
  console.log(
    `  ${c.label.padEnd(14)} ${bar(c.rating)} ${c.rating.toFixed(1).padStart(4)}   ` +
      c.headline.map((s) => `${s.name} ${s.rating}`).join(", "),
  );
}

console.log();
console.log(line());
console.log("  SPECIALTIES  (focus areas, avg rating of their skills)");
console.log(line());
for (const s of specialties) {
  console.log(
    `  ${s.area.padEnd(28)} ${bar(s.rating)} ${s.rating.toFixed(1).padStart(4)}   since ${s.since}`,
  );
  for (const sk of s.skills) {
    console.log(`    · ${sk.name.padEnd(24)} ${sk.rating.toFixed(1)}`);
  }
}

console.log();
console.log(line());
console.log(`  TOP ${TOP_N} SKILLS`);
console.log(line());
for (const r of rated.slice(0, TOP_N)) {
  console.log(
    `  ${r.name.padEnd(24)} ${bar(r.rating)} ${r.rating.toFixed(1).padStart(4)}   ` +
      `${r.category.padEnd(14)} (eff ${r.effective})`,
  );
}

console.log();
console.log(line());
console.log("  ALL SKILLS BY CATEGORY");
console.log(line());
for (const c of categories) {
  console.log();
  console.log(`  ${c.label} — ${c.rating.toFixed(1)}`);
  for (const s of [...c.headline, ...c.bench]) {
    console.log(
      `    ${s.name.padEnd(24)} ${bar(s.rating)} ${s.rating.toFixed(1)}`,
    );
  }
}

if (orphanSkills.length) {
  console.log();
  console.log(line());
  console.log(
    "  DECLARED BUT UNATTRIBUTED  (in skills.json, not on any role/project/focus)",
  );
  console.log(line());
  for (const o of orphanSkills) {
    console.log(`    ${o.name.padEnd(24)} ${o.category}`);
  }
}

if (DEBUG) {
  console.log();
  console.log(line());
  console.log("  DEBUG: top 10 skills, contributing usages");
  console.log(line());
  for (const r of rated.slice(0, 10)) {
    console.log();
    console.log(`  ${r.name}  (rating ${r.rating}, effective ${r.effective})`);
    for (const u of r.usages.sort((a, b) => b.contribution - a.contribution)) {
      console.log(
        `    ${u.source.padEnd(36)} ${u.sourceType.padEnd(10)} ` +
          `m=${u.months} fte=${u.fte} w=${u.weight} rec=${u.recency.toFixed(2)} ` +
          `→ ${u.contribution.toFixed(1)}`,
      );
    }
  }
}

console.log();
