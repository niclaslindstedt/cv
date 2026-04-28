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

function dedupe(list) {
  const out = [];
  const seen = new Set();
  for (const item of list) {
    if (typeof item !== "string") continue;
    const trimmed = item.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
  }
  return out;
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
    fieldsByLang,
    localizedTitle,
    localizedSecondary,
  }) {
    for (const lang of LANGUAGES) {
      const titleStr = pickLang(title, lang);
      if (!titleStr) continue;
      const secondaryStr = secondary ? pickLang(secondary, lang) : "";
      const fields = fieldsByLang(lang);
      // Title is always indexed; require it.
      const fieldsOut = { title: fields.title || titleStr };
      if (secondaryStr) fieldsOut.secondary = secondaryStr;
      if (fields.description && fields.description.trim()) {
        fieldsOut.description = fields.description.trim();
      }
      const stack = dedupe(fields.stack ?? []);
      if (stack.length) fieldsOut.stack = stack;
      const skills = dedupe(fields.skills ?? []);
      if (skills.length) fieldsOut.skills = skills;
      const aliases = dedupe(fields.aliases ?? []);
      if (aliases.length) fieldsOut.aliases = aliases;

      const record = {
        id: `${id}-${lang}`,
        kind,
        openerKey,
        title: titleStr,
        lang,
        fields: fieldsOut,
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
    fieldsByLang: (lang) => ({
      title: pickLang(cv.title, lang),
      description: pickLang(cv.longSummary, lang),
    }),
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
      fieldsByLang: (lang) => ({
        title: pickLang(focus.area, lang),
        description: pickLang(focus.description, lang),
        aliases: focus.aliases ?? [],
      }),
      localizedTitle: focus.area,
    });
  });

  // Projects.
  cv.projects.forEach((project) => {
    emit({
      id: `project-${project.name}`,
      kind: "project",
      openerKey: project.name,
      title: { en: project.name, sv: project.name },
      secondary: project.tagline,
      fieldsByLang: (lang) => ({
        title: project.name,
        description: `${pickLang(project.tagline, lang)} ${pickLang(project.description, lang)}`,
        stack: project.stack ?? [],
        skills: project.skills ?? [],
        aliases: project.aliases ?? [],
      }),
      localizedTitle: { en: project.name, sv: project.name },
      localizedSecondary: project.tagline,
    });
  });

  // Companies — clicking goes to the company detail modal.
  cv.companies.forEach((company) => {
    emit({
      id: `company-${company.id}`,
      kind: "company",
      openerKey: company.id,
      title: { en: company.name, sv: company.name },
      secondary: company.tagline,
      fieldsByLang: (lang) => ({
        title: company.name,
        description: `${pickLang(company.tagline, lang)} ${pickLang(company.description, lang)}`,
        stack: company.stack ?? [],
        aliases: company.aliases ?? [],
      }),
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
    emit({
      id: `exp-${i}`,
      kind: "experience",
      openerKey: company.id,
      title: { en: titleEn, sv: titleSv },
      secondary: { en: company.name, sv: company.name },
      fieldsByLang: (lang) => ({
        title: lang === "sv" ? titleSv : titleEn,
        description: pickLang(exp.notes ?? { en: "", sv: "" }, lang),
        stack: exp.stack ?? [],
        skills: exp.skills ?? [],
        aliases: [
          ...(exp.aliases ?? []),
          // Each role title is also a useful alias (e.g. "CTO" should find a CTO role).
          ...sortedRoles.map((r) => pickLang(r.title, lang)),
        ],
      }),
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
      emit({
        id: `exp-${i}-asg-${j}`,
        kind: "assignment",
        openerKey: client.id,
        title: { en: asgTitleEn, sv: asgTitleSv },
        secondary: {
          en: `${client.name} · via ${company.name}`,
          sv: `${client.name} · via ${company.name}`,
        },
        fieldsByLang: (lang) => ({
          title: lang === "sv" ? asgTitleSv : asgTitleEn,
          description: pickLang(assignment.notes ?? { en: "", sv: "" }, lang),
          stack: assignment.stack ?? [],
          skills: assignment.skills ?? [],
          aliases: [
            ...(assignment.aliases ?? []),
            client.name,
            ...sortedAsg.map((r) => pickLang(r.title, lang)),
          ],
        }),
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
    const subtitleEn = `${pickLang(ed.institution, "en")} · ${pickLang(ed.level, "en")}`;
    const subtitleSv = `${pickLang(ed.institution, "sv")} · ${pickLang(ed.level, "sv")}`;
    emit({
      id: `edu-${i}`,
      kind: "education",
      openerKey: pickLang(ed.field, "en"),
      title: ed.field,
      secondary: { en: subtitleEn, sv: subtitleSv },
      fieldsByLang: (lang) => ({
        title: pickLang(ed.field, lang),
        description: pickLang(ed.notes ?? { en: "", sv: "" }, lang),
        skills: ed.skills ?? [],
        aliases: [
          ...(ed.aliases ?? []),
          pickLang(ed.institution, lang),
          pickLang(ed.level, lang),
        ],
      }),
      localizedTitle: ed.field,
      localizedSecondary: { en: subtitleEn, sv: subtitleSv },
    });
  });

  // Standalone courses.
  cv.courses.forEach((course, i) => {
    const subtitleEn = `${pickLang(course.institution, "en")} · ${course.code}`;
    const subtitleSv = `${pickLang(course.institution, "sv")} · ${course.code}`;
    emit({
      id: `course-${i}`,
      kind: "course",
      openerKey: pickLang(course.name, "en"),
      title: course.name,
      secondary: { en: subtitleEn, sv: subtitleSv },
      fieldsByLang: (lang) => ({
        title: pickLang(course.name, lang),
        skills: course.skills ?? [],
        aliases: [
          ...(course.aliases ?? []),
          course.code,
          pickLang(course.institution, lang),
        ],
      }),
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
        fieldsByLang: (lang) => ({
          title: skill,
          description: pickLang(description, lang),
          aliases: detail?.aliases ?? [],
        }),
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
