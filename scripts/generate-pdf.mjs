// Emits one dist/<base>-<lang>.pdf per supported UI language after
// `vite build` (e.g. dist/cv-en.pdf and dist/cv-sv.pdf). Loads the static
// dist/print-<lang>.html pages produced by generate-print-html.mjs through
// a tiny static file server over dist/, then drives a headless Chromium
// with Puppeteer to print them. The pre-rendered markup means we don't
// have to wait for the SPA to hydrate or expand collapsed <details>; the
// page is already in its final printable form. With CV_LOCAL=1 the local
// override is applied at print.json bake time, which is the canonical way
// to bake private PDFs under a different filename base.

import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

import puppeteer from "puppeteer";

import { loadCv } from "../src/data/load-cv.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DIST = path.join(ROOT, "dist");

if (!fs.existsSync(DIST)) {
  console.error("dist/ does not exist — run `vite build` before generate-pdf.");
  process.exit(1);
}

const DEFAULT_PDF_FILENAME = "cv.pdf";
// Mirrors the `Language` union in src/data/cv.types.ts. Update both
// places when adding a new UI language. Kept in sync with
// generate-print-html.mjs.
const LANGUAGES = ["en", "sv"];
const cv = loadCv();
const pdfFilename = cv.print?.pdfFilename ?? DEFAULT_PDF_FILENAME;
if (path.basename(pdfFilename) !== pdfFilename) {
  console.error(
    `Invalid cv.print.pdfFilename "${pdfFilename}" — must be a bare filename without directory separators.`,
  );
  process.exit(1);
}

for (const lang of LANGUAGES) {
  const printHtml = path.join(DIST, `print-${lang}.html`);
  if (!fs.existsSync(printHtml)) {
    console.error(
      `${path.relative(ROOT, printHtml)} is missing — run \`generate:print-html\` before generate-pdf.`,
    );
    process.exit(1);
  }
}

function pdfFilenameFor(base, lang) {
  const ext = path.extname(base);
  const stem = ext ? base.slice(0, -ext.length) : base;
  return `${stem}-${lang}${ext}`;
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".pdf": "application/pdf",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
};

function safeJoin(root, urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0].split("#")[0]);
  const normalized = path
    .normalize(decoded)
    .replace(/^([/\\])+/, "")
    .replace(/\\/g, "/");
  const resolved = path.join(root, normalized);
  if (!resolved.startsWith(root)) return null;
  return resolved;
}

function serveDist() {
  const server = http.createServer((req, res) => {
    const target = safeJoin(DIST, req.url || "/");
    if (!target) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }
    let filePath = target;
    let stat;
    try {
      stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        filePath = path.join(filePath, "index.html");
        stat = fs.statSync(filePath);
      }
    } catch {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    const type =
      MIME[path.extname(filePath).toLowerCase()] ?? "application/octet-stream";
    res.writeHead(200, {
      "Content-Type": type,
      "Content-Length": stat.size,
    });
    fs.createReadStream(filePath).pipe(res);
  });
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      resolve({ server, port });
    });
  });
}

const { server, port } = await serveDist();
const url = `http://127.0.0.1:${port}`;

let browser;
try {
  browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  for (const lang of LANGUAGES) {
    const page = await browser.newPage();
    await page.emulateMediaType("print");
    await page.goto(`${url}/print-${lang}.html`, {
      waitUntil: "networkidle0",
      timeout: 60_000,
    });

    const outPath = path.join(DIST, pdfFilenameFor(pdfFilename, lang));
    await page.pdf({
      path: outPath,
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: "1.5cm", right: "1.5cm", bottom: "1.5cm", left: "1.5cm" },
    });
    await page.close();

    const { size } = fs.statSync(outPath);
    console.log(`Wrote ${path.relative(ROOT, outPath)} (${size} bytes).`);
  }
} finally {
  if (browser) await browser.close();
  server.close();
}
