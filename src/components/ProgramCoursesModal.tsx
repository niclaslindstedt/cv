import { useEffect } from "react";

import type {
  CourseMoment,
  Education as EducationItem,
} from "../data/cv.types";
import { formatMonth, formatRange } from "../utils/date";
import { useLang } from "../utils/i18n";

function NoteIcon() {
  return (
    <svg
      className="program-modal-notes-icon"
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      role="img"
    >
      <path d="M14 3 H6 a2 2 0 0 0 -2 2 v14 a2 2 0 0 0 2 2 h12 a2 2 0 0 0 2 -2 V9 Z" />
      <polyline points="14 3 14 9 20 9" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="13" y2="17" />
    </svg>
  );
}

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
              <p className="program-modal-notes">
                <NoteIcon />
                <span>{t(program.notes)}</span>
              </p>
            )}
            {courses.length > 0 && (
              <p className="program-modal-count">
                {ui.programModal.coursesSummary(courses.length)}
              </p>
            )}
          </section>
          {courses.length > 0 && (
            <ul className="program-courses-list">
              {courses.map((course) => {
                const moments = course.moments ?? [];
                const hasMoments = moments.length > 0;
                const incomplete = course.completed === false;
                const partial =
                  incomplete ||
                  (hasMoments &&
                    !course.completedDate &&
                    moments.some((m) => !m.completedDate));
                const earned = hasMoments
                  ? sumCredits(
                      moments.filter((m) => m.completedDate),
                      course.credits,
                    )
                  : null;
                return (
                  <li key={course.code} className="program-course-item">
                    <div className="program-course-head">
                      <h3 className="program-course-name">{t(course.name)}</h3>
                      <span className="program-course-date">
                        {course.completedDate
                          ? formatMonth(course.completedDate, lang)
                          : partial
                            ? ui.programModal.momentNotCompleted
                            : ui.programModal.inProgress}
                      </span>
                    </div>
                    <div className="program-course-meta">
                      <span className="program-course-code">{course.code}</span>
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
                    {hasMoments && (
                      <div className="program-course-moments">
                        <p className="program-course-moments-label">
                          {ui.programModal.moments}
                        </p>
                        <ul className="program-moment-list">
                          {moments.map((moment, index) => (
                            <li
                              key={moment.code ?? `${course.code}-${index}`}
                              className={
                                moment.completedDate
                                  ? "program-moment-item"
                                  : "program-moment-item program-moment-item--pending"
                              }
                            >
                              <span className="program-moment-name">
                                {t(moment.name)}
                              </span>
                              <span className="program-moment-meta">
                                {moment.code && (
                                  <span className="program-moment-code">
                                    {moment.code}
                                  </span>
                                )}
                                <span className="education-credits">
                                  {moment.credits}
                                </span>
                                <span className="program-moment-date">
                                  {moment.completedDate
                                    ? formatMonth(moment.completedDate, lang)
                                    : ui.programModal.momentNotCompleted}
                                </span>
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
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
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
