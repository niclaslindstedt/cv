import { useEffect } from "react";

import type { Course, CourseMoment } from "../data/cv.types";
import { formatMonth, formatRange } from "../utils/date";
import { useLang } from "../utils/i18n";

function sumCredits(moments: CourseMoment[], reference: string): string | null {
  if (moments.length === 0) return null;
  let total = 0;
  for (const moment of moments) {
    const parsed = parseFloat(moment.credits.replace(",", "."));
    if (Number.isNaN(parsed)) return null;
    total += parsed;
  }
  const unitMatch = reference.match(/[a-zA-Z]+/);
  const unit = unitMatch ? ` ${unitMatch[0]}` : "";
  const rounded = Math.round(total * 10) / 10;
  return `${rounded}${unit}`;
}

function latestMomentDate(moments: CourseMoment[]): string | undefined {
  const dates = moments.map((m) => m.completedDate).filter(Boolean) as string[];
  if (dates.length === 0) return undefined;
  return dates.reduce((latest, d) => (d > latest ? d : latest));
}

type Props = {
  course: Course | null;
  onClose: () => void;
  onSkillClick: (skill: string) => void;
};

export function CourseMomentsModal({ course, onClose, onSkillClick }: Props) {
  const { lang, t, ui } = useLang();

  useEffect(() => {
    if (!course) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [course, onClose]);

  useEffect(() => {
    if (!course) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [course]);

  if (!course) return null;

  const name = t(course.name);
  const moments = course.moments ?? [];
  const completedMoments = moments.filter((m) => m.completedDate);
  const endDate = course.completedDate ?? latestMomentDate(moments);
  const incomplete = course.completed === false;
  const earned =
    moments.length > 0 ? sumCredits(completedMoments, course.credits) : null;
  const partial =
    incomplete ||
    (!course.completedDate && moments.some((m) => !m.completedDate));

  return (
    <div
      className="skill-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={ui.courses.momentsAria(name)}
      onClick={onClose}
    >
      <div className="skill-modal" onClick={(e) => e.stopPropagation()}>
        <header className="skill-modal-head">
          <h2 className="skill-modal-title">
            <span className="skill-modal-name">{name}</span>
            <span className="skill-modal-years">
              {course.startDate && endDate
                ? formatRange(course.startDate, endDate, lang)
                : endDate
                  ? formatMonth(endDate, lang)
                  : ""}
            </span>
          </h2>
          <button
            type="button"
            className="skill-modal-close"
            onClick={onClose}
            aria-label={ui.programModal.close}
          >
            ✕
          </button>
        </header>
        <div className="skill-modal-body">
          <section className="program-modal-summary">
            <p className="skill-modal-description">
              {t(course.institution)} ·{" "}
              <span className="education-credits">{course.credits}</span>
            </p>
            <div className="program-course-meta">
              <span className="program-course-code">{course.code}</span>
              {course.engagement !== undefined && (
                <span className="education-credits">
                  {Math.round(course.engagement * 100)}%
                </span>
              )}
              {course.remote && (
                <span className="education-credits">
                  {t({ en: "Remote", sv: "Distans" })}
                </span>
              )}
              {incomplete && (
                <span className="course-incomplete-pill">
                  {ui.programModal.incomplete}
                </span>
              )}
              {partial && earned && (
                <span className="program-course-progress">
                  {ui.programModal.courseProgress(earned, course.credits)}
                </span>
              )}
            </div>
            {moments.length > 0 && (
              <p className="program-modal-count">
                {ui.courses.momentsCount(moments.length)}
              </p>
            )}
          </section>
          {moments.length > 0 && (
            <ul className="program-moment-list course-modal-moments">
              {moments.map((moment, index) => (
                <li
                  key={moment.code ?? `${course.code}-${index}`}
                  className={
                    moment.completedDate
                      ? "program-moment-item"
                      : "program-moment-item program-moment-item--pending"
                  }
                >
                  <span className="program-moment-name">{t(moment.name)}</span>
                  <span className="program-moment-meta">
                    {moment.code && (
                      <span className="program-moment-code">{moment.code}</span>
                    )}
                    <span className="education-credits">{moment.credits}</span>
                    <span className="program-moment-date">
                      {moment.completedDate
                        ? formatMonth(moment.completedDate, lang)
                        : ui.programModal.momentNotCompleted}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
          {course.skills && course.skills.length > 0 && (
            <ul className="entry-skills course-modal-skills">
              {course.skills.map((skill) => (
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
          )}
        </div>
      </div>
    </div>
  );
}
