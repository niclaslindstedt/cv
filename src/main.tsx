import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import { LanguageProvider } from "./utils/LanguageProvider";
import "@fontsource-variable/eb-garamond/wght.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "./styles.css";

if (typeof window !== "undefined") {
  const openedForPrint = new Set<HTMLDetailsElement>();
  window.addEventListener("beforeprint", () => {
    document
      .querySelectorAll<HTMLDetailsElement>("details.assignments")
      .forEach((d) => {
        if (!d.open) {
          d.open = true;
          openedForPrint.add(d);
        }
      });
  });
  window.addEventListener("afterprint", () => {
    openedForPrint.forEach((d) => {
      d.open = false;
    });
    openedForPrint.clear();
  });
}

// scripts/generate-static-index.mjs ships a pre-rendered <App /> inside
// #root so crawlers and no-JS clients see the full resume. Clear it first
// so React starts from an empty container — we deliberately don't hydrate
// because the server-render is locked to en / dark, and any visitor with
// a different stored language or theme would otherwise hit a hydration
// mismatch on every load.
const rootEl = document.getElementById("root")!;
while (rootEl.firstChild) rootEl.removeChild(rootEl.firstChild);

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </React.StrictMode>,
);
