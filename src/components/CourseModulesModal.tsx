import { useEffect, useRef } from "react";

import type { Course, CourseModule } from "../data/cv.types";
import { courseTimelineId } from "../data/timeline-ids";
import { categoryStyle } from "../utils/categoryStyle";
import { formatMonth, formatRange } from "../utils/date";
import { useLang } from "../utils/i18n";
import { navigate } from "../utils/route";
import { useBodyScrollLock } from "../utils/useBodyScrollLock";
import { useModalFocus } from "../utils/useModalFocus";
import { useModalSwipe } from "../utils/useModalSwipe";
import { CategoryGlyph } from "./CategoryGlyph";
import { EctsPill, type EctsContext } from "./EctsPill";
import { ModalLink } from "./ModalLink";

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

function parseCreditValue(s: string): number | null {
  const numMatch = s.replace(",", ".").match(/[\d.]+/);
  if (!numMatch) return null;
  const value = parseFloat(numMatch[0]);
  return Number.isNaN(value) ? null : value;
}

function creditUnit(s: string): string {
  const unitMatch = s.match(/[a-zA-Z]+/);
  return unitMatch ? unitMatch[0] : "";
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
  onEctsClick: (context: EctsContext) => void;
};

export function CourseModulesModal({
  course,
  onClose,
  onSkillClick,
  onEctsClick,
}: Props) {
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
  const timelineId = courseTimelineId(course);
  const modules = course.modules ?? [];
  const completedModules = modules.filter((m) => m.completedDate);
  const endDate = course.completedDate ?? latestModuleDate(modules);
  const incomplete = course.completed === false;
  const earned =
    modules.length > 0 ? sumCredits(completedModules, course.credits) : null;
  const partial =
    incomplete ||
    (!course.completedDate && modules.some((m) => !m.completedDate));
  const earnedValue = completedModules.reduce((sum, m) => {
    const v = parseCreditValue(m.credits);
    return v === null ? sum : sum + v;
  }, 0);
  const totalValue = parseCreditValue(course.credits);
  const unit = creditUnit(course.credits);
  const showProgress =
    partial &&
    earned !== null &&
    totalValue !== null &&
    totalValue > 0 &&
    earnedValue > 0;
  const progressPct = showProgress
    ? Math.min(100, (earnedValue / (totalValue as number)) * 100)
    : 0;
  const progressEarnedLabel = `${Math.round(earnedValue * 10) / 10}`;
  const progressTotalLabel = `${Math.round((totalValue ?? 0) * 10) / 10}`;

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
        className="skill-modal skill-modal--cat"
        data-category="course"
        style={categoryStyle("course")}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="skill-modal-head">
          <span className="skill-modal-glyph" aria-hidden="true">
            <CategoryGlyph category="course" size={20} />
          </span>
          <h2 className="skill-modal-title">
            <span className="skill-modal-name">{name}</span>
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
        <div className="skill-modal-body" tabIndex={0}>
          {(course.startDate || endDate) && (
            <div className="timeline-meta course-modal-meta">
              <span>
                {course.startDate && endDate
                  ? formatRange(course.startDate, endDate, lang)
                  : endDate
                    ? formatMonth(endDate, lang)
                    : course.startDate
                      ? formatMonth(course.startDate, lang)
                      : ""}
              </span>
            </div>
          )}
          <section className="program-modal-summary">
            <p className="skill-modal-description">
              {t(course.institution)} ·{" "}
              <EctsPill
                credits={course.credits}
                context={{ kind: "course", credits: course.credits }}
                onOpen={onEctsClick}
              />
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
            </div>
          </section>
          {timelineId && (
            <div className="skill-modal-actions">
              <ModalLink
                onClick={() => {
                  onClose();
                  navigate(`/timeline#${timelineId}`);
                }}
              >
                {ui.timeline.seeInTimeline}
              </ModalLink>
            </div>
          )}
          {modules.length > 0 && (
            <section className="company-modal-stack course-modules-section">
              <div className="course-modules-head">
                <h3 className="company-modal-stack-title">
                  {ui.courses.modulesCount(modules.length)}
                </h3>
                {showProgress && (
                  <span className="course-modules-progress-value">
                    <span className="course-modules-progress-earned">
                      {progressEarnedLabel}
                    </span>
                    <span className="course-modules-progress-sep">/</span>
                    <span className="course-modules-progress-total">
                      {progressTotalLabel}
                    </span>
                    {unit && (
                      <span className="course-modules-progress-unit">
                        {unit}
                      </span>
                    )}
                  </span>
                )}
              </div>
              {showProgress && (
                <div
                  className="course-modules-progress-bar"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={totalValue ?? 0}
                  aria-valuenow={earnedValue}
                  aria-label={ui.programModal.courseProgress(
                    earned as string,
                    course.credits,
                  )}
                >
                  <span
                    className="course-modules-progress-fill"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              )}
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
                      <EctsPill
                        credits={mod.credits}
                        context={{ kind: "course", credits: mod.credits }}
                        onOpen={onEctsClick}
                      />
                      <span className="program-module-date">
                        {mod.completedDate
                          ? formatMonth(mod.completedDate, lang)
                          : ui.programModal.moduleNotCompleted}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
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
