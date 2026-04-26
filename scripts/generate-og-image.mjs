// Build-time renderer for the site's single OG card. Reads name/title/summary
// from src/data/cv.json and writes a 1200x630 PNG to public/og-image.png so
// Vite copies it into dist/. Pure Node — no Chromium, runs cleanly in CI.
//
// Mirrors the dark theme palette from src/styles.css.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import wawoff from "wawoff2";

import { loadCv } from "../src/data/load-cv.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const cv = loadCv();

const WIDTH = 1200;
const HEIGHT = 630;
const BG = "#050810";
const BG_ELEV = "#0c1322";
const ACCENT = "#7ab7ff";
const FG = "#e6e9ef";
const FG_MUTED = "#8a93a1";

const FONTS_DIR = path.join(ROOT, "node_modules/@fontsource/inter/files");

async function loadTtf(file) {
  const woff2 = fs.readFileSync(path.join(FONTS_DIR, file));
  const ttf = await wawoff.decompress(woff2);
  return Buffer.from(ttf);
}

// wawoff2 shares WASM heap state, so decompress sequentially.
const interRegular = await loadTtf("inter-latin-400-normal.woff2");
const interBold = await loadTtf("inter-latin-700-normal.woff2");

const host = new URL(cv.meta.siteUrl).host;

function text(value, style) {
  return { type: "div", props: { style, children: value } };
}

function template() {
  return {
    type: "div",
    props: {
      style: {
        width: `${WIDTH}px`,
        height: `${HEIGHT}px`,
        display: "flex",
        flexDirection: "row",
        background: `linear-gradient(135deg, ${BG} 0%, ${BG_ELEV} 100%)`,
        fontFamily: "Inter",
        color: FG,
      },
      children: [
        {
          type: "div",
          props: {
            style: { width: "14px", height: "100%", backgroundColor: ACCENT },
          },
        },
        {
          type: "div",
          props: {
            style: {
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              padding: "80px 90px",
            },
            children: [
              text(host, {
                fontSize: "26px",
                color: FG_MUTED,
                fontWeight: 400,
                letterSpacing: "0.04em",
              }),
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    flexDirection: "column",
                    gap: "18px",
                  },
                  children: [
                    text(cv.name, {
                      fontSize: "84px",
                      fontWeight: 700,
                      lineHeight: 1.05,
                      color: FG,
                    }),
                    text(cv.title.en, {
                      fontSize: "42px",
                      fontWeight: 400,
                      color: ACCENT,
                    }),
                  ],
                },
              },
              text(cv.meta.description.en, {
                fontSize: "26px",
                color: FG_MUTED,
                fontWeight: 400,
                lineHeight: 1.4,
              }),
            ],
          },
        },
      ],
    },
  };
}

const svg = await satori(template(), {
  width: WIDTH,
  height: HEIGHT,
  fonts: [
    { name: "Inter", data: interRegular, weight: 400, style: "normal" },
    { name: "Inter", data: interBold, weight: 700, style: "normal" },
  ],
});

const png = new Resvg(svg, { fitTo: { mode: "width", value: WIDTH } })
  .render()
  .asPng();

const outPath = path.join(ROOT, "public/og-image.png");
fs.writeFileSync(outPath, png);
console.log(
  `Wrote ${path.relative(ROOT, outPath)} (${WIDTH}x${HEIGHT}, ${png.length} bytes).`,
);
