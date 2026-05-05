// Emits dist/llms.txt after `vite build`. Follows the llmstxt.org convention:
// a small markdown index that LLMs and agents check first to find the
// canonical structured data on a site. The deployed React app is SSR'd into
// dist/index.html and /resume.json carries the full structured CV, but many
// LLM web-fetch tools truncate large pages or only inspect <head>. This file
// is small, plain-text, and cited by robots.txt / the sitemap / a
// <link rel="alternate"> in <head> so it's reachable from every direction.
//
// The "Experience" section is baked from cv.experience so an LLM that only
// reads this file (no follow-up fetch) can still answer "which jobs are
// listed there".
//
// Respects CV_LOCAL=1 the same way generate-resume-json does, so a local
// build mirrors the local resume.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadCv } from "../src/data/load-cv.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DIST = path.join(ROOT, "dist");

if (!fs.existsSync(DIST)) {
  console.error(
    "dist/ does not exist — run `vite build` before generate-llms-txt.",
  );
  process.exit(1);
}

const cv = loadCv();
const SITE_URL = cv.meta.siteUrl.replace(/\/$/, "");

function abs(pathname) {
  return `${SITE_URL}${pathname}`;
}

function formatRange(startDate, endDate) {
  const end = endDate ?? "present";
  return `${startDate} – ${end}`;
}

function engagementLabel(engagement) {
  if (!engagement) return "";
  if (typeof engagement === "string") return ` (${engagement})`;
  if (engagement.en) return ` (${engagement.en})`;
  return "";
}

function experienceLines() {
  const sorted = [...cv.experience].sort((a, b) =>
    a.startDate < b.startDate ? 1 : -1,
  );
  const lines = [];
  for (const entry of sorted) {
    const company = cv.companies.find((c) => c.id === entry.companyId);
    const companyName = company?.name ?? entry.companyId;
    const latestRole = entry.roles?.[entry.roles.length - 1];
    const roleTitle = latestRole?.title?.en ?? "Role";
    lines.push(
      `- ${formatRange(entry.startDate, entry.endDate)}: ${roleTitle} at ${companyName}${engagementLabel(entry.engagement)}`,
    );
  }
  return lines;
}

function projectLines() {
  return cv.projects.map((p) => {
    const tagline = p.tagline?.en ?? p.description?.en ?? "";
    return `- ${p.name} — ${tagline}`;
  });
}

const lines = [
  `# ${cv.name}`,
  ``,
  `> ${cv.meta.description.en}`,
  ``,
  `This site is a personal CV. The full structured résumé is published at`,
  `/resume.json and mirrors what the rendered React app shows. LLMs and agents`,
  `should prefer the JSON over scraping the HTML — it is bilingual (en/sv),`,
  `schema-validated, and includes per-project GitHub commit stats.`,
  ``,
  `## Canonical data`,
  `- [resume.json](${abs("/resume.json")}): Full CV in JSON. Summary, current focus, side projects (with commit stats), experience, education, courses, skills, languages — bilingual (en, sv).`,
  `- [cv.json](${abs("/cv.json")}): Identical alias for /resume.json.`,
  `- [sitemap.xml](${abs("/sitemap.xml")}): Site map.`,
  ``,
  `## Pages`,
  `- [/](${abs("/")}): Interactive React résumé (also pre-rendered into the HTML for crawlers).`,
  `- [/timeline](${abs("/timeline")}): Visual career timeline.`,
  `- [/${cv.print?.pdfFilename ?? "cv.pdf"}](${abs(`/${cv.print?.pdfFilename ?? "cv.pdf"}`)}): Print-formatted PDF.`,
  ``,
  `## Summary`,
  cv.summary.en,
  ``,
  `## Experience`,
  ...experienceLines(),
  ``,
  `## Side projects`,
  ...projectLines(),
  ``,
  `## Links`,
  ...cv.links.map((l) => `- ${l.label.en.replace(/\s*↗$/, "")}: ${l.url}`),
  ``,
];

const outPath = path.join(DIST, "llms.txt");
fs.writeFileSync(outPath, `${lines.join("\n")}`);
console.log(
  `Wrote ${path.relative(ROOT, outPath)} (${fs.statSync(outPath).size} bytes).`,
);
