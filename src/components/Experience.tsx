import type { Experience as ExperienceItem } from "../data/cv.types";
import { formatRange } from "../utils/date";
import { Section } from "./Section";

type Props = { experience: ExperienceItem[] };

export function Experience({ experience }: Props) {
  return (
    <Section id="experience" title="Experience">
      <ol className="timeline">
        {experience.map((item) => (
          <li
            key={`${item.company}-${item.startDate}`}
            className="timeline-item"
          >
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
              {item.assignments && item.assignments.length > 0 && (
                <details className="assignments">
                  <summary>
                    {item.assignments.length} assignment
                    {item.assignments.length === 1 ? "" : "s"}
                  </summary>
                  <ol className="assignments-list">
                    {item.assignments.map((a) => (
                      <li
                        key={`${a.client}-${a.startDate}`}
                        className="assignment-item"
                      >
                        <div className="assignment-meta">
                          {formatRange(a.startDate, a.endDate)}
                        </div>
                        <div className="assignment-body">
                          <h4>
                            {a.role} ·{" "}
                            <span className="company">{a.client}</span>
                          </h4>
                          <p>{a.clientDescription}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </details>
              )}
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
}
