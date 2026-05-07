// Emits dist/sitemap.xml after `vite build`. The CV is single-page on the
// home route, but the SPA also exposes /timeline as a directly addressable
// URL (paired with dist/timeline.html so direct hits don't fall through to
// public/404.html). Listing both, plus /resume.json (and the /cv.json alias)
// and /llms.txt, gives crawlers and LLMs a canonical pointer with a fresh
// lastmod.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadCv } from "../src/data/load-cv.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const cv = loadCv();

const SITE_URL = cv.meta.website.replace(/\/$/, "");
const lastmod = new Date().toISOString();

function localizedPage(pathname, priority) {
  const loc = `${SITE_URL}${pathname}`;
  return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${priority}</priority>
    <xhtml:link rel="alternate" hreflang="en" href="${loc}" />
    <xhtml:link rel="alternate" hreflang="sv" href="${loc}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${loc}" />
  </url>`;
}

function asset(pathname, priority) {
  return `  <url>
    <loc>${SITE_URL}${pathname}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${localizedPage("/", "1.0")}
${localizedPage("/timeline", "0.9")}
${asset("/resume.json", "0.8")}
${asset("/cv.json", "0.8")}
${asset("/llms.txt", "0.8")}
</urlset>
`;

const distDir = path.join(ROOT, "dist");
if (!fs.existsSync(distDir)) {
  console.error(
    "dist/ does not exist — run `vite build` before generate-sitemap.",
  );
  process.exit(1);
}

const outPath = path.join(distDir, "sitemap.xml");
fs.writeFileSync(outPath, xml);
console.log(`Wrote ${path.relative(ROOT, outPath)}.`);
