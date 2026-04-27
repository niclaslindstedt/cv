import { useEffect, useRef } from "react";

import type { LocalizedString, SkillDetail } from "../data/cv.types";
import { formatRange } from "../utils/date";
import { useLang } from "../utils/i18n";
import { yearsOfExperience, type SkillUsage } from "../utils/skills";
import { useSwipeClose } from "../utils/useSwipeClose";

function isLocalized(
  value: string | LocalizedString,
): value is LocalizedString {
  return typeof value === "object" && value !== null && "en" in value;
}

type Props = {
  skill: string | null;
  usages: SkillUsage[];
  detail?: SkillDetail;
  onClose: () => void;
};

const KIND_ORDER: Record<SkillUsage["kind"], number> = {
  assignment: 0,
  experience: 1,
  education: 2,
  course: 3,
  project: 4,
};

function sortUsages(usages: SkillUsage[]): SkillUsage[] {
  return [...usages].sort((a, b) => {
    const ad = a.startDate ?? "";
    const bd = b.startDate ?? "";
    if (ad && bd && ad !== bd) return bd.localeCompare(ad);
    if (ad && !bd) return -1;
    if (!ad && bd) return 1;
    return KIND_ORDER[a.kind] - KIND_ORDER[b.kind];
  });
}

export function SkillModal({ skill, usages, detail, onClose }: Props) {
  const { lang, t, ui } = useLang();
  const modalRef = useRef<HTMLDivElement>(null);
  useSwipeClose(modalRef, !!skill, onClose);

  const resolveLabel = (v: string | LocalizedString) =>
    isLocalized(v) ? t(v) : v;

  useEffect(() => {
    if (!skill) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [skill, onClose]);

  useEffect(() => {
    if (!skill) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [skill]);

  if (!skill) return null;

  const years = yearsOfExperience(usages);
  const sorted = sortUsages(usages);

  const kindLabels: Record<SkillUsage["kind"], string> = {
    project: ui.skillModal.project,
    experience: ui.skillModal.role,
    assignment: ui.skillModal.assignment,
    education: ui.skillModal.education,
    course: ui.skillModal.course,
  };

  return (
    <div
      className="skill-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={ui.skillModal.usageAria(skill)}
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className="skill-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="skill-modal-head">
          <h2 className="skill-modal-title">
            <span className="skill-modal-name">{skill}</span>
            {years > 0 && (
              <span className="skill-modal-years">
                {ui.skillModal.yearsLabel(years)}
              </span>
            )}
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
          {detail && (
            <section className="skill-modal-detail">
              <p className="skill-modal-description">{t(detail.description)}</p>
              {(detail.benefits || detail.drawbacks) && (
                <dl className="skill-modal-pros-cons">
                  {detail.benefits && (
                    <div className="skill-modal-pros">
                      <dt>{ui.skillModal.benefits}</dt>
                      <dd>{t(detail.benefits)}</dd>
                    </div>
                  )}
                  {detail.drawbacks && (
                    <div className="skill-modal-cons">
                      <dt>{ui.skillModal.drawbacks}</dt>
                      <dd>{t(detail.drawbacks)}</dd>
                    </div>
                  )}
                </dl>
              )}
              {detail.url && (
                <a
                  className="skill-modal-link"
                  href={detail.url}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  {ui.skillModal.learnMore}
                </a>
              )}
            </section>
          )}
          {sorted.length > 0 ? (
            <ul className="skill-modal-list">
              {sorted.map((u, i) => (
                <li key={`${u.kind}-${i}`} className="skill-modal-item">
                  <span className="skill-modal-kind">{kindLabels[u.kind]}</span>
                  <div className="skill-modal-label">
                    {u.role ? (
                      <>
                        <span className="skill-modal-role">{t(u.role)}</span>
                        <span className="skill-modal-sublabel">
                          {resolveLabel(u.label)}
                        </span>
                      </>
                    ) : (
                      <span className="skill-modal-role">
                        {resolveLabel(u.label)}
                      </span>
                    )}
                  </div>
                  {u.startDate && (
                    <span className="skill-modal-range">
                      {formatRange(u.startDate, u.endDate ?? null, lang)}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="skill-modal-empty">{ui.skillModal.empty}</p>
          )}
        </div>
      </div>
    </div>
  );
}
