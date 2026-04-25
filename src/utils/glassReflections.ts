import { useEffect } from "react";

const SELECTOR =
  ".focus-item-btn, .project, .timeline-item, .education-list > li";

const ORBS = [
  { x: 0.18, y: 0.12, color: [140, 200, 255], maxAlpha: 0.18 },
  { x: 0.82, y: 0.28, color: [200, 150, 255], maxAlpha: 0.16 },
  { x: 0.58, y: 0.88, color: [140, 230, 210], maxAlpha: 0.14 },
] as const;

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
          return;
        }
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        ORBS.forEach((orb, i) => {
          const ox = orb.x * vw;
          const oy = orb.y * vh;
          const dist = Math.hypot(ox - cx, oy - cy);
          const intensity = Math.max(0, 1 - dist / reach);
          const alpha = (orb.maxAlpha * intensity * intensity).toFixed(3);
          const lx = ((ox - rect.left) / rect.width) * 100;
          const ly = ((oy - rect.top) / rect.height) * 100;
          const idx = i + 1;
          card.style.setProperty(`--reflect-${idx}-x`, `${lx.toFixed(1)}%`);
          card.style.setProperty(`--reflect-${idx}-y`, `${ly.toFixed(1)}%`);
          card.style.setProperty(
            `--reflect-${idx}-color`,
            `rgba(${orb.color[0]}, ${orb.color[1]}, ${orb.color[2]}, ${alpha})`,
          );
        });
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
