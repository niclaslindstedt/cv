import type { Education as EducationItem } from "../data/cv.types";
import { formatRange } from "../utils/date";
import { Section } from "./Section";

type Props = {
  title: string;
  education: EducationItem[];
  onSkillClick: (skill: string) => void;
};

export function Education({ title, education, onSkillClick }: Props) {
  return (
    <Section id="education" title={title}>
      <ul className="education-list">
        {education.map((item) => (
          <li key={`${item.institution}-${item.startDate}`}>
            <div className="education-head">
              <h3>{item.field}</h3>
              <span>{formatRange(item.startDate, item.endDate)}</span>
            </div>
            <p>
              {item.institution} · {item.level} ·{" "}
              <span className="education-credits">{item.credits}</span>
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
