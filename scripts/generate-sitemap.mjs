// Emits dist/sitemap.xml after `vite build`. The CV is a single-page site, so
// the sitemap has exactly one URL — but having it makes Search Console happy
// and gives crawlers a canonical pointer plus a fresh lastmod.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const cv = JSON.parse(
  fs.readFileSync(path.join(ROOT, "src/data/cv.json"), "utf8"),
);

const SITE_URL = cv.meta.siteUrl.replace(/\/$/, "");
const lastmod = new Date().toISOString();

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE_URL}/</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
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
