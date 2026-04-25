import type { Education as EducationItem } from "../data/cv.types";
import { formatRange } from "../utils/date";
import { useLang } from "../utils/i18n";
import { Section } from "./Section";

type Props = {
  title: string;
  education: EducationItem[];
  onSkillClick: (skill: string) => void;
  onProgramClick: (program: EducationItem) => void;
};

export function Education({
  title,
  education,
  onSkillClick,
  onProgramClick,
}: Props) {
  const { lang, t, ui } = useLang();
  return (
    <Section id="education" title={title}>
      <ul className="education-list">
        {education.map((item) => {
          const courseCount = item.courses?.length ?? 0;
          const hasCourses = courseCount > 0;
          const field = t(item.field);
          return (
            <li key={`${item.institution.en}-${item.startDate}`}>
              {hasCourses ? (
                <button
                  type="button"
                  className="education-program-btn"
                  onClick={() => onProgramClick(item)}
                  aria-label={ui.education.viewCoursesAria(field)}
                >
                  <div className="education-head">
                    <h3>{field}</h3>
                    <span>
                      {formatRange(item.startDate, item.endDate, lang)}
                    </span>
                  </div>
                  <p>
                    {t(item.institution)} · {t(item.level)} ·{" "}
                    <span className="education-credits">{item.credits}</span>
                    <span className="education-courses-count">
                      {ui.education.coursesCount(courseCount)}
                    </span>
                  </p>
                </button>
              ) : (
                <>
                  <div className="education-head">
                    <h3>{field}</h3>
                    <span>
                      {formatRange(item.startDate, item.endDate, lang)}
                    </span>
                  </div>
                  <p>
                    {t(item.institution)} · {t(item.level)} ·{" "}
                    <span className="education-credits">{item.credits}</span>
                  </p>
                </>
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
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
