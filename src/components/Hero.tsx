import type { CV, Language } from "../data/cv.types";
import { useLang } from "../utils/i18n";
import type { Theme } from "../utils/theme";

type Props = {
  cv: CV;
  theme: Theme;
  onToggleTheme: () => void;
  onOpenTimeline: () => void;
  onOpenSummary: () => void;
};

export function Hero({
  cv,
  theme,
  onToggleTheme,
  onOpenTimeline,
  onOpenSummary,
}: Props) {
  const { lang, setLang, t, ui } = useLang();
  return (
    <header className="hero">
      <p className="hero-eyebrow">{ui.hero.eyebrow}</p>
      <h1 className="hero-name">{cv.name}</h1>
      <button
        type="button"
        className="hero-summary"
        onClick={onOpenSummary}
        aria-label={ui.summaryModal.detailAria(cv.name)}
      >
        <span className="hero-summary-text">{t(cv.summary)}</span>
        <span className="hero-summary-hint" aria-hidden="true">
          {ui.summaryModal.readMore}
        </span>
      </button>
      <div className="hero-meta">
        <span>{t(cv.location)}</span>
        {cv.links.map((link) => (
          <a
            key={link.url}
            className={link.featured ? "hero-blog" : undefined}
            href={link.url}
            target="_blank"
            rel="noreferrer"
          >
            {t(link.label)}
          </a>
        ))}
        <button
          type="button"
          className="hero-timeline-btn"
          onClick={onOpenTimeline}
        >
          {t(cv.actions.timeline)}
        </button>
        <button
          type="button"
          className="hero-download"
          onClick={() => window.print()}
          aria-label={ui.hero.downloadAria}
        >
          {t(cv.actions.downloadPdf)}
        </button>
        <LanguageToggle lang={lang} setLang={setLang} />
        <ThemeToggle theme={theme} onToggleTheme={onToggleTheme} />
      </div>
    </header>
  );
}

function ThemeToggle({
  theme,
  onToggleTheme,
}: {
  theme: Theme;
  onToggleTheme: () => void;
}) {
  const { ui } = useLang();
  const select = (target: Theme) => {
    if (target !== theme) onToggleTheme();
  };
  return (
    <div className="theme-toggle" role="group" aria-label="Theme">
      <button
        type="button"
        className="theme-toggle-btn"
        aria-pressed={theme === "light"}
        aria-label={ui.theme.switchToLight}
        title={ui.theme.light}
        onClick={() => select("light")}
      >
        <SunIcon />
      </button>
      <button
        type="button"
        className="theme-toggle-btn"
        aria-pressed={theme === "dark"}
        aria-label={ui.theme.switchToDark}
        title={ui.theme.dark}
        onClick={() => select("dark")}
      >
        <MoonIcon />
      </button>
    </div>
  );
}

function LanguageToggle({
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
    <svg viewBox="0 0 60 30" aria-hidden="true" role="img">
      <clipPath id="flag-sv-clip">
        <rect width="60" height="30" rx="3" />
      </clipPath>
      <g clipPath="url(#flag-sv-clip)">
        <rect width="60" height="30" fill="#006AA7" />
        <rect x="18" width="6" height="30" fill="#FECC00" />
        <rect y="12" width="60" height="6" fill="#FECC00" />
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
