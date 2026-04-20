import type { Experience as ExperienceItem } from "../data/cv";
import { formatRange } from "../utils/date";
import { Section } from "./Section";

type Props = { experience: ExperienceItem[] };

export function Experience({ experience }: Props) {
  return (
    <Section id="experience" title="Experience">
      <ol className="timeline">
        {experience.map((item) => (
          <li key={`${item.company}-${item.startDate}`} className="timeline-item">
            <div className="timeline-meta">
              <span>{formatRange(item.startDate, item.endDate)}</span>
              {item.engagement && (
                <span className="timeline-engagement">{item.engagement}</span>
              )}
            </div>
            <div className="timeline-body">
              <h3>
                {item.role} · <span className="company">{item.company}</span>
              </h3>
              <p>{item.companyDescription}</p>
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
}
