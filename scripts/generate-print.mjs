#!/usr/bin/env node
// Bakes a print-ready, denormalized CV into src/data/print.json.
//
// PrintView consumes this directly: dates are formatted, role chains
// flattened, company taglines inlined, skills + stack merged. The print
// component then renders simple semantic HTML without depending on the
// screen component tree.

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

import { loadCv } from "../src/data/load-cv.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const defaultOut = resolve(here, "..", "src", "data", "print.json");
const projectStatsPath = resolve(
  here,
  "..",
  "src",
  "data",
  "project-stats.json",
);

const args = process.argv.slice(2);
let outPath = defaultOut;
let toStdout = false;
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--out" && args[i + 1]) {
    outPath = resolve(args[++i]);
  } else if (args[i].startsWith("--out=")) {
    outPath = resolve(args[i].slice("--out=".length));
  } else if (args[i] === "--stdout") {
    toStdout = true;
  } else {
    console.error(`Unknown argument: ${args[i]}`);
    process.exit(2);
  }
}

const MONTHS = {
  en: [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ],
  sv: [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "Maj",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Okt",
    "Nov",
    "Dec",
  ],
};

const PRESENT = { en: "Present", sv: "Pågående" };
const REMOTE = { en: "Remote", sv: "Distans" };

function formatMonth(iso, lang) {
  const [year, month] = iso.split("-");
  const idx = Number(month) - 1;
  return `${MONTHS[lang][idx] ?? ""} ${year}`.trim();
}

function formatRange(start, end) {
  const out = {};
  for (const lang of ["en", "sv"]) {
    const endLabel = end ? formatMonth(end, lang) : PRESENT[lang];
    out[lang] = `${formatMonth(start, lang)} – ${endLabel}`;
  }
  return out;
}

function bothLangs(value) {
  return { en: value, sv: value };
}

function sortRolesAsc(roles) {
  return [...roles].sort((a, b) => a.startDate.localeCompare(b.startDate));
}

function buildRoleHistory(sortedRoles) {
  if (!sortedRoles || sortedRoles.length < 2) return [];
  // Print includes the newest role too: the parent header line shows the
  // company's overall range, so listing every role with its own dates is the
  // only way the timeline reads correctly without the screen's promotion icons.
  return [...sortedRoles].reverse().map((r) => ({
    title: r.title,
    range: formatRange(r.startDate, r.endDate),
  }));
}

function mergeTags(...lists) {
  const seen = new Set();
  const out = [];
  for (const list of lists) {
    for (const item of list ?? []) {
      if (!seen.has(item)) {
        seen.add(item);
        out.push(item);
      }
    }
  }
  return out;
}

function resolveCompany(companies, id) {
  const company = companies.get(id);
  if (!company) {
    throw new Error(`Unknown company id: ${id}`);
  }
  return company;
}

function buildAssignment(assignment, companies) {
  const client = resolveCompany(companies, assignment.clientId);
  const sortedRoles = sortRolesAsc(assignment.roles);
  const newest = sortedRoles[sortedRoles.length - 1];
  const baked = {
    role: newest.title,
    client: client.name,
    range: formatRange(assignment.startDate, assignment.endDate),
    tagline: client.tagline,
    tags: mergeTags(assignment.stack, assignment.skills),
    roleHistory: buildRoleHistory(sortedRoles),
  };
  if (assignment.printDescription)
    baked.description = assignment.printDescription;
  if (assignment.notes) baked.notes = assignment.notes;
  return baked;
}

function buildExperience(item, companies) {
  const company = resolveCompany(companies, item.companyId);
  const sortedRoles = sortRolesAsc(item.roles);
  const newest = sortedRoles[sortedRoles.length - 1];
  const stack = item.stack ?? company.stack ?? [];
  const baked = {
    role: newest.title,
    company: company.name,
    range: formatRange(item.startDate, item.endDate),
    tagline: company.tagline,
    tags: mergeTags(stack, item.skills),
    roleHistory: buildRoleHistory(sortedRoles),
    assignments: (item.assignments ?? []).map((a) =>
      buildAssignment(a, companies),
    ),
  };
  if (item.engagement) baked.engagement = item.engagement;
  if (item.printDescription) baked.description = item.printDescription;
  if (item.notes) baked.notes = item.notes;
  return baked;
}

function buildProject(project, projectStats) {
  const baked = {
    name: project.name,
    tagline: project.tagline,
  };
  const stats =
    projectStats?.enabled && project.github
      ? projectStats.projects?.[
          `${project.github.owner}/${project.github.repo}`
        ]
      : null;
  if (stats?.firstCommitDate && stats?.lastCommitDate) {
    baked.range = formatRange(
      stats.firstCommitDate.slice(0, 7),
      stats.lastCommitDate.slice(0, 7),
    );
  }
  if (project.printDescription) baked.description = project.printDescription;
  return baked;
}

function loadProjectStats() {
  if (!existsSync(projectStatsPath)) return null;
  try {
    return JSON.parse(readFileSync(projectStatsPath, "utf8"));
  } catch (err) {
    console.warn(`Could not parse project-stats.json (${err.message}).`);
    return null;
  }
}

function roundCredits(credits) {
  return credits.replace(/[\d.]+/, (match) => {
    const n = Number(match);
    return n - Math.floor(n) === 0.5 ? match : String(Math.round(n));
  });
}

function buildEducation(item) {
  const baked = {
    field: item.field,
    institution: item.institution,
    level: item.level,
    credits: roundCredits(item.credits),
    range: formatRange(item.startDate, item.endDate),
  };
  if (item.notes) baked.notes = item.notes;
  return baked;
}

function buildCourseRange(item) {
  const endDate =
    item.completedDate ??
    (item.moments ?? [])
      .map((m) => m.completedDate)
      .filter(Boolean)
      .reduce((latest, d) => (latest && latest > d ? latest : d), null);
  if (item.startDate && endDate) {
    return formatRange(item.startDate, endDate);
  }
  if (endDate) {
    return {
      en: formatMonth(endDate, "en"),
      sv: formatMonth(endDate, "sv"),
    };
  }
  return { en: "", sv: "" };
}

function buildCourse(item) {
  const details = [];
  if (item.engagement !== undefined) {
    details.push(bothLangs(`${Math.round(item.engagement * 100)}%`));
  }
  if (item.remote) {
    details.push(REMOTE);
  }
  return {
    name: item.name,
    institution: item.institution,
    code: item.code,
    credits: item.credits,
    range: buildCourseRange(item),
    details,
  };
}

function buildSkillGroup(group) {
  return {
    label: group.label,
    items: [...group.items],
  };
}

function buildLanguage(language) {
  return {
    name: language.name,
    level: language.level,
  };
}

function buildContact(contact) {
  if (!contact) return undefined;
  const out = {};
  if (contact.email) out.email = contact.email;
  if (contact.phone) out.phone = contact.phone;
  if (contact.address) out.address = contact.address;
  return Object.keys(out).length > 0 ? out : undefined;
}

function buildPrintData(cv, projectStats) {
  const companies = new Map(cv.companies.map((c) => [c.id, c]));
  const contact = buildContact(cv.contact);
  const data = {
    name: cv.name,
    title: cv.title,
    longSummary: cv.longSummary,
    settings: cv.print,
    sections: {
      experience: cv.sections.experience,
      projects: cv.sections.projects,
      education: cv.sections.education,
      courses: cv.sections.courses,
      skills: cv.sections.skills,
      languages: cv.sections.languages,
    },
    experience: cv.experience.map((e) => buildExperience(e, companies)),
    projects: cv.projects.map((p) => buildProject(p, projectStats)),
    education: cv.education.map(buildEducation),
    courses: cv.courses.map(buildCourse),
    skills: cv.skills.map(buildSkillGroup),
    languages: cv.languages.map(buildLanguage),
  };
  if (contact) data.contact = contact;
  return data;
}

const cv = loadCv();
const projectStats = loadProjectStats();
const data = buildPrintData(cv, projectStats);
const json = `${JSON.stringify(data, null, 2)}\n`;

if (toStdout) {
  process.stdout.write(json);
} else {
  writeFileSync(outPath, json);
  console.log(`Wrote ${outPath}`);
}
