#!/usr/bin/env node
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

import { loadCv } from "../src/data/load-cv.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const defaultOut = resolve(here, "..", "src", "data", "search-index.json");

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

const LANGUAGES = ["en", "sv"];

function isLocalized(value) {
  return (
    value &&
    typeof value === "object" &&
    typeof value.en === "string" &&
    typeof value.sv === "string"
  );
}

function localized(value) {
  if (isLocalized(value)) return { en: value.en, sv: value.sv };
  if (typeof value === "string") return { en: value, sv: value };
  return { en: "", sv: "" };
}

function pickLang(value, lang) {
  return localized(value)[lang];
}

function normalizeText(text) {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function joinHaystack(...parts) {
  return parts.filter((p) => typeof p === "string" && p.length > 0).join(" · ");
}

function buildRecords(cv) {
  const companies = new Map(cv.companies.map((c) => [c.id, c]));
  const records = [];

  function emit({
    id,
    kind,
    openerKey,
    title,
    secondary,
    body,
    localizedTitle,
    localizedSecondary,
  }) {
    for (const lang of LANGUAGES) {
      const titleStr = pickLang(title, lang);
      if (!titleStr) continue;
      const secondaryStr = secondary ? pickLang(secondary, lang) : "";
      const bodyStr = body ? pickLang(body, lang) : "";
      const haystackRaw = joinHaystack(titleStr, secondaryStr, bodyStr);
      const haystack = normalizeText(haystackRaw);
      if (!haystack) continue;
      const record = {
        id: `${id}-${lang}`,
        kind,
        openerKey,
        title: titleStr,
        lang,
        haystack,
      };
      if (secondaryStr) record.secondary = secondaryStr;
      if (localizedTitle) record.localizedTitle = localized(localizedTitle);
      if (localizedSecondary) {
        record.localizedSecondary = localized(localizedSecondary);
      }
      records.push(record);
    }
  }

  // Hero summary — single record covering both summary fields.
  emit({
    id: "summary",
    kind: "summary",
    openerKey: "summary",
    title: cv.title,
    secondary: cv.summary,
    body: cv.longSummary,
    localizedTitle: cv.title,
    localizedSecondary: cv.summary,
  });

  // Focus areas.
  cv.focus.forEach((focus, i) => {
    emit({
      id: `focus-${i}`,
      kind: "focus",
      openerKey: focus.area.en,
      title: focus.area,
      body: focus.description,
      localizedTitle: focus.area,
    });
  });

  // Projects.
  cv.projects.forEach((project) => {
    const stack = [...(project.stack ?? []), ...(project.skills ?? [])].join(
      " ",
    );
    emit({
      id: `project-${project.name}`,
      kind: "project",
      openerKey: project.name,
      title: { en: project.name, sv: project.name },
      secondary: project.tagline,
      body: {
        en: `${pickLang(project.description, "en")} ${stack}`,
        sv: `${pickLang(project.description, "sv")} ${stack}`,
      },
      localizedTitle: { en: project.name, sv: project.name },
      localizedSecondary: project.tagline,
    });
  });

  // Companies — index even if not directly clickable; clicking goes to the
  // company detail modal.
  cv.companies.forEach((company) => {
    emit({
      id: `company-${company.id}`,
      kind: "company",
      openerKey: company.id,
      title: { en: company.name, sv: company.name },
      secondary: company.tagline,
      body: company.description,
      localizedTitle: { en: company.name, sv: company.name },
      localizedSecondary: company.tagline,
    });
  });

  // Experience entries — title is the role chain, opens the company modal.
  cv.experience.forEach((exp, i) => {
    const company = companies.get(exp.companyId);
    if (!company) return;
    const sortedRoles = [...exp.roles].sort((a, b) =>
      a.startDate.localeCompare(b.startDate),
    );
    const titleEn = sortedRoles.map((r) => pickLang(r.title, "en")).join(" → ");
    const titleSv = sortedRoles.map((r) => pickLang(r.title, "sv")).join(" → ");
    const stack = [...(exp.stack ?? []), ...(exp.skills ?? [])].join(" ");
    const notes = exp.notes ?? { en: "", sv: "" };
    emit({
      id: `exp-${i}`,
      kind: "experience",
      openerKey: company.id,
      title: { en: titleEn, sv: titleSv },
      secondary: { en: company.name, sv: company.name },
      body: {
        en: `${pickLang(notes, "en")} ${stack}`,
        sv: `${pickLang(notes, "sv")} ${stack}`,
      },
      localizedTitle: { en: titleEn, sv: titleSv },
      localizedSecondary: { en: company.name, sv: company.name },
    });

    (exp.assignments ?? []).forEach((assignment, j) => {
      const client = companies.get(assignment.clientId);
      if (!client) return;
      const sortedAsg = [...assignment.roles].sort((a, b) =>
        a.startDate.localeCompare(b.startDate),
      );
      const asgTitleEn = sortedAsg
        .map((r) => pickLang(r.title, "en"))
        .join(" → ");
      const asgTitleSv = sortedAsg
        .map((r) => pickLang(r.title, "sv"))
        .join(" → ");
      const asgStack = [
        ...(assignment.stack ?? []),
        ...(assignment.skills ?? []),
      ].join(" ");
      const asgNotes = assignment.notes ?? { en: "", sv: "" };
      emit({
        id: `exp-${i}-asg-${j}`,
        kind: "assignment",
        openerKey: client.id,
        title: { en: asgTitleEn, sv: asgTitleSv },
        secondary: {
          en: `${client.name} · via ${company.name}`,
          sv: `${client.name} · via ${company.name}`,
        },
        body: {
          en: `${pickLang(asgNotes, "en")} ${asgStack}`,
          sv: `${pickLang(asgNotes, "sv")} ${asgStack}`,
        },
        localizedTitle: { en: asgTitleEn, sv: asgTitleSv },
        localizedSecondary: {
          en: `${client.name} · via ${company.name}`,
          sv: `${client.name} · via ${company.name}`,
        },
      });
    });
  });

  // Education programs.
  cv.education.forEach((ed, i) => {
    const skills = (ed.skills ?? []).join(" ");
    const notes = ed.notes ?? { en: "", sv: "" };
    const subtitleEn = `${pickLang(ed.institution, "en")} · ${pickLang(ed.level, "en")}`;
    const subtitleSv = `${pickLang(ed.institution, "sv")} · ${pickLang(ed.level, "sv")}`;
    emit({
      id: `edu-${i}`,
      kind: "education",
      openerKey: pickLang(ed.field, "en"),
      title: ed.field,
      secondary: { en: subtitleEn, sv: subtitleSv },
      body: {
        en: `${pickLang(notes, "en")} ${skills}`,
        sv: `${pickLang(notes, "sv")} ${skills}`,
      },
      localizedTitle: ed.field,
      localizedSecondary: { en: subtitleEn, sv: subtitleSv },
    });
  });

  // Standalone courses.
  cv.courses.forEach((course, i) => {
    const skills = (course.skills ?? []).join(" ");
    const subtitleEn = `${pickLang(course.institution, "en")} · ${course.code}`;
    const subtitleSv = `${pickLang(course.institution, "sv")} · ${course.code}`;
    emit({
      id: `course-${i}`,
      kind: "course",
      openerKey: pickLang(course.name, "en"),
      title: course.name,
      secondary: { en: subtitleEn, sv: subtitleSv },
      body: { en: skills, sv: skills },
      localizedTitle: course.name,
      localizedSecondary: { en: subtitleEn, sv: subtitleSv },
    });
  });

  // Skills — one record per skill across all groups, deduplicated.
  const seenSkills = new Set();
  cv.skills.forEach((group) => {
    for (const skill of group.items) {
      if (seenSkills.has(skill)) continue;
      seenSkills.add(skill);
      const detail = cv.skillDetails?.[skill];
      const description = detail?.description ?? { en: "", sv: "" };
      emit({
        id: `skill-${skill}`,
        kind: "skill",
        openerKey: skill,
        title: { en: skill, sv: skill },
        secondary: group.label,
        body: description,
        localizedTitle: { en: skill, sv: skill },
        localizedSecondary: group.label,
      });
    }
  });

  return records;
}

const cv = loadCv();
const records = buildRecords(cv);
const data = {
  generatedAt: new Date().toISOString(),
  records,
};
const serialized = JSON.stringify(data, null, 2) + "\n";

if (toStdout) {
  process.stdout.write(serialized);
} else {
  writeFileSync(outPath, serialized);
  console.log(
    `Search index written to ${outPath} (${records.length} records).`,
  );
}
