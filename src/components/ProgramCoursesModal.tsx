import { useEffect } from "react";

import type { Education as EducationItem } from "../data/cv.types";
import { formatMonth, formatRange } from "../utils/date";
import { useLang } from "../utils/i18n";

type Props = {
  program: EducationItem | null;
  onClose: () => void;
  onSkillClick: (skill: string) => void;
};

export function ProgramCoursesModal({ program, onClose, onSkillClick }: Props) {
  const { lang, t, ui } = useLang();

  useEffect(() => {
    if (!program) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [program, onClose]);

  useEffect(() => {
    if (!program) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [program]);

  if (!program) return null;

  const field = t(program.field);
  const courses = program.courses ?? [];

  return (
    <div
      className="skill-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={ui.programModal.coursesAria(field)}
      onClick={onClose}
    >
      <div className="skill-modal" onClick={(e) => e.stopPropagation()}>
        <header className="skill-modal-head">
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
        <div className="skill-modal-body">
          <section className="program-modal-summary">
            <p className="skill-modal-description">
              {t(program.institution)} · {t(program.level)} ·{" "}
              <span className="education-credits">{program.credits}</span>
            </p>
            {program.notes && (
              <p className="program-modal-notes">{t(program.notes)}</p>
            )}
            {courses.length > 0 && (
              <p className="program-modal-count">
                {ui.programModal.coursesSummary(courses.length)}
              </p>
            )}
          </section>
          {courses.length > 0 && (
            <ul className="program-courses-list">
              {courses.map((course) => (
                <li key={course.code} className="program-course-item">
                  <div className="program-course-head">
                    <h3 className="program-course-name">{t(course.name)}</h3>
                    <span className="program-course-date">
                      {course.completedDate
                        ? formatMonth(course.completedDate, lang)
                        : ui.programModal.inProgress}
                    </span>
                  </div>
                  <div className="program-course-meta">
                    <span className="program-course-code">{course.code}</span>
                    <span className="education-credits">{course.credits}</span>
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
                  {course.skills && course.skills.length > 0 && (
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
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
