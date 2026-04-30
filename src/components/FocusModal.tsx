import { useEffect, useRef } from "react";

import type { FocusArea } from "../data/cv.types";
import { formatMonth } from "../utils/date";
import { useLang } from "../utils/i18n";
import { renderInlineCode } from "../utils/inlineCode";
import { useBodyScrollLock } from "../utils/useBodyScrollLock";
import { useModalFocus } from "../utils/useModalFocus";
import { useSwipeClose } from "../utils/useSwipeClose";

type Props = {
  focus: FocusArea | null;
  onClose: () => void;
};

export function FocusModal({ focus, onClose }: Props) {
  const { lang, t, ui } = useLang();
  const modalRef = useRef<HTMLDivElement>(null);
  useSwipeClose(modalRef, !!focus, onClose);
  useModalFocus(modalRef, !!focus);
  useBodyScrollLock(!!focus);

  useEffect(() => {
    if (!focus) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [focus, onClose]);

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
      <div
        ref={modalRef}
        className="skill-modal"
        onClick={(e) => e.stopPropagation()}
      >
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
            <p className="skill-modal-description">
              {renderInlineCode(t(focus.description))}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
