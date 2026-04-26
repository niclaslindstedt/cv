// Emits dist/cv.pdf after `vite build`. Spins up a tiny static file server
// over dist/, drives a headless Chromium with Puppeteer, dispatches the
// site's `beforeprint` hook (so collapsed details expand), then writes the
// PDF using the print stylesheet defined in src/styles.css.

import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

import puppeteer from "puppeteer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DIST = path.join(ROOT, "dist");

if (!fs.existsSync(DIST)) {
  console.error("dist/ does not exist — run `vite build` before generate-pdf.");
  process.exit(1);
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
      // SPA fallback: any unknown route should serve index.html.
      filePath = path.join(DIST, "index.html");
      try {
        stat = fs.statSync(filePath);
      } catch {
        res.writeHead(404);
        res.end("Not found");
        return;
      }
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
const url = `http://127.0.0.1:${port}/`;

let browser;
try {
  browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  await page.emulateMediaType("print");
  await page.goto(url, { waitUntil: "networkidle0", timeout: 60_000 });

  // Mirror what main.tsx does on `beforeprint`: open every collapsed
  // <details class="assignments"> so the PDF includes their content.
  await page.evaluate(() => {
    document.querySelectorAll("details.assignments").forEach((d) => {
      d.open = true;
    });
    // Also dispatch the event in case any other component listens for it.
    window.dispatchEvent(new Event("beforeprint"));
  });

  const outPath = path.join(DIST, "cv.pdf");
  await page.pdf({
    path: outPath,
    format: "A4",
    printBackground: true,
    preferCSSPageSize: true,
    margin: { top: "1.5cm", right: "1.5cm", bottom: "1.5cm", left: "1.5cm" },
  });

  const { size } = fs.statSync(outPath);
  console.log(`Wrote ${path.relative(ROOT, outPath)} (${size} bytes).`);
} finally {
  if (browser) await browser.close();
  server.close();
}
