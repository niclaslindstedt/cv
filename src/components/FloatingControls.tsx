import { useEffect, useState } from "react";

import { useLang } from "../utils/i18n";
import type { Theme } from "../utils/theme";
import {
  LanguageToggleCompact,
  ThemeToggleCompact,
  TimelineButton,
} from "./Controls";

type Props = {
  timelineLabel: string;
  theme: Theme;
  onToggleTheme: () => void;
  onOpenTimeline: () => void;
  onOpenSearch: () => void;
};

export function FloatingControls({
  timelineLabel,
  theme,
  onToggleTheme,
  onOpenTimeline,
  onOpenSearch,
}: Props) {
  const { lang, setLang, ui } = useLang();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const target = document.querySelector(".hero-meta");
    if (!target) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Reveal the secondary controls once the hero has scrolled fully
        // off-screen.
        const scrolledPast =
          !entry.isIntersecting && entry.boundingClientRect.bottom < 0;
        setScrolled(scrolledPast);
      },
      { threshold: 0 },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  return (
    <div className={`floating-controls${scrolled ? " is-scrolled" : ""}`}>
      <div className="floating-controls-extra" aria-hidden={!scrolled}>
        <TimelineButton
          label={timelineLabel}
          onClick={onOpenTimeline}
          className="floating-controls-timeline"
          iconOnly
        />
        <LanguageToggleCompact lang={lang} setLang={setLang} />
        <ThemeToggleCompact theme={theme} onToggleTheme={onToggleTheme} />
      </div>
      <button
        type="button"
        className="floating-controls-search"
        onClick={onOpenSearch}
        aria-label={ui.search.open}
        title={ui.search.open}
      >
        <SearchIcon />
      </button>
    </div>
  );
}

function SearchIcon() {
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
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}
