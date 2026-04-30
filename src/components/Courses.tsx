import type { Course, CourseMoment } from "../data/cv.types";
import { formatMonth, formatRange } from "../utils/date";
import { useLang } from "../utils/i18n";
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

function sumMomentCredits(moments: CourseMoment[]): number | null {
  let total = 0;
  for (const moment of moments) {
    const value = parseCredits(moment.credits);
    if (value === null) return null;
    total += value;
  }
  return Math.round(total * 10) / 10;
}

function latestMomentDate(moments: CourseMoment[]): string | undefined {
  const dates = moments.map((m) => m.completedDate).filter(Boolean) as string[];
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
    <Section id="courses" title={title}>
      <ul className="education-list">
        {courses.map((item) => {
          const moments = item.moments ?? [];
          const completedMoments = moments.filter((m) => m.completedDate);
          const endDate = item.completedDate ?? latestMomentDate(moments);
          const fullCredits = parseCredits(item.credits);
          const earned =
            moments.length > 0 ? sumMomentCredits(completedMoments) : null;
          const incomplete = item.completed === false;
          const partial =
            incomplete ||
            (!item.completedDate &&
              earned !== null &&
              fullCredits !== null &&
              earned < fullCredits);
          const hasMoments = moments.length > 0;
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
                {hasMoments && (
                  <span className="education-courses-count">
                    {ui.courses.momentsCount(moments.length)}
                  </span>
                )}
              </p>
            </>
          );
          return (
            <li key={`${item.code}-${endDate ?? item.startDate ?? "x"}`}>
              {hasMoments ? (
                <button
                  type="button"
                  className="education-program-btn"
                  onClick={() => onCourseClick(item)}
                  aria-label={ui.courses.viewMomentsAria(courseName)}
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
