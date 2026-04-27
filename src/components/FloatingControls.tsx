import { useEffect, useState } from "react";

import { useLang } from "../utils/i18n";
import type { Theme } from "../utils/theme";
import { LanguageToggle, ThemeToggle, TimelineButton } from "./Controls";

type Props = {
  timelineLabel: string;
  theme: Theme;
  onToggleTheme: () => void;
  onOpenTimeline: () => void;
};

export function FloatingControls({
  timelineLabel,
  theme,
  onToggleTheme,
  onOpenTimeline,
}: Props) {
  const { lang, setLang } = useLang();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const target = document.querySelector(".hero-meta");
    if (!target) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Show once the hero controls have scrolled fully off-screen.
        const scrolledPast =
          !entry.isIntersecting && entry.boundingClientRect.bottom < 0;
        setVisible(scrolledPast);
      },
      { threshold: 0 },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className={`floating-controls${visible ? " is-visible" : ""}`}
      aria-hidden={!visible}
    >
      <TimelineButton
        label={timelineLabel}
        onClick={onOpenTimeline}
        className="floating-controls-timeline"
        iconOnly
      />
      <LanguageToggle lang={lang} setLang={setLang} />
      <ThemeToggle theme={theme} onToggleTheme={onToggleTheme} />
    </div>
  );
}
