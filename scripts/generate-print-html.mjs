// Pre-renders <PrintView /> to a static HTML page per supported language and
// writes them next to dist/index.html (e.g. dist/print-en.html and
// dist/print-sv.html). The PDF generator loads these directly so it doesn't
// have to boot the SPA, wait for hydration, or dispatch the `beforeprint`
// hook — the static markup already contains the fully expanded print view.
//
// Renders the existing src/components/PrintView.tsx (no duplicated layout)
// via Vite SSR + react-dom/server. The bundled stylesheet from dist/index.html
// is referenced from each print HTML so fonts and the @media print rules in
// src/styles/print.css are reused verbatim.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

import { loadCv } from "../src/data/load-cv.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DIST = path.join(ROOT, "dist");
const INDEX_HTML = path.join(DIST, "index.html");

if (!fs.existsSync(INDEX_HTML)) {
  console.error(
    "dist/index.html does not exist — run `vite build` before generate-print-html.",
  );
  process.exit(1);
}

// Mirrors the `Language` union in src/data/cv.types.ts. Update both places
// when adding a new UI language. Kept in sync with generate-pdf.mjs.
const LANGUAGES = ["en", "sv"];

// Pull stylesheet links from dist/index.html so the print HTML references the
// same hashed CSS bundle (fonts + print rules). Scripts and modulepreloads
// are intentionally dropped — the static page must not hydrate.
function extractStylesheetTags(html) {
  const tags = [];
  const re = /<link\b[^>]*\brel=["']stylesheet["'][^>]*>/gi;
  let m;
  while ((m = re.exec(html)) !== null) tags.push(m[0]);
  return tags.join("\n    ");
}

const indexHtml = fs.readFileSync(INDEX_HTML, "utf8");
const stylesheetTags = extractStylesheetTags(indexHtml);

const server = await createServer({
  root: ROOT,
  configFile: path.join(ROOT, "vite.config.ts"),
  server: { middlewareMode: true },
  appType: "custom",
  logLevel: "error",
});

const cv = loadCv();

try {
  const printModule = await server.ssrLoadModule(
    "/src/components/PrintView.tsx",
  );
  const i18nModule = await server.ssrLoadModule("/src/utils/i18n.ts");

  const { PrintView } = printModule;
  const { LanguageContext, UI_STRINGS } = i18nModule;

  for (const lang of LANGUAGES) {
    const ctx = {
      lang,
      setLang: () => {},
      t: (value) => value[lang] ?? value.en,
      ui: UI_STRINGS[lang],
    };
    const tree = createElement(
      LanguageContext.Provider,
      { value: ctx },
      createElement(PrintView),
    );
    const body = renderToStaticMarkup(tree);

    const title = ctx.t(cv.meta.documentTitle);
    const description = ctx.t(cv.meta.description);

    const documentHtml = `<!doctype html>
<html lang="${lang}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="${escapeAttr(description)}" />
    <meta name="robots" content="noindex" />
    <title>${escapeText(title)}</title>
    ${stylesheetTags}
    <style>
      /* The bundled print stylesheet hides .print-view outside @media print
         so the SPA stays clean. The static print page is print-view-only —
         force it visible in screen mode too so puppeteer's pdf() pipeline
         (and humans hitting Cmd+P) both render the baked markup. */
      html, body { background: #fff; color: #111; margin: 0; }
      body::before { display: none !important; }
      .print-view { display: block !important; }
    </style>
  </head>
  <body>
    ${body}
  </body>
</html>
`;
    const outPath = path.join(DIST, `print-${lang}.html`);
    fs.writeFileSync(outPath, documentHtml);
    console.log(`Wrote ${path.relative(ROOT, outPath)}`);
  }
} finally {
  await server.close();
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
