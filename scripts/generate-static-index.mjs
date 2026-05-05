// Pre-renders <App /> into dist/index.html so the homepage exposes its full
// content as static HTML. Crawlers, LLMs, and any client that doesn't run
// JavaScript get the resume content directly from the document instead of
// the empty `<div id="root"></div>` Vite normally ships.
//
// The browser still owns rendering: src/main.tsx clears #root before mounting
// so React starts from a clean slate, with whatever language and theme the
// user actually has stored. That's why this is a one-shot static dump rather
// than a hydrated tree — it sidesteps the hydration mismatches that would
// otherwise hit any visitor whose stored language is "sv" or theme is "light"
// (the SSR pass always emits the EN / dark default).
//
// Renders the existing src/App.tsx via Vite SSR + react-dom/server — same
// pattern as scripts/generate-print-html.mjs. Pure markup, no scripts; the
// real bundle is already wired into dist/index.html via vite build.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DIST = path.join(ROOT, "dist");
const INDEX_HTML = path.join(DIST, "index.html");

if (!fs.existsSync(INDEX_HTML)) {
  console.error(
    "dist/index.html does not exist — run `vite build` before generate-static-index.",
  );
  process.exit(1);
}

const indexHtml = fs.readFileSync(INDEX_HTML, "utf8");
if (!/<div id="root"><\/div>/.test(indexHtml)) {
  console.error(
    'generate-static-index: expected an empty `<div id="root"></div>` in dist/index.html — the Vite output shape changed.',
  );
  process.exit(1);
}

const server = await createServer({
  root: ROOT,
  configFile: path.join(ROOT, "vite.config.ts"),
  server: { middlewareMode: true },
  appType: "custom",
  logLevel: "error",
});

try {
  const appModule = await server.ssrLoadModule("/src/App.tsx");
  const i18nModule = await server.ssrLoadModule("/src/utils/i18n.ts");

  const { App } = appModule;
  const { LanguageContext, UI_STRINGS } = i18nModule;

  const ctx = {
    lang: "en",
    setLang: () => {},
    t: (value) => value.en,
    ui: UI_STRINGS.en,
  };

  const tree = createElement(
    LanguageContext.Provider,
    { value: ctx },
    createElement(App),
  );
  const body = renderToStaticMarkup(tree);

  const out = indexHtml.replace(
    '<div id="root"></div>',
    `<div id="root">${body}</div>`,
  );
  fs.writeFileSync(INDEX_HTML, out);
  console.log(
    `Wrote ${path.relative(ROOT, INDEX_HTML)} with SSR content (${body.length.toLocaleString()} chars).`,
  );
} finally {
  await server.close();
}
