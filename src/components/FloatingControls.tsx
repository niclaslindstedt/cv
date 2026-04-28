import { useEffect, useState } from "react";

import { useLang } from "../utils/i18n";
import type { Theme } from "../utils/theme";
import {
  LanguageToggleCompact,
  SearchButton,
  ThemeToggleCompact,
  TimelineLink,
} from "./Controls";

type Props = {
  timelineLabel: string;
  theme: Theme;
  onToggleTheme: () => void;
  onOpenSearch: () => void;
};

export function FloatingControls({
  timelineLabel,
  theme,
  onToggleTheme,
  onOpenSearch,
}: Props) {
  const { lang, setLang } = useLang();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const target = document.querySelector(".hero-meta");
    if (!target) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
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
    <div
      className={`floating-controls${scrolled ? " is-scrolled" : ""}`}
      aria-hidden={!scrolled}
    >
      <TimelineLink
        label={timelineLabel}
        className="floating-controls-timeline"
        iconOnly
      />
      <LanguageToggleCompact lang={lang} setLang={setLang} />
      <ThemeToggleCompact theme={theme} onToggleTheme={onToggleTheme} />
      <SearchButton
        onClick={onOpenSearch}
        className="floating-controls-search"
      />
    </div>
  );
}
