import type { Language } from "../data/cv.types";
import { useLang } from "../utils/i18n";
import type { Theme } from "../utils/theme";

export function TimelineButton({
  label,
  onClick,
  className = "hero-timeline-btn",
  iconOnly = false,
}: {
  label: string;
  onClick: () => void;
  className?: string;
  iconOnly?: boolean;
}) {
  return (
    <button
      type="button"
      className={className}
      onClick={onClick}
      aria-label={iconOnly ? label : undefined}
      title={iconOnly ? label : undefined}
    >
      <TimelineIcon />
      {!iconOnly && <span>{label}</span>}
    </button>
  );
}

export function ThemeToggle({
  theme,
  onToggleTheme,
}: {
  theme: Theme;
  onToggleTheme: () => void;
}) {
  const { ui } = useLang();
  const isDark = theme === "dark";
  return (
    <div className="theme-toggle" role="group" aria-label={ui.theme.label}>
      <button
        type="button"
        className="theme-toggle-btn"
        aria-pressed={!isDark}
        aria-label={ui.theme.switchToLight}
        title={ui.theme.light}
        onClick={isDark ? onToggleTheme : undefined}
      >
        <SunIcon />
      </button>
      <button
        type="button"
        className="theme-toggle-btn"
        aria-pressed={isDark}
        aria-label={ui.theme.switchToDark}
        title={ui.theme.dark}
        onClick={isDark ? undefined : onToggleTheme}
      >
        <MoonIcon />
      </button>
    </div>
  );
}

export function LanguageToggle({
  lang,
  setLang,
}: {
  lang: Language;
  setLang: (lang: Language) => void;
}) {
  const { ui } = useLang();
  return (
    <div className="lang-toggle" role="group" aria-label="Language">
      <button
        type="button"
        className="lang-toggle-btn"
        aria-pressed={lang === "en"}
        aria-label={ui.hero.languageEnglish}
        title={ui.hero.languageEnglish}
        onClick={() => setLang("en")}
      >
        <FlagEN />
      </button>
      <button
        type="button"
        className="lang-toggle-btn"
        aria-pressed={lang === "sv"}
        aria-label={ui.hero.languageSwedish}
        title={ui.hero.languageSwedish}
        onClick={() => setLang("sv")}
      >
        <FlagSV />
      </button>
    </div>
  );
}

function TimelineIcon() {
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
      <path d="M3 12h18" />
      <circle cx="6" cy="12" r="2.25" fill="currentColor" />
      <circle cx="12" cy="12" r="2.25" fill="currentColor" />
      <circle cx="18" cy="12" r="2.25" fill="currentColor" />
    </svg>
  );
}

function FlagEN() {
  return (
    <svg viewBox="0 0 60 30" aria-hidden="true" role="img">
      <clipPath id="flag-en-clip">
        <rect width="60" height="30" rx="3" />
      </clipPath>
      <g clipPath="url(#flag-en-clip)">
        <rect width="60" height="30" fill="#012169" />
        <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
        <path
          d="M0,0 L60,30 M60,0 L0,30"
          stroke="#C8102E"
          strokeWidth="2"
          clipPath="url(#flag-en-clip)"
        />
        <path d="M30,0 V30 M0,15 H60" stroke="#fff" strokeWidth="10" />
        <path d="M30,0 V30 M0,15 H60" stroke="#C8102E" strokeWidth="6" />
      </g>
    </svg>
  );
}

function FlagSV() {
  return (
    <svg viewBox="0 0 16 10" aria-hidden="true" role="img">
      <clipPath id="flag-sv-clip">
        <rect width="16" height="10" rx="0.8" />
      </clipPath>
      <g clipPath="url(#flag-sv-clip)">
        <rect width="16" height="10" fill="#006AA7" />
        <rect x="5" width="2" height="10" fill="#FECC00" />
        <rect y="4" width="16" height="2" fill="#FECC00" />
      </g>
    </svg>
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
