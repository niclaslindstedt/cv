import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import { LanguageProvider } from "./utils/LanguageProvider";
import "@fontsource-variable/eb-garamond/wght.css";
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

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <LanguageProvider>
      <App />
    </LanguageProvider>
  </React.StrictMode>,
);
