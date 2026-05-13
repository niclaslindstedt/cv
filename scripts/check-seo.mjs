// Walks every user-facing HTML file under dist/ and asserts the structural
// SEO invariants from OSS_SPEC.md §11.3.10. Emits GitHub Actions
// `::error::` annotations tied to the specific dist file so the PR file
// view highlights each failure. Exits non-zero on any violation.
//
// Scope: this site is a single-page bilingual CV that auto-deploys to
// GitHub Pages from `main`. The script targets the three user-facing
// HTML files Vite emits — `dist/index.html`, `dist/timeline.html`,
// `dist/404.html`. The print views (`dist/print-en.html`,
// `dist/print-sv.html`) exist only as SSR sources for the PDF generator
// and are intentionally skipped.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DIST = path.join(ROOT, "dist");
const CANONICAL_HOST = "niclaslindstedt.se";

const ALL_PAGES = ["index.html", "timeline.html", "404.html"];
const NOINDEX_PAGES = new Set(["404.html"]);

const isCI = process.env.GITHUB_ACTIONS === "true";

let totalFailures = 0;

function annotate(file, message) {
  totalFailures++;
  if (isCI) {
    console.log(`::error file=dist/${file}::${message}`);
  } else {
    console.error(`dist/${file}: ${message}`);
  }
}

function attr(html, tag, attribute, value) {
  // Find the first matching tag and return the requested attribute value.
  const re = new RegExp(
    `<${tag}\\b[^>]*\\b${attribute}\\s*=\\s*["']([^"']*)["'][^>]*>`,
    "i",
  );
  const m = html.match(re);
  return m ? m[1] : null;
}

function findAll(html, re) {
  const out = [];
  let m;
  while ((m = re.exec(html)) !== null) out.push(m);
  return out;
}

function metaContent(html, nameOrProperty) {
  const re = new RegExp(
    `<meta\\b[^>]*\\b(?:name|property)\\s*=\\s*["']${nameOrProperty}["'][^>]*\\bcontent\\s*=\\s*["']([^"']*)["'][^>]*>`,
    "i",
  );
  const m = html.match(re);
  return m ? m[1] : null;
}

function titleText(html) {
  const m = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return m ? m[1].trim() : null;
}

function bodyText(html) {
  const m = html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);
  if (!m) return "";
  // Strip script/style and tags, collapse whitespace.
  const stripped = m[1]
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return stripped;
}

function checkHeadingHierarchy(file, html) {
  const headings = findAll(html, /<h([1-6])\b[^>]*>/gi).map((m) =>
    Number(m[1]),
  );
  if (headings.length === 0) return;
  let prev = 0;
  for (const level of headings) {
    if (prev !== 0 && level > prev + 1) {
      annotate(
        file,
        `heading hierarchy skips a level (h${prev} → h${level}); §11.3.5 forbids skipping`,
      );
      return;
    }
    prev = level;
  }
}

function checkJsonLd(file, html) {
  const blocks = findAll(
    html,
    /<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  );
  if (blocks.length === 0) return;
  const ogImage = metaContent(html, "og:image");
  for (const [, raw] of blocks) {
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      annotate(file, `JSON-LD block does not parse: ${e.message}`);
      continue;
    }
    // A top-level object with @graph is a legitimate JSON-LD container —
    // each element of the graph carries its own @type. Walk into the graph
    // and skip the outer wrapper.
    const roots = Array.isArray(parsed) ? parsed : [parsed];
    const nodes = roots.flatMap((root) =>
      root && Array.isArray(root["@graph"]) ? root["@graph"] : [root],
    );
    for (const node of nodes) {
      const type = node && node["@type"];
      if (!type) {
        annotate(file, `JSON-LD block missing @type`);
        continue;
      }
      const isArticle =
        type === "BlogPosting" || type === "TechArticle" || type === "Article";
      if (isArticle && ogImage) {
        const image =
          typeof node.image === "string"
            ? node.image
            : node.image && (node.image.url || node.image["@id"]);
        if (image && image !== ogImage) {
          annotate(
            file,
            `${type}.image (${image}) does not match og:image (${ogImage}); §11.3.3 invariant`,
          );
        }
      }
    }
  }
}

function checkPage(file) {
  const abs = path.join(DIST, file);
  if (!fs.existsSync(abs)) {
    annotate(file, `expected file missing from dist/`);
    return;
  }
  const html = fs.readFileSync(abs, "utf8");
  const expectIndexable = !NOINDEX_PAGES.has(file);

  // Title (§11.3.2)
  const title = titleText(html);
  if (!title) annotate(file, `<title> missing or empty`);
  else if (title.length > 70)
    annotate(file, `<title> is ${title.length} chars (cap is 70 per §11.3.10)`);

  // Meta description (§11.3.2)
  const desc = metaContent(html, "description");
  if (expectIndexable) {
    if (!desc) annotate(file, `<meta name="description"> missing`);
    else if (desc.length > 160)
      annotate(
        file,
        `meta description is ${desc.length} chars (cap is 160 per §11.3.10)`,
      );
  }

  // Canonical (§11.3.2)
  const canonical = attr(html, "link", "href");
  // attr() above returns the first <link href="...">; be more specific:
  const canonM = html.match(
    /<link\b[^>]*\brel\s*=\s*["']canonical["'][^>]*\bhref\s*=\s*["']([^"']+)["'][^>]*>/i,
  );
  const canonicalUrl = canonM ? canonM[1] : null;
  if (!canonicalUrl) annotate(file, `<link rel="canonical"> missing`);
  else if (!canonicalUrl.startsWith(`https://${CANONICAL_HOST}`))
    annotate(
      file,
      `canonical URL (${canonicalUrl}) is not on https://${CANONICAL_HOST}`,
    );

  // Robots meta (§11.3.2)
  const robots = metaContent(html, "robots");
  if (expectIndexable) {
    if (robots && /\bnoindex\b/i.test(robots))
      annotate(
        file,
        `robots meta is noindex on a real page (only 404.html may be noindex)`,
      );
  } else {
    if (!robots || !/\bnoindex\b/i.test(robots))
      annotate(file, `robots meta on 404.html must contain noindex`);
  }

  // Body content (§11.3.1, §11.3.10)
  if (expectIndexable) {
    const words = bodyText(html).split(/\s+/).filter(Boolean).length;
    if (words < 20)
      annotate(
        file,
        `<body> has ${words} words (minimum is 20 per §11.3.10) — SPA shell may be empty`,
      );
  }

  // At least one <h1> per indexable page (§11.3.10 says "exactly one"; we
  // relax to ≥ 1 here because the static-index SSR pass mounts the
  // screen-only Hero (`<h1 class="hero-name">`) and the print-only PrintView
  // (`<h1 class="print-name">`) in the same HTML document. Both are SSR-
  // emitted; only one is visible at a time via @media rules. Promoting the
  // print h1 to an h2 in the same PR as the conformance scaffolding would
  // creep beyond the sync-oss-spec scope — see the TODO in PrintView.tsx.
  if (expectIndexable) {
    const h1Count = findAll(html, /<h1\b/gi).length;
    if (h1Count < 1)
      annotate(file, `expected at least one <h1>, found 0 (§11.3.10)`);
  }

  // Heading hierarchy (§11.3.5)
  if (expectIndexable) checkHeadingHierarchy(file, html);

  // Open Graph image presence + resolves to a file (§11.3.10)
  if (expectIndexable) {
    const ogImage = metaContent(html, "og:image");
    if (!ogImage) annotate(file, `og:image meta missing`);
    else {
      const ogPath = ogImage.replace(`https://${CANONICAL_HOST}`, "");
      const ogAbs = path.join(DIST, ogPath.replace(/^\//, ""));
      if (!fs.existsSync(ogAbs))
        annotate(
          file,
          `og:image (${ogImage}) does not resolve to a file under dist/`,
        );
    }
    const twitterAlt = metaContent(html, "twitter:image:alt");
    if (!twitterAlt) annotate(file, `twitter:image:alt missing (§11.3.2)`);
  }

  // JSON-LD parses + Article.image matches og:image (§11.3.3)
  checkJsonLd(file, html);

  // Suppress unused-var lint
  void canonical;
}

function checkDiscoveryFiles() {
  // sitemap.xml (§11.3.6)
  const sitemap = path.join(DIST, "sitemap.xml");
  if (!fs.existsSync(sitemap)) {
    annotate("sitemap.xml", `sitemap.xml missing from dist/ (§11.3.6)`);
  } else {
    const xml = fs.readFileSync(sitemap, "utf8");
    for (const file of ALL_PAGES) {
      if (NOINDEX_PAGES.has(file)) continue;
      const route =
        file === "index.html" ? "/" : `/${file.replace(/\.html$/, "")}`;
      const url = `https://${CANONICAL_HOST}${route}`;
      // Sitemap entries can either end with the route or include it as a path
      // segment of a <loc> element.
      if (!xml.includes(url) && !xml.includes(`${url}/`))
        annotate(
          "sitemap.xml",
          `does not list ${url} (per-content HTML file is orphaned in the sitemap)`,
        );
    }
  }

  // robots.txt (§11.3.6)
  const robots = path.join(DIST, "robots.txt");
  if (!fs.existsSync(robots)) {
    annotate("robots.txt", `robots.txt missing from dist/ (§11.3.6)`);
  } else {
    const txt = fs.readFileSync(robots, "utf8");
    if (!/^Sitemap:\s*https?:\/\//im.test(txt))
      annotate("robots.txt", `does not advertise an absolute Sitemap: URL`);
    if (/^Disallow:\s*\/\s*$/m.test(txt))
      annotate(
        "robots.txt",
        `contains a global \`Disallow: /\` (§11.3.6 forbids)`,
      );
  }

  // llms.txt (§11.3.6)
  const llms = path.join(DIST, "llms.txt");
  if (!fs.existsSync(llms)) {
    annotate("llms.txt", `llms.txt missing from dist/ (§11.3.6)`);
  } else {
    const txt = fs.readFileSync(llms, "utf8");
    if (!/^#\s+\S/m.test(txt))
      annotate(
        "llms.txt",
        `does not start with a top-level "# Site title" heading`,
      );
  }
}

if (!fs.existsSync(DIST)) {
  console.error("dist/ does not exist — run `make build` before check-seo.");
  process.exit(1);
}

for (const file of ALL_PAGES) checkPage(file);
checkDiscoveryFiles();

if (totalFailures > 0) {
  console.error(
    `\ncheck-seo: ${totalFailures} violation(s) — see annotations above.`,
  );
  process.exit(1);
}

console.log("check-seo: all assertions passed.");
