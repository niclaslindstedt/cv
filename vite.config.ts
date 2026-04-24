import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

import cv from "./src/data/cv.json";

function cvMetaHtmlPlugin(): Plugin {
  return {
    name: "cv-meta-html",
    transformIndexHtml(html) {
      return html
        .replace(
          /<title>[^<]*<\/title>/,
          `<title>${cv.meta.documentTitle}</title>`,
        )
        .replace(
          /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/,
          `<meta name="description" content="${cv.meta.description}" />`,
        );
    },
  };
}

export default defineConfig({
  plugins: [react(), cvMetaHtmlPlugin()],
  base: "/",
});
