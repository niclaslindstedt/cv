import type { CV } from "../data/cv.types";
import type { Theme } from "../utils/theme";

type Props = {
  cv: CV;
  theme: Theme;
  onToggleTheme: () => void;
  onOpenTimeline: () => void;
};

export function Hero({ cv, theme, onToggleTheme, onOpenTimeline }: Props) {
  const nextTheme = theme === "dark" ? "light" : "dark";
  return (
    <header className="hero">
      <p className="hero-eyebrow">{cv.title}</p>
      <h1 className="hero-name">{cv.name}</h1>
      <p className="hero-summary">{cv.summary}</p>
      <div className="hero-meta">
        <span>{cv.location}</span>
        <a
          className="hero-blog"
          href={cv.links.blog}
          target="_blank"
          rel="noreferrer"
        >
          Blog ↗
        </a>
        <a href={cv.links.github} target="_blank" rel="noreferrer">
          GitHub
        </a>
        <a href={cv.links.linkedin} target="_blank" rel="noreferrer">
          LinkedIn
        </a>
        <button
          type="button"
          className="hero-timeline-btn"
          onClick={onOpenTimeline}
        >
          Timeline view
        </button>
        <button
          type="button"
          className="hero-download"
          onClick={() => window.print()}
          aria-label="Download CV as PDF (opens print dialog)"
        >
          Download PDF ↓
        </button>
        <button
          type="button"
          className="theme-toggle"
          onClick={onToggleTheme}
          aria-label={`Switch to ${nextTheme} mode`}
          title={`Switch to ${nextTheme} mode`}
        >
          {theme === "dark" ? <SunIcon /> : <MoonIcon />}
        </button>
      </div>
    </header>
  );
}

function SunIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m4.93 19.07 1.41-1.41" />
      <path d="m17.66 6.34 1.41-1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}
