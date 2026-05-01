import { useEffect, useRef } from "react";

import type { FocusArea } from "../data/cv.types";
import { formatMonth, monthsSince } from "../utils/date";
import { useLang } from "../utils/i18n";
import { renderInlineCode } from "../utils/inlineCode";
import { useBodyScrollLock } from "../utils/useBodyScrollLock";
import { useModalFocus } from "../utils/useModalFocus";
import { useModalSwipe } from "../utils/useModalSwipe";
import { FocusGlyph } from "./FocusGlyph";

type Props = {
  focus: FocusArea | null;
  onClose: () => void;
  onSkillClick: (skill: string) => void;
};

export function FocusModal({ focus, onClose, onSkillClick }: Props) {
  const { lang, t, ui } = useLang();
  const modalRef = useRef<HTMLDivElement>(null);
  useModalSwipe(modalRef, !!focus, onClose);
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
  const months = monthsSince(focus.since);
  const tagline = t(focus.tagline);
  const description = t(focus.description);
  const skills = focus.skills ?? [];

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
        className="skill-modal focus-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="skill-modal-head focus-modal-head">
          <span className="focus-modal-glyph" aria-hidden="true">
            <FocusGlyph area={focus.area.en} size={20} />
          </span>
          <h2 className="skill-modal-title">
            <span className="skill-modal-name">{area}</span>
            <span className="skill-modal-years">
              {ui.focus.since} {formatMonth(focus.since, lang)}
              {months > 0 ? ` · ${ui.focus.duration(months)}` : ""}
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
        <div className="skill-modal-body" tabIndex={0}>
          <section className="skill-modal-detail">
            <p className="focus-modal-lede">{renderInlineCode(tagline)}</p>
            {description && (
              <p className="skill-modal-description">
                {renderInlineCode(description)}
              </p>
            )}
          </section>
          {skills.length > 0 && (
            <section className="skill-modal-group focus-modal-skills">
              <h3 className="skill-modal-group-heading">
                {ui.focus.skillsHeading}
              </h3>
              <ul className="entry-skills">
                {skills.map((skill) => (
                  <li key={skill}>
                    <button
                      type="button"
                      className="entry-skill-btn"
                      onClick={() => onSkillClick(skill)}
                    >
                      {skill}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
