// Emits dist/timeline.html after `vite build` so direct hits to /timeline
// resolve to a real 200 response on GitHub Pages instead of falling through
// to public/404.html (which carries `noindex` and a JS redirect to /, so
// crawlers can't index the route). The SPA still owns the rendering — this
// file is a copy of dist/index.html with the head meta retargeted to the
// timeline view, so when the bundle boots and `useRoute` reads /timeline
// the same Timeline component takes over.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadCv } from "../src/data/load-cv.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DIST = path.join(ROOT, "dist");
const INDEX_HTML = path.join(DIST, "index.html");

if (!fs.existsSync(INDEX_HTML)) {
  console.error(
    "dist/index.html does not exist — run `vite build` before generate-timeline-html.",
  );
  process.exit(1);
}

const cv = loadCv();
const SITE_URL = cv.meta.website.replace(/\/$/, "");
const TIMELINE_URL = `${SITE_URL}/timeline`;
const baseTitle = cv.meta.documentTitle.en;
const TITLE = `Career timeline — ${baseTitle}`;
const DESCRIPTION = `Interactive career timeline for ${cv.name} — every role, side project, education programme, and course mapped chronologically alongside GitHub commit activity.`;

let html = fs.readFileSync(INDEX_HTML, "utf8");

html = replaceOnce(
  html,
  /<title>[\s\S]*?<\/title>/,
  `<title>${escapeText(TITLE)}</title>`,
);

html = replaceAll(
  html,
  /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/g,
  `<meta name="description" content="${escapeAttr(DESCRIPTION)}" />`,
);

html = replaceOnce(
  html,
  /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/,
  `<link rel="canonical" href="${escapeAttr(TIMELINE_URL)}" />`,
);

html = replaceAll(
  html,
  /<link\s+rel="alternate"\s+hreflang="(en|sv|x-default)"\s+href="[^"]*"\s*\/?>/g,
  (_match, lang) =>
    `<link rel="alternate" hreflang="${lang}" href="${escapeAttr(TIMELINE_URL)}" />`,
);

html = replaceOnce(
  html,
  /<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/,
  `<meta property="og:title" content="${escapeAttr(TITLE)}" />`,
);
html = replaceOnce(
  html,
  /<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/,
  `<meta property="og:description" content="${escapeAttr(DESCRIPTION)}" />`,
);
html = replaceOnce(
  html,
  /<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/,
  `<meta property="og:url" content="${escapeAttr(TIMELINE_URL)}" />`,
);
html = replaceOnce(
  html,
  /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/,
  `<meta name="twitter:title" content="${escapeAttr(TITLE)}" />`,
);
html = replaceOnce(
  html,
  /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/,
  `<meta name="twitter:description" content="${escapeAttr(DESCRIPTION)}" />`,
);

const outPath = path.join(DIST, "timeline.html");
fs.writeFileSync(outPath, html);
console.log(`Wrote ${path.relative(ROOT, outPath)}.`);

function replaceOnce(input, pattern, replacement) {
  if (!pattern.test(input)) {
    throw new Error(
      `generate-timeline-html: pattern ${pattern} did not match dist/index.html — the cvMetaHtmlPlugin output shape changed.`,
    );
  }
  return input.replace(pattern, replacement);
}

function replaceAll(input, pattern, replacement) {
  if (!pattern.test(input)) {
    throw new Error(
      `generate-timeline-html: pattern ${pattern} did not match dist/index.html — the cvMetaHtmlPlugin output shape changed.`,
    );
  }
  pattern.lastIndex = 0;
  return input.replace(pattern, replacement);
}

function escapeAttr(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeText(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
