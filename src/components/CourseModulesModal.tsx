import { useEffect, useRef } from "react";

import type { Course, CourseModule } from "../data/cv.types";
import { formatMonth, formatRange } from "../utils/date";
import { useLang } from "../utils/i18n";
import { useBodyScrollLock } from "../utils/useBodyScrollLock";
import { useModalFocus } from "../utils/useModalFocus";
import { useModalSwipe } from "../utils/useModalSwipe";

function sumCredits(modules: CourseModule[], reference: string): string | null {
  if (modules.length === 0) return null;
  let total = 0;
  for (const mod of modules) {
    const parsed = parseFloat(mod.credits.replace(",", "."));
    if (Number.isNaN(parsed)) return null;
    total += parsed;
  }
  const unitMatch = reference.match(/[a-zA-Z]+/);
  const unit = unitMatch ? ` ${unitMatch[0]}` : "";
  const rounded = Math.round(total * 10) / 10;
  return `${rounded}${unit}`;
}

function latestModuleDate(modules: CourseModule[]): string | undefined {
  const dates = modules.map((m) => m.completedDate).filter(Boolean) as string[];
  if (dates.length === 0) return undefined;
  return dates.reduce((latest, d) => (d > latest ? d : latest));
}

type Props = {
  course: Course | null;
  onClose: () => void;
  onSkillClick: (skill: string) => void;
};

export function CourseModulesModal({ course, onClose, onSkillClick }: Props) {
  const { lang, t, ui } = useLang();
  const modalRef = useRef<HTMLDivElement>(null);
  useModalSwipe(modalRef, !!course, onClose);
  useModalFocus(modalRef, !!course);
  useBodyScrollLock(!!course);

  useEffect(() => {
    if (!course) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [course, onClose]);

  if (!course) return null;

  const name = t(course.name);
  const modules = course.modules ?? [];
  const completedModules = modules.filter((m) => m.completedDate);
  const endDate = course.completedDate ?? latestModuleDate(modules);
  const incomplete = course.completed === false;
  const earned =
    modules.length > 0 ? sumCredits(completedModules, course.credits) : null;
  const partial =
    incomplete ||
    (!course.completedDate && modules.some((m) => !m.completedDate));

  return (
    <div
      className="skill-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={ui.courses.modulesAria(name)}
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className="skill-modal"
        onClick={(e) => e.stopPropagation()}
      >
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
            {modules.length > 0 && (
              <p className="program-modal-count">
                {ui.courses.modulesCount(modules.length)}
              </p>
            )}
          </section>
          {modules.length > 0 && (
            <ul className="program-module-list course-modal-modules">
              {modules.map((mod, index) => (
                <li
                  key={mod.code ?? `${course.code}-${index}`}
                  className={
                    mod.completedDate
                      ? "program-module-item"
                      : "program-module-item program-module-item--pending"
                  }
                >
                  <span className="program-module-name">{t(mod.name)}</span>
                  <span className="program-module-meta">
                    {mod.code && (
                      <span className="program-module-code">{mod.code}</span>
                    )}
                    <span className="education-credits">{mod.credits}</span>
                    <span className="program-module-date">
                      {mod.completedDate
                        ? formatMonth(mod.completedDate, lang)
                        : ui.programModal.moduleNotCompleted}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
          {course.skills && course.skills.length > 0 && (
            <section className="skill-modal-group course-modal-skills">
              <h3 className="skill-modal-group-heading">
                {ui.programModal.skills}
              </h3>
              <ul className="entry-skills">
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
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
