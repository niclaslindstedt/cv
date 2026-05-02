import { useEffect, useRef, useState, type KeyboardEvent } from "react";

import type { Language } from "../data/cv.types";
import { formatFullDate, formatMonth } from "../utils/date";

type Props = {
  iso: string;
  lang: Language;
};

export function ProjectDateChip({ iso, lang }: Props) {
  const month = formatMonth(iso.slice(0, 7), lang);
  const full = formatFullDate(iso, lang);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!dismissed) return;
    const onPointer = (event: PointerEvent) => {
      const node = buttonRef.current;
      if (!node) return;
      if (event.target instanceof Node && node.contains(event.target)) return;
      setDismissed(false);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [dismissed]);

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "Escape" && !dismissed) {
      event.stopPropagation();
      setDismissed(true);
    }
  };

  return (
    <button
      ref={buttonRef}
      type="button"
      className="project-date"
      aria-label={full}
      data-tooltip-dismissed={dismissed ? "true" : undefined}
      onKeyDown={handleKeyDown}
      onPointerEnter={() => setDismissed(false)}
      onBlur={() => setDismissed(false)}
    >
      <time dateTime={iso.slice(0, 10)}>{month}</time>
      <span className="project-date-tooltip" role="tooltip" aria-hidden="true">
        {full}
      </span>
    </button>
  );
}
