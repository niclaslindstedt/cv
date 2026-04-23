import type { Experience as ExperienceItem } from "../data/cv.types";
import { formatRange } from "../utils/date";
import { Section } from "./Section";

type Props = { experience: ExperienceItem[] };

function sameName(a: string, b: string) {
  return a.toLowerCase() === b.toLowerCase();
}

export function Experience({ experience }: Props) {
  return (
    <Section id="experience" title="Experience">
      <ol className="timeline">
        {experience.map((item, i) => {
          const prev = experience[i - 1];
          const isPromotion = !!prev && sameName(prev.company, item.company);
          return (
            <li
              key={`${item.company}-${item.startDate}`}
              className={
                isPromotion
                  ? "timeline-item timeline-promotion"
                  : "timeline-item"
              }
            >
              <div className="timeline-meta">
                <span>
                  {isPromotion && (
                    <span
                      className="promotion-icon"
                      aria-label="Promotion at same company"
                    >
                      ↑
                    </span>
                  )}
                  {formatRange(item.startDate, item.endDate)}
                </span>
                {item.engagement && (
                  <span className="timeline-engagement">{item.engagement}</span>
                )}
              </div>
              <div className="timeline-body">
                <h3>
                  {item.role}
                  {!isPromotion && (
                    <>
                      {" · "}
                      <span className="company">{item.company}</span>
                    </>
                  )}
                </h3>
                {!isPromotion && <p>{item.companyDescription}</p>}
                {item.skills && item.skills.length > 0 && (
                  <ul className="entry-skills">
                    {item.skills.map((skill) => (
                      <li key={skill}>{skill}</li>
                    ))}
                  </ul>
                )}
                {item.assignments && item.assignments.length > 0 && (
                  <details className="assignments">
                    <summary>
                      {item.assignments.length} assignment
                      {item.assignments.length === 1 ? "" : "s"}
                    </summary>
                    <ol className="assignments-list">
                      {item.assignments.map((a, j) => {
                        const prevA = item.assignments![j - 1];
                        const aIsPromotion =
                          !!prevA && sameName(prevA.client, a.client);
                        return (
                          <li
                            key={`${a.client}-${a.startDate}`}
                            className={
                              aIsPromotion
                                ? "assignment-item assignment-promotion"
                                : "assignment-item"
                            }
                          >
                            <div className="assignment-meta">
                              {aIsPromotion && (
                                <span
                                  className="promotion-icon"
                                  aria-label="Promotion at same client"
                                >
                                  ↑
                                </span>
                              )}
                              {formatRange(a.startDate, a.endDate)}
                            </div>
                            <div className="assignment-body">
                              <h4>
                                {a.role}
                                {!aIsPromotion && (
                                  <>
                                    {" · "}
                                    <span className="company">{a.client}</span>
                                  </>
                                )}
                              </h4>
                              {!aIsPromotion && <p>{a.clientDescription}</p>}
                              {a.skills && a.skills.length > 0 && (
                                <ul className="entry-skills">
                                  {a.skills.map((skill) => (
                                    <li key={skill}>{skill}</li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ol>
                  </details>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </Section>
  );
}
