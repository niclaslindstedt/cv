import { useEffect } from "react";

import { getMoonPosition, getSunPosition } from "./celestial";

const SELECTOR =
  ".focus-item-btn, .project, .timeline-item, .education-list > li";

const SUN_COLOR = [255, 210, 130];
const MOON_COLOR = [180, 200, 235];

export function useGlassReflections() {
  useEffect(() => {
    let raf = 0;
    let scheduled = false;

    const update = () => {
      raf = 0;
      scheduled = false;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const reach = Math.hypot(vw, vh) * 0.6;
      const isDark = document.documentElement.dataset.theme !== "light";
      const pos = isDark ? getMoonPosition() : getSunPosition();
      const color = isDark ? MOON_COLOR : SUN_COLOR;
      const maxAlpha = isDark ? 0.18 : 0.28;
      const ox = pos.x * vw;
      const oy = pos.y * vh;
      const cards = document.querySelectorAll<HTMLElement>(SELECTOR);
      cards.forEach((card) => {
        const rect = card.getBoundingClientRect();
        if (
          rect.bottom < -200 ||
          rect.top > vh + 200 ||
          rect.width === 0 ||
          rect.height === 0
        ) {
          return;
        }
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dist = Math.hypot(ox - cx, oy - cy);
        const intensity = Math.max(0, 1 - dist / reach);
        const alpha = (maxAlpha * intensity * intensity).toFixed(3);
        const lx = ((ox - rect.left) / rect.width) * 100;
        const ly = ((oy - rect.top) / rect.height) * 100;
        card.style.setProperty("--reflect-1-x", `${lx.toFixed(1)}%`);
        card.style.setProperty("--reflect-1-y", `${ly.toFixed(1)}%`);
        card.style.setProperty(
          "--reflect-1-color",
          `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha})`,
        );
        card.style.setProperty("--reflect-2-color", "transparent");
        card.style.setProperty("--reflect-3-color", "transparent");
      });
    };

    const schedule = () => {
      if (scheduled) return;
      scheduled = true;
      raf = requestAnimationFrame(update);
    };

    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);

    const observer = new MutationObserver(schedule);
    observer.observe(document.body, { childList: true, subtree: true });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme", "style"],
    });

    const interval = window.setInterval(schedule, 60_000);

    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      observer.disconnect();
      window.clearInterval(interval);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
}
