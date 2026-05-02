import type { KeyboardEvent } from "react";

import type { Education as EducationItem } from "../data/cv.types";
import { formatRange } from "../utils/date";
import { useLang } from "../utils/i18n";
import { EctsPill, type EctsContext } from "./EctsPill";
import { Section } from "./Section";

type Props = {
  title: string;
  education: EducationItem[];
  onSkillClick: (skill: string) => void;
  onProgramClick: (program: EducationItem) => void;
  onEctsClick: (context: EctsContext) => void;
};

function roundCredits(credits: string): string {
  return credits.replace(/[\d.]+/, (match) => {
    const n = Number(match);
    return n - Math.floor(n) === 0.5 ? match : String(Math.round(n));
  });
}

function activateOnKey(handler: () => void) {
  return (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handler();
    }
  };
}

export function Education({
  title,
  education,
  onSkillClick,
  onProgramClick,
  onEctsClick,
}: Props) {
  const { lang, t, ui } = useLang();
  return (
    <Section id="education" title={title}>
      <ul className="education-list">
        {education.map((item) => {
          const courseCount = item.courses?.length ?? 0;
          const hasCourses = courseCount > 0;
          const hasNotes = !!item.notes;
          const isClickable = hasCourses || hasNotes;
          const field = t(item.field);
          const creditsPill = (
            <EctsPill
              credits={roundCredits(item.credits)}
              context={{ kind: "program", program: item }}
              onOpen={onEctsClick}
            />
          );
          const body = (
            <>
              <div className="education-head">
                <h3>{field}</h3>
                <span>{formatRange(item.startDate, item.endDate, lang)}</span>
              </div>
              <p>
                {t(item.institution)} · {t(item.level)} · {creditsPill}
                {hasCourses && (
                  <span className="education-courses-count">
                    {ui.education.coursesCount(courseCount)}
                  </span>
                )}
              </p>
            </>
          );
          return (
            <li key={`${item.institution.en}-${item.startDate}`}>
              {isClickable ? (
                <div
                  role="button"
                  tabIndex={0}
                  className="education-program-btn"
                  onClick={() => onProgramClick(item)}
                  onKeyDown={activateOnKey(() => onProgramClick(item))}
                  aria-label={ui.education.viewCoursesAria(field)}
                >
                  {body}
                </div>
              ) : (
                body
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
