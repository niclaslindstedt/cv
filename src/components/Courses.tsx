import type { Course } from "../data/cv.types";
import { formatMonth, formatRange } from "../utils/date";
import { useLang } from "../utils/i18n";
import { Section } from "./Section";

type Props = {
  title: string;
  courses: Course[];
  onSkillClick: (skill: string) => void;
};

export function Courses({ title, courses, onSkillClick }: Props) {
  const { lang, t } = useLang();
  if (courses.length === 0) return null;
  return (
    <Section id="courses" title={title}>
      <ul className="education-list">
        {courses.map((item) => (
          <li key={`${item.code}-${item.completedDate}`}>
            <div className="education-head">
              <h3>{t(item.name)}</h3>
              <span>
                {item.startDate
                  ? formatRange(item.startDate, item.completedDate, lang)
                  : formatMonth(item.completedDate, lang)}
              </span>
            </div>
            <p>
              {t(item.institution)} ·{" "}
              <span className="education-credits">{item.code}</span> ·{" "}
              <span className="education-credits">{item.credits}</span>
              {item.engagement !== undefined && (
                <>
                  {" · "}
                  <span className="education-credits">
                    {Math.round(item.engagement * 100)}%
                  </span>
                </>
              )}
            </p>
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
          </li>
        ))}
      </ul>
    </Section>
  );
}
