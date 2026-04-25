import { useEffect } from "react";

import type { FocusArea } from "../data/cv.types";
import { formatMonth } from "../utils/date";
import { useLang } from "../utils/i18n";

type Props = {
  focus: FocusArea | null;
  onClose: () => void;
};

export function FocusModal({ focus, onClose }: Props) {
  const { lang, t, ui } = useLang();

  useEffect(() => {
    if (!focus) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [focus, onClose]);

  useEffect(() => {
    if (!focus) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [focus]);

  if (!focus) return null;

  const area = t(focus.area);

  return (
    <div
      className="skill-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={ui.focus.detailAria(area)}
      onClick={onClose}
    >
      <div className="skill-modal" onClick={(e) => e.stopPropagation()}>
        <header className="skill-modal-head">
          <h2 className="skill-modal-title">
            <span className="skill-modal-name">{area}</span>
            <span className="skill-modal-years">
              {ui.focus.since} {formatMonth(focus.since, lang)}
            </span>
          </h2>
          <button
            type="button"
            className="skill-modal-close"
            onClick={onClose}
            aria-label={ui.skillModal.close}
          >
            ✕
          </button>
        </header>
        <div className="skill-modal-body">
          <section className="skill-modal-detail">
            <p className="skill-modal-description">{t(focus.description)}</p>
          </section>
        </div>
      </div>
    </div>
  );
}
