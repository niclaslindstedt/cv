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

// How much each kind of usage counts. Real paid work weighs the most; focus
// areas signal "this is what I'm leaning into right now"; side projects are
// real but smaller in scope; courses are exposure, not mastery.
const SOURCE_WEIGHTS = {
  experience: 1.0,
  assignment: 1.0,
  project: 0.6,
  focus: 1.0,
  education: 0.15,
};

// Focus areas are a stance, not a headcount. A "since: 2016" focus shouldn't
// outweigh a decade of real jobs — cap the months it contributes.
const FOCUS_MONTHS_CAP = 24;

// Side projects don't carry dates, so we model them as recent, light-FTE work.
const PROJECT_ASSUMED_MONTHS = 12;
const PROJECT_ASSUMED_FTE = 0.35;

// Recency curve — knowledge depreciates, but slowly.
function recencyFactor(monthsAgo) {
  if (monthsAgo <= 12) return 1.0;
  if (monthsAgo <= 36) return 0.8;
  if (monthsAgo <= 60) return 0.55;
  if (monthsAgo <= 120) return 0.3;
  return 0.15;
}

// 0–10 rating curve. sqrt compresses the top so the leaderboard isn't all
// 9s and 10s, and so a single dominant skill doesn't crater everyone else.
function rate(effective, max) {
  if (max <= 0) return 0;
  const ratio = Math.min(1, effective / max);
  return Math.round(10 * Math.sqrt(ratio) * 10) / 10;
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

function normalizeStackEntry(entry) {
  if (typeof entry === "string") return { name: entry, unused: false };
  return { name: entry.name, unused: !!entry.unused };
}

function collectSkills(node) {
  const stack = (node.stack ?? []).map(normalizeStackEntry);
  const skills = (node.skills ?? []).map((s) => ({ name: s, unused: false }));
  return [...stack, ...skills].filter((s) => !s.unused);
}

function pushUsage(usages, skill, source, sourceType, months, fte, weight, recency) {
  usages.push({
    skill,
    source,
    sourceType,
    months,
    fte,
    weight,
    recency,
    contribution: months * fte * weight * recency,
  });
}

// ---------------------------------------------------------------------------
// Main.
// ---------------------------------------------------------------------------

const cv = loadCv();

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
      );
    }
  }
}

// Projects — undated; treat as recent and light-FTE.
for (const project of cv.projects) {
  for (const s of collectSkills(project)) {
    pushUsage(
      usages,
      s.name,
      `project:${project.name}`,
      "project",
      PROJECT_ASSUMED_MONTHS,
      PROJECT_ASSUMED_FTE,
      SOURCE_WEIGHTS.project,
      1.0,
    );
  }
}

// Focus areas — current expertise; dated by `since`, ongoing today.
for (const focus of cv.focus) {
  const rawMonths = monthsBetween(focus.since, null);
  const months = Math.min(rawMonths, FOCUS_MONTHS_CAP);
  for (const skill of focus.skills ?? []) {
    pushUsage(
      usages,
      skill,
      `focus:${focus.area.en}`,
      "focus",
      months,
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

// Anchor the 10/10 to the strongest skill.
const maxEffective = Math.max(0, ...[...scoresMap.values()].map((s) => s.effective));

const rated = [...scoresMap.entries()]
  .map(([name, slot]) => ({
    name,
    rating: rate(slot.effective, maxEffective),
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
    if (!usedNames.has(item)) orphanSkills.push({ name: item, category: cat.label.en });
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

const categories = [...categoryAgg.values()].map((c) => {
  const sorted = [...c.skills].sort((a, b) => b.rating - a.rating);
  const top3 = sorted.slice(0, 3).map((s) => s.rating);
  const avgTop3 = top3.length ? top3.reduce((a, b) => a + b, 0) / top3.length : 0;
  return {
    key: c.key,
    label: c.label,
    rating: Math.round(avgTop3 * 10) / 10,
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

// Pick a flavour "class" from the strongest categories.
function pickClass(cats) {
  const top = cats.slice(0, 2).map((c) => c.key);
  if (top.includes("ai")) {
    if (top.includes("languages")) return "AI Systems Engineer";
    if (top.includes("practices")) return "AI Architect";
    if (top.includes("leadership")) return "AI Tech Lead";
    return "AI Engineer";
  }
  if (top.includes("practices") && top.includes("leadership")) return "Architect / Tech Lead";
  if (top.includes("languages") && top.includes("frameworks")) return "Full-Stack Developer";
  if (top.includes("cloud") && top.includes("devops")) return "Cloud / Platform Engineer";
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
        skills: rated.map(({ usages, ...rest }) => (DEBUG ? { ...rest, usages } : rest)),
        orphanSkills,
        config: { SOURCE_WEIGHTS, PROJECT_ASSUMED_MONTHS, PROJECT_ASSUMED_FTE, today: TODAY.toISOString().slice(0, 10) },
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
console.log("  CATEGORY STATS  (avg of top 3 skills in category)");
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
    console.log(`    ${s.name.padEnd(24)} ${bar(s.rating)} ${s.rating.toFixed(1)}`);
  }
}

if (orphanSkills.length) {
  console.log();
  console.log(line());
  console.log("  DECLARED BUT UNATTRIBUTED  (in skills.json, not on any role/project/focus)");
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
