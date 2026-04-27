import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

import { loadCv, loadCvWithParts } from "./src/data/load-cv.mjs";

const cv = loadCv();

declare const process: { env: Record<string, string | undefined> };

const SITE_URL = cv.meta.siteUrl.replace(/\/$/, "");
const TITLE_EN = cv.meta.documentTitle.en;
const DESCRIPTION_EN = cv.meta.description.en;
const SUMMARY_EN = cv.summary.en;
const JOB_TITLE_EN = cv.title.en;
const OG_IMAGE_URL = `${SITE_URL}${cv.meta.seo.image}`;
const CANONICAL_URL = `${SITE_URL}/`;

function attr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function jsonLdSafe(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function buildPersonName(): { firstName: string; lastName: string } {
  const parts = cv.name.trim().split(/\s+/);
  return {
    firstName: parts[0] ?? cv.name,
    lastName: parts.slice(1).join(" ") || cv.name,
  };
}

function buildKnowsAbout(): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const group of cv.skills) {
    for (const item of group.items) {
      if (!seen.has(item)) {
        seen.add(item);
        result.push(item);
      }
    }
  }
  return result;
}

function buildAlumniOf(): Array<{ "@type": string; name: string }> {
  const seen = new Set<string>();
  const result: Array<{ "@type": string; name: string }> = [];
  for (const edu of cv.education) {
    const name = edu.institution.en;
    if (!seen.has(name)) {
      seen.add(name);
      result.push({ "@type": "EducationalOrganization", name });
    }
  }
  return result;
}

function buildJsonLd(): string {
  const { firstName, lastName } = buildPersonName();
  const sameAs = cv.links.map((l) => l.url);
  const person = {
    "@type": "Person",
    "@id": `${SITE_URL}/#person`,
    name: cv.name,
    givenName: firstName,
    familyName: lastName,
    url: `${SITE_URL}/`,
    image: OG_IMAGE_URL,
    jobTitle: JOB_TITLE_EN,
    description: SUMMARY_EN,
    address: { "@type": "PostalAddress", addressCountry: "SE" },
    sameAs,
    knowsAbout: buildKnowsAbout(),
    alumniOf: buildAlumniOf(),
  };
  const website = {
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: `${SITE_URL}/`,
    name: TITLE_EN,
    description: DESCRIPTION_EN,
    inLanguage: ["en", "sv"],
    author: { "@id": `${SITE_URL}/#person` },
    publisher: { "@id": `${SITE_URL}/#person` },
  };
  return jsonLdSafe({
    "@context": "https://schema.org",
    "@graph": [person, website],
  });
}

function buildHeadInjection(goatcounterEndpoint: string | undefined): string {
  const seo = cv.meta.seo;
  const { firstName, lastName } = buildPersonName();
  const tags: string[] = [
    `<link rel="canonical" href="${attr(CANONICAL_URL)}" />`,
    `<meta name="author" content="${attr(cv.name)}" />`,
    `<meta name="keywords" content="${attr(seo.keywords.join(", "))}" />`,
    `<meta property="og:type" content="profile" />`,
    `<meta property="og:site_name" content="${attr(TITLE_EN)}" />`,
    `<meta property="og:title" content="${attr(TITLE_EN)}" />`,
    `<meta property="og:description" content="${attr(DESCRIPTION_EN)}" />`,
    `<meta property="og:url" content="${attr(CANONICAL_URL)}" />`,
    `<meta property="og:image" content="${attr(OG_IMAGE_URL)}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:locale" content="${attr(seo.locale)}" />`,
    `<meta property="og:locale:alternate" content="${attr(seo.alternateLocale)}" />`,
    `<meta property="profile:first_name" content="${attr(firstName)}" />`,
    `<meta property="profile:last_name" content="${attr(lastName)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${attr(TITLE_EN)}" />`,
    `<meta name="twitter:description" content="${attr(DESCRIPTION_EN)}" />`,
    `<meta name="twitter:image" content="${attr(OG_IMAGE_URL)}" />`,
    `<script type="application/ld+json">${buildJsonLd()}</script>`,
  ];
  if (goatcounterEndpoint) {
    tags.push(
      `<script data-goatcounter="${attr(goatcounterEndpoint)}" async src="https://gc.zgo.at/count.js"></script>`,
    );
  }
  return tags.join("\n    ");
}

function cvMetaHtmlPlugin(): Plugin {
  const goatcounterEndpoint = process.env.VITE_GOATCOUNTER_ENDPOINT;
  return {
    name: "cv-meta-html",
    transformIndexHtml(html) {
      const injection = buildHeadInjection(goatcounterEndpoint);
      return html
        .replace(/<title>[^<]*<\/title>/, `<title>${TITLE_EN}</title>`)
        .replace(
          /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/,
          `<meta name="description" content="${attr(DESCRIPTION_EN)}" />`,
        )
        .replace(
          /([ \t]*)<\/head>/,
          (_match, indent: string) =>
            `${indent}  ${injection.replace(/\n[ \t]+/g, `\n${indent}  `)}\n${indent}</head>`,
        );
    },
  };
}

// Replaces every "{...}" placeholder in src/data/cv.json with the
// matching part file under src/data/cv/ before Vite's JSON loader sees
// the import. Lets the rest of the app keep doing
// `import cv from "./data/cv.json"` (via src/data/cv.ts).
function cvAssemblyPlugin(): Plugin {
  const CV_JSON_SUFFIX = "src/data/cv.json";
  return {
    name: "cv-assembly",
    enforce: "pre",
    load(id) {
      const cleanId = id.split("?")[0].replace(/\\/g, "/");
      if (!cleanId.endsWith(CV_JSON_SUFFIX)) return null;
      const { cv: assembled, parts, overridePath } = loadCvWithParts(cleanId);
      for (const part of parts) this.addWatchFile(part);
      if (overridePath) this.addWatchFile(overridePath);
      return JSON.stringify(assembled);
    },
  };
}

export default defineConfig({
  plugins: [react(), cvAssemblyPlugin(), cvMetaHtmlPlugin()],
  base: "/",
});
