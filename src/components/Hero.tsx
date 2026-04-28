import type { CV } from "../data/cv.types";
import { useLang } from "../utils/i18n";
import type { Theme } from "../utils/theme";
import {
  LanguageToggle,
  SearchButton,
  ThemeToggle,
  TimelineLink,
} from "./Controls";

type Props = {
  cv: CV;
  theme: Theme;
  onToggleTheme: () => void;
  onOpenSummary: () => void;
  onOpenSearch: () => void;
};

export function Hero({
  cv,
  theme,
  onToggleTheme,
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
        <TimelineLink label={ui.hero.timeline} />
        <a
          className="hero-download"
          href={pdfHref}
          download={pdfDownloadName}
          aria-label={ui.hero.downloadAria}
        >
          <PdfIcon />
          <span>{ui.hero.pdf}</span>
        </a>
        <LanguageToggle lang={lang} setLang={setLang} />
        <ThemeToggle theme={theme} onToggleTheme={onToggleTheme} />
        <SearchButton onClick={onOpenSearch} />
      </div>
    </header>
  );
}

function PdfIcon() {
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
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
    </svg>
  );
}
