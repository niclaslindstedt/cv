import { useEffect, useRef } from "react";

import type { SpokenLanguage } from "../data/cv.types";
import { useLang } from "../utils/i18n";
import { PROFICIENCY_LEVELS, PROFICIENCY_MAX } from "../utils/proficiency";
import { useBodyScrollLock } from "../utils/useBodyScrollLock";
import { useModalFocus } from "../utils/useModalFocus";
import { useModalSwipe } from "../utils/useModalSwipe";
import { FlagIcon } from "./FlagIcon";

type Props = {
  language: SpokenLanguage | null;
  onClose: () => void;
};

export function LanguageModal({ language, onClose }: Props) {
  const { t, ui } = useLang();
  const modalRef = useRef<HTMLDivElement>(null);
  useModalSwipe(modalRef, !!language, onClose);
  useModalFocus(modalRef, !!language);
  useBodyScrollLock(!!language);

  useEffect(() => {
    if (!language) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [language, onClose]);

  if (!language) return null;

  const name = t(language.name);
  // Render the rungs top → bottom so Native is at the top, Basic at the
  // bottom (per the scale heading users see beneath the title).
  const rungs = [...PROFICIENCY_LEVELS].reverse();

  return (
    <div
      className="skill-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={ui.languages.detailAria(name)}
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className="skill-modal language-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="skill-modal-head language-modal-head">
          <span className="language-modal-flag" aria-hidden="true">
            <FlagIcon code={language.code} size={22} />
          </span>
          <h2 className="skill-modal-title">
            <span className="skill-modal-name">{name}</span>
            <span className="skill-modal-years">{t(language.level)}</span>
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
            <h3 className="skill-modal-group-heading">
              {ui.languages.scaleHeading}
            </h3>
            <ol className="language-scale">
              {rungs.map((rung) => {
                const step = PROFICIENCY_LEVELS.indexOf(rung) + 1;
                const isCurrent = rung === language.proficiency;
                const fillPct = (step / PROFICIENCY_MAX) * 100;
                const copy = ui.languages.levels[rung];
                return (
                  <li
                    key={rung}
                    className={
                      isCurrent
                        ? "language-scale-row is-current"
                        : "language-scale-row"
                    }
                    aria-current={isCurrent ? "true" : undefined}
                  >
                    <div className="language-scale-row-head">
                      <span className="language-scale-label">{copy.label}</span>
                      <span
                        className="language-scale-step"
                        aria-label={ui.languages.proficiencyAria(
                          step,
                          PROFICIENCY_MAX,
                        )}
                      >
                        {step}/{PROFICIENCY_MAX}
                      </span>
                    </div>
                    <div className="language-scale-bar" aria-hidden="true">
                      <span
                        className="language-scale-bar-fill"
                        style={{ width: `${fillPct}%` }}
                      />
                    </div>
                    <p className="language-scale-description">
                      {copy.description}
                    </p>
                  </li>
                );
              })}
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}
