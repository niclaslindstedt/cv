import { useEffect } from "react";

import type { Theme } from "../utils/theme";

type Props = { theme: Theme };

const CLOUDS = [
  { x: 14, y: 22, size: 54, alpha: 0.55, drift: 240, delay: 0 },
  { x: 78, y: 17, size: 44, alpha: 0.45, drift: 180, delay: -60 },
  { x: 62, y: 54, size: 64, alpha: 0.35, drift: 320, delay: -120 },
  { x: 22, y: 71, size: 56, alpha: 0.4, drift: 280, delay: -40 },
  { x: 88, y: 62, size: 40, alpha: 0.38, drift: 200, delay: -90 },
];

const AMBIENT_ORBS = [
  { x: 18, y: 30, size: 72, alpha: 0.16, duration: 16, delay: 0 },
  { x: 84, y: 70, size: 86, alpha: 0.13, duration: 19, delay: -80 },
  { x: 66, y: 22, size: 46, alpha: 0.18, duration: 14, delay: -40 },
  { x: 30, y: 78, size: 54, alpha: 0.15, duration: 17, delay: -120 },
  { x: 52, y: 52, size: 30, alpha: 0.2, duration: 12, delay: -60 },
  { x: 6, y: 60, size: 26, alpha: 0.16, duration: 15, delay: -100 },
];

type Star = {
  x: number;
  y: number;
  size: number;
  alpha: number;
  delay: number;
  duration: number;
  hue: number;
};

function makeStars(count: number, seed = 1337): Star[] {
  let s = seed >>> 0;
  const rand = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
  const stars: Star[] = [];
  for (let i = 0; i < count; i++) {
    const r = rand();
    const size = r < 0.78 ? 2 + r * 2 : r < 0.96 ? 4 + r * 2 : 6 + r * 3;
    stars.push({
      x: rand() * 100,
      y: rand() * 100,
      size,
      alpha: 0.35 + rand() * 0.55,
      delay: -rand() * 6,
      duration: 2.2 + rand() * 4.8,
      hue: 200 + Math.floor(rand() * 60),
    });
  }
  return stars;
}

const STARS = makeStars(16);

export function CelestialSky({ theme }: Props) {
  useEffect(() => {
    const root = document.documentElement;
    if (theme !== "dark") {
      root.style.setProperty("--scroll-progress", "0");
      return;
    }
    let raf = 0;
    const update = () => {
      raf = 0;
      const max = Math.max(
        document.documentElement.scrollHeight - window.innerHeight,
        1,
      );
      const progress = Math.min(Math.max(window.scrollY / max, 0), 1);
      root.style.setProperty("--scroll-progress", progress.toFixed(4));
    };
    const onScroll = () => {
      if (raf !== 0) return;
      raf = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf !== 0) window.cancelAnimationFrame(raf);
    };
  }, [theme]);

  return (
    <div className="celestial-sky" aria-hidden="true">
      {theme === "dark" ? (
        <>
          <div className="atmosphere" />
          <div className="starfield">
            {STARS.map((star, i) => (
              <span
                key={i}
                className="star"
                style={
                  {
                    left: `${star.x}%`,
                    top: `${star.y}%`,
                    width: `${star.size}px`,
                    height: `${star.size}px`,
                    "--star-alpha": star.alpha,
                    "--star-delay": `${star.delay}s`,
                    "--star-duration": `${star.duration}s`,
                    "--star-hue": star.hue,
                  } as React.CSSProperties
                }
              />
            ))}
          </div>
          <div className="horizon" />
        </>
      ) : (
        <>
          <div className="cloudfield">
            {CLOUDS.map((cloud, i) => (
              <span
                key={i}
                className="cloud"
                style={
                  {
                    left: `${cloud.x}%`,
                    top: `${cloud.y}%`,
                    width: `${cloud.size}vmin`,
                    height: `${cloud.size * 0.55}vmin`,
                    "--cloud-alpha": cloud.alpha,
                    "--cloud-drift": `${cloud.drift}s`,
                    "--cloud-delay": `${cloud.delay}s`,
                  } as React.CSSProperties
                }
              />
            ))}
          </div>
          <div className="orbfield">
            {AMBIENT_ORBS.map((orb, i) => (
              <span
                key={i}
                className="ambient-orb"
                style={
                  {
                    left: `${orb.x}%`,
                    top: `${orb.y}%`,
                    width: `${orb.size}vmin`,
                    height: `${orb.size}vmin`,
                    "--orb-alpha": orb.alpha,
                    "--orb-duration": `${orb.duration}s`,
                    "--orb-delay": `${orb.delay}s`,
                  } as React.CSSProperties
                }
              />
            ))}
          </div>
          <div className="celestial orb" aria-label="Orb">
            <div className="orb-halo" />
            <div className="orb-body" />
            <div className="orb-ring" />
          </div>
        </>
      )}
    </div>
  );
}
