import { useEffect, useState } from "react";

import { useLang } from "../utils/i18n";

type Props = {
  onOpen: () => void;
};

const isMac =
  typeof navigator !== "undefined" &&
  /Mac|iPhone|iPad|iPod/.test(navigator.platform);

export function SearchTrigger({ onOpen }: Props) {
  const { ui } = useLang();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const target = document.querySelector(".hero-meta");
    if (!target) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        const scrolledPast =
          !entry.isIntersecting && entry.boundingClientRect.bottom < 0;
        setVisible(scrolledPast);
      },
      { threshold: 0 },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const cmdK = (e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K");
      const slash =
        e.key === "/" &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey &&
        !isEditableTarget(e.target);
      if (cmdK || slash) {
        e.preventDefault();
        onOpen();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onOpen]);

  const shortcut = isMac ? "⌘K" : "Ctrl+K";

  return (
    <button
      type="button"
      className={`search-trigger${visible ? " is-visible" : ""}`}
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      aria-label={ui.search.open}
      onClick={onOpen}
    >
      <svg
        className="search-trigger-icon"
        viewBox="0 0 24 24"
        width="14"
        height="14"
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
      <span className="search-trigger-label">{ui.search.open}</span>
      <kbd className="search-trigger-kbd" aria-hidden="true">
        {shortcut}
      </kbd>
    </button>
  );
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}
