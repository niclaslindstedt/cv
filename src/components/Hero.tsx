import type { CV } from "../data/cv.types";
import { useLang } from "../utils/i18n";
import type { Theme } from "../utils/theme";
import { LanguageToggle, SearchButton, ThemeToggle } from "./Controls";

type Props = {
  cv: CV;
  theme: Theme;
  onToggleTheme: () => void;
  onOpenTimeline: () => void;
  onOpenSummary: () => void;
  onOpenSearch: () => void;
};

export function Hero({
  cv,
  theme,
  onToggleTheme,
  onOpenTimeline,
  onOpenSummary,
  onOpenSearch,
}: Props) {
  const { lang, setLang, t, ui } = useLang();
  const pdfBase = cv.print.pdfFilename ?? "cv.pdf";
  const pdfDot = pdfBase.lastIndexOf(".");
  const pdfStem = pdfDot > 0 ? pdfBase.slice(0, pdfDot) : pdfBase;
  const pdfExt = pdfDot > 0 ? pdfBase.slice(pdfDot) : "";
  const pdfHref = `${pdfStem}-${lang}${pdfExt}`;
  const pdfDownloadName = `niclas-lindstedt-cv-${lang}${pdfExt}`;
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
        <button
          type="button"
          className="hero-timeline-btn"
          onClick={onOpenTimeline}
        >
          {t(cv.actions.timeline)}
        </button>
        <a
          className="hero-download"
          href={pdfHref}
          download={pdfDownloadName}
          aria-label={ui.hero.downloadAria}
        >
          {t(cv.actions.downloadPdf)}
        </a>
        <LanguageToggle lang={lang} setLang={setLang} />
        <ThemeToggle theme={theme} onToggleTheme={onToggleTheme} />
        <SearchButton onClick={onOpenSearch} />
      </div>
    </header>
  );
}
