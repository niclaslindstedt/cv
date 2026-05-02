import type { KeyboardEvent } from "react";

import type { Course, CourseModule } from "../data/cv.types";
import { formatMonth, formatRange } from "../utils/date";
import { useLang } from "../utils/i18n";
import { CategoryGlyph } from "./CategoryGlyph";
import { EctsPill, type EctsContext } from "./EctsPill";
import { Section } from "./Section";

type Props = {
  title: string;
  courses: Course[];
  onSkillClick: (skill: string) => void;
  onCourseClick: (course: Course) => void;
  onEctsClick: (context: EctsContext) => void;
};

function latestModuleDate(modules: CourseModule[]): string | undefined {
  const dates = modules.map((m) => m.completedDate).filter(Boolean) as string[];
  if (dates.length === 0) return undefined;
  return dates.reduce((latest, d) => (d > latest ? d : latest));
}

function activateOnKey(handler: () => void) {
  return (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handler();
    }
  };
}

export function Courses({
  title,
  courses,
  onSkillClick,
  onCourseClick,
  onEctsClick,
}: Props) {
  const { lang, t, ui } = useLang();
  if (courses.length === 0) return null;
  return (
    <Section id="courses" title={title} category="course">
      <ul className="education-list">
        {courses.map((item) => {
          const modules = item.modules ?? [];
          const endDate = item.completedDate ?? latestModuleDate(modules);
          const hasModules = modules.length > 0;
          const courseName = t(item.name);
          const creditsPill = (
            <EctsPill
              credits={item.credits}
              context={{ kind: "course", credits: item.credits }}
              onOpen={onEctsClick}
            />
          );
          const headBody = (
            <>
              <div className="education-head">
                <h3>{courseName}</h3>
                <span>
                  {item.startDate && endDate
                    ? formatRange(item.startDate, endDate, lang)
                    : endDate
                      ? formatMonth(endDate, lang)
                      : ""}
                </span>
              </div>
              <p>
                {t(item.institution)} · {creditsPill}
                {item.remote && (
                  <>
                    {" · "}
                    <span className="education-credits">
                      {t({ en: "Remote", sv: "Distans" })}
                    </span>
                  </>
                )}
              </p>
            </>
          );
          return (
            <li key={`${item.code}-${endDate ?? item.startDate ?? "x"}`}>
              <span className="card-glyph-bar" aria-hidden="true">
                <CategoryGlyph category="course" />
              </span>
              {hasModules ? (
                <div
                  role="button"
                  tabIndex={0}
                  className="education-program-btn"
                  onClick={() => onCourseClick(item)}
                  onKeyDown={activateOnKey(() => onCourseClick(item))}
                  aria-label={ui.courses.viewModulesAria(courseName)}
                >
                  {headBody}
                </div>
              ) : (
                headBody
              )}
              {item.skills && item.skills.length > 0 && (
                <ul className="entry-skills">
                  {item.skills.map((skill) => (
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
              <span className="glass-reflect" aria-hidden="true" />
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
