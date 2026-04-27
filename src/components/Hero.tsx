import type { CV } from "../data/cv.types";
import { useLang } from "../utils/i18n";
import type { Theme } from "../utils/theme";
import { LanguageToggle, ThemeToggle, TimelineButton } from "./Controls";

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
      <p className="hero-long-summary" aria-hidden="true">
        {t(cv.longSummary)}
      </p>
      <div className="hero-meta">
        {cv.links.map((link) => (
          <a
            key={link.url}
            className={link.featured ? "hero-link-pill" : undefined}
            href={link.url}
            target="_blank"
            rel="noreferrer"
          >
            {t(link.label)}
          </a>
        ))}
        <TimelineButton
          label={t(cv.actions.timeline)}
          onClick={onOpenTimeline}
        />
        <a
          className="hero-download"
          href="cv.pdf"
          download="niclas-lindstedt-cv.pdf"
          aria-label={ui.hero.downloadAria}
        >
          {t(cv.actions.downloadPdf)}
        </a>
        <LanguageToggle lang={lang} setLang={setLang} />
        <ThemeToggle theme={theme} onToggleTheme={onToggleTheme} />
      </div>
    </header>
  );
}
