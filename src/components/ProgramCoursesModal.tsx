import { useEffect, useRef } from "react";

import type {
  CourseModule,
  Education as EducationItem,
} from "../data/cv.types";
import { educationTimelineId } from "../data/timeline-ids";
import { categoryStyle } from "../utils/categoryStyle";
import { formatMonth, formatRange } from "../utils/date";
import { useLang } from "../utils/i18n";
import { navigate } from "../utils/route";
import { useBodyScrollLock } from "../utils/useBodyScrollLock";
import { useModalFocus } from "../utils/useModalFocus";
import { useModalSwipe } from "../utils/useModalSwipe";
import { CategoryGlyph } from "./CategoryGlyph";
import { NoteIcon } from "./NoteIcon";

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

type Props = {
  program: EducationItem | null;
  onClose: () => void;
  onSkillClick: (skill: string) => void;
};

export function ProgramCoursesModal({ program, onClose, onSkillClick }: Props) {
  const { lang, t, ui } = useLang();
  const modalRef = useRef<HTMLDivElement>(null);
  useModalSwipe(modalRef, !!program, onClose);
  useModalFocus(modalRef, !!program);
  useBodyScrollLock(!!program);

  useEffect(() => {
    if (!program) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [program, onClose]);

  if (!program) return null;

  const field = t(program.field);
  const courses = program.courses ?? [];
  const timelineId = educationTimelineId(program);

  return (
    <div
      className="skill-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={ui.programModal.coursesAria(field)}
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className="skill-modal skill-modal--cat"
        data-category="education"
        style={categoryStyle("education")}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="skill-modal-head">
          <span className="skill-modal-glyph" aria-hidden="true">
            <CategoryGlyph category="education" size={20} />
          </span>
          <h2 className="skill-modal-title">
            <span className="skill-modal-name">{field}</span>
            <span className="skill-modal-years">
              {formatRange(program.startDate, program.endDate, lang)}
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
        <div className="skill-modal-body" tabIndex={0}>
          <section className="program-modal-summary">
            <p className="skill-modal-description">
              {t(program.institution)} · {t(program.level)} ·{" "}
              <span className="education-credits">{program.credits}</span>
            </p>
            {program.notes && (
              <p className="program-modal-notes">
                <NoteIcon />
                <span>{t(program.notes)}</span>
              </p>
            )}
            {timelineId && (
              <div className="skill-modal-actions">
                <button
                  type="button"
                  className="skill-modal-link"
                  onClick={() => {
                    onClose();
                    navigate(`/timeline#${timelineId}`);
                  }}
                >
                  {ui.timeline.seeInTimeline}
                </button>
              </div>
            )}
          </section>
          {courses.length > 0 && (
            <section className="company-modal-stack program-courses-section">
              <h3 className="company-modal-stack-title">
                {ui.programModal.coursesSummary(courses.length)}
              </h3>
              <ul className="program-courses-list">
                {courses.map((course) => {
                  const modules = course.modules ?? [];
                  const hasModules = modules.length > 0;
                  const incomplete = course.completed === false;
                  const partial =
                    incomplete ||
                    (hasModules &&
                      !course.completedDate &&
                      modules.some((m) => !m.completedDate));
                  const earned = hasModules
                    ? sumCredits(
                        modules.filter((m) => m.completedDate),
                        course.credits,
                      )
                    : null;
                  return (
                    <li key={course.code} className="program-course-item">
                      <div className="program-course-head">
                        <h3 className="program-course-name">
                          {t(course.name)}
                        </h3>
                        <span className="program-course-date">
                          {course.completedDate
                            ? formatMonth(course.completedDate, lang)
                            : partial
                              ? ui.programModal.moduleNotCompleted
                              : ui.programModal.inProgress}
                        </span>
                      </div>
                      <div className="program-course-meta">
                        <span className="program-course-code">
                          {course.code}
                        </span>
                        <span className="education-credits">
                          {course.credits}
                        </span>
                        {incomplete && (
                          <span className="course-incomplete-pill">
                            {ui.programModal.incomplete}
                          </span>
                        )}
                        {partial && earned && (
                          <span className="program-course-progress">
                            {ui.programModal.courseProgress(
                              earned,
                              course.credits,
                            )}
                          </span>
                        )}
                        {course.grade && (
                          <span className="program-course-grade">
                            <span className="program-course-grade-label">
                              {ui.programModal.grade}
                            </span>
                            <span className="program-course-grade-value">
                              {course.grade}
                            </span>
                          </span>
                        )}
                      </div>
                      {hasModules && (
                        <div className="program-course-modules">
                          <p className="program-course-modules-label">
                            {ui.programModal.modules}
                          </p>
                          <ul className="program-module-list">
                            {modules.map((mod, index) => (
                              <li
                                key={mod.code ?? `${course.code}-${index}`}
                                className={
                                  mod.completedDate
                                    ? "program-module-item"
                                    : "program-module-item program-module-item--pending"
                                }
                              >
                                <span className="program-module-name">
                                  {t(mod.name)}
                                </span>
                                <span className="program-module-meta">
                                  {mod.code && (
                                    <span className="program-module-code">
                                      {mod.code}
                                    </span>
                                  )}
                                  <span className="education-credits">
                                    {mod.credits}
                                  </span>
                                  <span className="program-module-date">
                                    {mod.completedDate
                                      ? formatMonth(mod.completedDate, lang)
                                      : ui.programModal.moduleNotCompleted}
                                  </span>
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {course.skills && course.skills.length > 0 && (
                        <section className="skill-modal-group program-course-skills">
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
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
