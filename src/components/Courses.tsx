import type { Course, CourseModule } from "../data/cv.types";
import { formatMonth, formatRange } from "../utils/date";
import { useLang } from "../utils/i18n";
import { CategoryGlyph } from "./CategoryGlyph";
import { Section } from "./Section";

type Props = {
  title: string;
  courses: Course[];
  onSkillClick: (skill: string) => void;
  onCourseClick: (course: Course) => void;
};

function parseCredits(credits: string): number | null {
  const parsed = parseFloat(credits.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function sumModuleCredits(modules: CourseModule[]): number | null {
  let total = 0;
  for (const mod of modules) {
    const value = parseCredits(mod.credits);
    if (value === null) return null;
    total += value;
  }
  return Math.round(total * 10) / 10;
}

function latestModuleDate(modules: CourseModule[]): string | undefined {
  const dates = modules.map((m) => m.completedDate).filter(Boolean) as string[];
  if (dates.length === 0) return undefined;
  return dates.reduce((latest, d) => (d > latest ? d : latest));
}

export function Courses({
  title,
  courses,
  onSkillClick,
  onCourseClick,
}: Props) {
  const { lang, t, ui } = useLang();
  if (courses.length === 0) return null;
  return (
    <Section id="courses" title={title} category="course">
      <ul className="education-list">
        {courses.map((item) => {
          const modules = item.modules ?? [];
          const completedModules = modules.filter((m) => m.completedDate);
          const endDate = item.completedDate ?? latestModuleDate(modules);
          const fullCredits = parseCredits(item.credits);
          const earned =
            modules.length > 0 ? sumModuleCredits(completedModules) : null;
          const incomplete = item.completed === false;
          const partial =
            incomplete ||
            (!item.completedDate &&
              earned !== null &&
              fullCredits !== null &&
              earned < fullCredits);
          const hasModules = modules.length > 0;
          const courseName = t(item.name);
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
                {t(item.institution)} ·{" "}
                <span className="education-credits">{item.code}</span> ·{" "}
                <span className="education-credits">{item.credits}</span>
                {partial && earned !== null && (
                  <>
                    {" · "}
                    <span className="education-credits">
                      {ui.programModal.courseProgress(
                        `${earned}`,
                        item.credits,
                      )}
                    </span>
                  </>
                )}
                {item.engagement !== undefined && (
                  <>
                    {" · "}
                    <span className="education-credits">
                      {Math.round(item.engagement * 100)}%
                    </span>
                  </>
                )}
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
                <button
                  type="button"
                  className="education-program-btn"
                  onClick={() => onCourseClick(item)}
                  aria-label={ui.courses.viewModulesAria(courseName)}
                >
                  {headBody}
                </button>
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
