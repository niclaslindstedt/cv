import type { Education as EducationItem } from "../data/cv.types";
import { formatRange } from "../utils/date";
import { useLang } from "../utils/i18n";
import { CategoryGlyph } from "./CategoryGlyph";
import { Section } from "./Section";

type Props = {
  title: string;
  education: EducationItem[];
  onSkillClick: (skill: string) => void;
  onProgramClick: (program: EducationItem) => void;
};

function roundCredits(credits: string): string {
  return credits.replace(/[\d.]+/, (match) => {
    const n = Number(match);
    return n - Math.floor(n) === 0.5 ? match : String(Math.round(n));
  });
}

export function Education({
  title,
  education,
  onSkillClick,
  onProgramClick,
}: Props) {
  const { lang, t, ui } = useLang();
  return (
    <Section id="education" title={title} category="education">
      <ul className="education-list">
        {education.map((item) => {
          const courseCount = item.courses?.length ?? 0;
          const hasCourses = courseCount > 0;
          const hasNotes = !!item.notes;
          const isClickable = hasCourses || hasNotes;
          const field = t(item.field);
          return (
            <li key={`${item.institution.en}-${item.startDate}`}>
              <span className="card-glyph-bar" aria-hidden="true">
                <CategoryGlyph category="education" />
              </span>
              {isClickable ? (
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
                  <p className="education-meta-trail">
                    {t(item.institution)} · {t(item.level)} ·{" "}
                    <span className="education-credits">
                      {roundCredits(item.credits)}
                    </span>
                    {hasCourses && (
                      <span className="education-courses-count">
                        {ui.education.coursesCount(courseCount)}
                      </span>
                    )}
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
                  <p className="education-meta-trail">
                    {t(item.institution)} · {t(item.level)} ·{" "}
                    <span className="education-credits">
                      {roundCredits(item.credits)}
                    </span>
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
              <span className="glass-reflect" aria-hidden="true" />
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
