import { useEffect } from "react";

const SELECTOR =
  ".focus-item-btn, .project, .timeline-item, .education-list > li";

const ORBS = [
  { x: 0.18, y: 0.12, color: "rgba(140, 200, 255, 0.55)" },
  { x: 0.82, y: 0.28, color: "rgba(200, 150, 255, 0.5)" },
  { x: 0.58, y: 0.88, color: "rgba(140, 230, 210, 0.45)" },
];

export function useGlassReflections() {
  useEffect(() => {
    let raf = 0;
    let scheduled = false;

    const update = () => {
      raf = 0;
      scheduled = false;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const reach = Math.hypot(vw, vh) * 0.55;
      const cards = document.querySelectorAll<HTMLElement>(SELECTOR);
      cards.forEach((card) => {
        const rect = card.getBoundingClientRect();
        if (
          rect.bottom < -200 ||
          rect.top > vh + 200 ||
          rect.width === 0 ||
          rect.height === 0
        ) {
          card.style.setProperty("--reflect-intensity", "0");
          return;
        }
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        let bestIntensity = 0;
        let bestX = 50;
        let bestY = 50;
        let bestColor = "transparent";
        for (const orb of ORBS) {
          const ox = orb.x * vw;
          const oy = orb.y * vh;
          const dist = Math.hypot(ox - cx, oy - cy);
          const intensity = Math.max(0, 1 - dist / reach);
          if (intensity > bestIntensity) {
            bestIntensity = intensity;
            bestX = ((ox - rect.left) / rect.width) * 100;
            bestY = ((oy - rect.top) / rect.height) * 100;
            bestColor = orb.color;
          }
        }
        card.style.setProperty("--reflect-x", `${bestX.toFixed(1)}%`);
        card.style.setProperty("--reflect-y", `${bestY.toFixed(1)}%`);
        card.style.setProperty("--reflect-color", bestColor);
        card.style.setProperty("--reflect-intensity", bestIntensity.toFixed(3));
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

    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      observer.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
}
