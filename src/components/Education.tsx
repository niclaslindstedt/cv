import type { Education as EducationItem } from "../data/cv.types";
import { formatRange } from "../utils/date";
import { Section } from "./Section";

type Props = { education: EducationItem[] };

export function Education({ education }: Props) {
  return (
    <Section id="education" title="Education">
      <ul className="education-list">
        {education.map((item) => (
          <li key={`${item.institution}-${item.startDate}`}>
            <div className="education-head">
              <h3>{item.field}</h3>
              <span>{formatRange(item.startDate, item.endDate)}</span>
            </div>
            <p>
              {item.institution} · {item.level} · {item.credits}
            </p>
          </li>
        ))}
      </ul>
    </Section>
  );
}
