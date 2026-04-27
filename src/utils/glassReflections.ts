import { useEffect } from "react";

const SELECTOR =
  ".focus-item-btn, .project, .timeline-item, .education-list > li";

const ORB_COLOR = [220, 230, 245] as const;
const MOON_COLOR = [180, 200, 235] as const;
const LIGHT_SOURCE = { x: 0.5, y: 0.12 } as const;

type CardLayout = {
  el: HTMLElement;
  top: number;
  left: number;
  width: number;
  height: number;
  lastX: string;
  lastY: string;
  lastColor: string;
};

export function useGlassReflections() {
  useEffect(() => {
    let raf = 0;
    let cards: CardLayout[] = [];

    const measure = () => {
      const els = document.querySelectorAll<HTMLElement>(SELECTOR);
      const scrollX = window.scrollX;
      const scrollY = window.scrollY;
      cards = Array.from(els, (el) => {
        const rect = el.getBoundingClientRect();
        return {
          el,
          top: rect.top + scrollY,
          left: rect.left + scrollX,
          width: rect.width,
          height: rect.height,
          lastX: "",
          lastY: "",
          lastColor: "",
        };
      });
    };

    const update = () => {
      raf = 0;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const reach = Math.hypot(vw, vh) * 0.6;
      const isDark = document.documentElement.dataset.theme !== "light";
      const color = isDark ? MOON_COLOR : ORB_COLOR;
      const maxAlpha = isDark ? 0.45 : 0.55;
      const ox = LIGHT_SOURCE.x * vw;
      const oy = LIGHT_SOURCE.y * vh;
      const scrollX = window.scrollX;
      const scrollY = window.scrollY;
      for (const card of cards) {
        if (card.width === 0 || card.height === 0) continue;
        const viewportTop = card.top - scrollY;
        const viewportLeft = card.left - scrollX;
        if (viewportTop + card.height < -200 || viewportTop > vh + 200) {
          continue;
        }
        const cx = viewportLeft + card.width / 2;
        const cy = viewportTop + card.height / 2;
        const dist = Math.hypot(ox - cx, oy - cy);
        const intensity = Math.max(0, 1 - dist / reach);
        const alpha = (maxAlpha * intensity * intensity).toFixed(3);
        const lxStr = `${(((ox - viewportLeft) / card.width) * 100).toFixed(1)}%`;
        const lyStr = `${(((oy - viewportTop) / card.height) * 100).toFixed(1)}%`;
        const colorStr = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha})`;
        if (
          card.lastX === lxStr &&
          card.lastY === lyStr &&
          card.lastColor === colorStr
        ) {
          continue;
        }
        card.lastX = lxStr;
        card.lastY = lyStr;
        card.lastColor = colorStr;
        const style = card.el.style;
        style.setProperty("--reflect-1-x", lxStr);
        style.setProperty("--reflect-1-y", lyStr);
        style.setProperty("--reflect-1-color", colorStr);
      }
    };

    const schedule = () => {
      if (raf !== 0) return;
      raf = requestAnimationFrame(update);
    };

    const remeasure = () => {
      measure();
      schedule();
    };

    remeasure();

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", remeasure);

    const themeObserver = new MutationObserver(schedule);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    let lastBodyWidth = document.body.clientWidth;
    let lastBodyHeight = document.body.clientHeight;
    const resizeObserver = new ResizeObserver(() => {
      const w = document.body.clientWidth;
      const h = document.body.clientHeight;
      if (Math.abs(w - lastBodyWidth) < 1 && Math.abs(h - lastBodyHeight) < 8) {
        return;
      }
      lastBodyWidth = w;
      lastBodyHeight = h;
      remeasure();
    });
    resizeObserver.observe(document.body);

    const interval = window.setInterval(schedule, 60_000);

    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", remeasure);
      themeObserver.disconnect();
      resizeObserver.disconnect();
      window.clearInterval(interval);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
}
