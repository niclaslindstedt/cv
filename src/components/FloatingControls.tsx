import { useEffect, useState } from "react";

import { useLang } from "../utils/i18n";
import type { Theme } from "../utils/theme";
import {
  LanguageToggleCompact,
  ThemeToggleCompact,
  TimelineLink,
} from "./Controls";

type Props = {
  timelineLabel: string;
  theme: Theme;
  onToggleTheme: () => void;
  onOpenSearch: () => void;
};

const SCROLL_DIRECTION_THRESHOLD_PX = 4;
const OVERSCROLL_PULL_THRESHOLD_PX = 24;

export function FloatingControls({
  timelineLabel,
  theme,
  onToggleTheme,
  onOpenSearch,
}: Props) {
  const { lang, setLang, ui } = useLang();
  const [scrolled, setScrolled] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);

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

  useEffect(() => {
    // Reveal the search field only when the user scrolls up. At the very
    // top of the page that means an overscroll/pull-down — the standard
    // pattern for summoning a search bar in native applications.
    let lastY = window.scrollY;
    let touchStartY = 0;
    let touching = false;

    const onScroll = () => {
      const y = window.scrollY;
      const dy = y - lastY;
      if (dy < -SCROLL_DIRECTION_THRESHOLD_PX) setSearchVisible(true);
      else if (dy > SCROLL_DIRECTION_THRESHOLD_PX) setSearchVisible(false);
      lastY = y;
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) {
        touching = false;
        return;
      }
      touching = true;
      touchStartY = e.touches[0].clientY;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!touching) return;
      if (window.scrollY > 0) return;
      const dy = e.touches[0].clientY - touchStartY;
      if (dy > OVERSCROLL_PULL_THRESHOLD_PX) setSearchVisible(true);
    };

    const onTouchEnd = () => {
      touching = false;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("touchcancel", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
    };
  }, []);

  return (
    <>
      <button
        type="button"
        className={`floating-search${searchVisible ? " is-visible" : ""}`}
        onClick={onOpenSearch}
        aria-label={ui.search.open}
        aria-hidden={!searchVisible}
        tabIndex={searchVisible ? 0 : -1}
      >
        <SearchIcon />
        <span className="floating-search-text">{ui.search.placeholder}</span>
      </button>
      <div
        className={`floating-controls${scrolled ? " is-scrolled" : ""}${searchVisible ? " is-search-collapsed" : ""}`}
      >
        <button
          type="button"
          className="floating-controls-search"
          onClick={onOpenSearch}
          aria-label={ui.search.open}
          title={ui.search.open}
          aria-hidden={searchVisible}
          tabIndex={searchVisible ? -1 : 0}
        >
          <SearchIcon />
        </button>
        <div className="floating-controls-extra" aria-hidden={!scrolled}>
          <TimelineLink
            label={timelineLabel}
            className="floating-controls-timeline"
            iconOnly
          />
          <LanguageToggleCompact lang={lang} setLang={setLang} />
          <ThemeToggleCompact theme={theme} onToggleTheme={onToggleTheme} />
        </div>
      </div>
    </>
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
