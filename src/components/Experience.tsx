import type {
  Assignment,
  Experience as ExperienceItem,
} from "../data/cv.types";
import { formatRange } from "../utils/date";
import { Section } from "./Section";

type Props = {
  experience: ExperienceItem[];
  onSkillClick: (skill: string) => void;
};

function sameName(a: string, b: string) {
  return a.toLowerCase() === b.toLowerCase();
}

function PromotionArrow() {
  return (
    <svg
      className="promotion-arrow"
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-label="Promoted"
      role="img"
    >
      <line x1="12" y1="19" x2="12" y2="5" />
      <polyline points="6 11 12 5 18 11" />
    </svg>
  );
}

function groupBy<T>(items: T[], keyOf: (item: T) => string): T[][] {
  const groups: T[][] = [];
  for (const item of items) {
    const last = groups[groups.length - 1];
    if (last && sameName(keyOf(last[0]), keyOf(item))) {
      last.push(item);
    } else {
      groups.push([item]);
    }
  }
  return groups;
}

export function Experience({ experience, onSkillClick }: Props) {
  const groups = groupBy(experience, (e) => e.company);
  return (
    <Section id="experience" title="Experience">
      <ol className="timeline">
        {groups.map((group) =>
          group.length === 1 ? (
            renderItem(group[0], false, onSkillClick)
          ) : (
            <li
              key={`group-${group[0].company}-${group[0].startDate}`}
              className="timeline-group"
            >
              <ol className="timeline-group-items">
                {group.map((item, idx) =>
                  renderItem(item, idx > 0, onSkillClick),
                )}
              </ol>
            </li>
          ),
        )}
      </ol>
    </Section>
  );
}

function renderItem(
  item: ExperienceItem,
  isPromotion: boolean,
  onSkillClick: (skill: string) => void,
) {
  return (
    <li
      key={`${item.company}-${item.startDate}`}
      className={
        isPromotion ? "timeline-item timeline-promotion" : "timeline-item"
      }
    >
      <div className="timeline-meta">
        <span>{formatRange(item.startDate, item.endDate)}</span>
        {item.engagement && (
          <span className="timeline-engagement">{item.engagement}</span>
        )}
      </div>
      <div className="timeline-body">
        <h3>
          <span className="role">{item.role}</span>
          {isPromotion && <PromotionArrow />}
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
        {item.assignments && item.assignments.length > 0 && (
          <details className="assignments">
            <summary>
              {item.assignments.length} assignment
              {item.assignments.length === 1 ? "" : "s"}
            </summary>
            <AssignmentList
              assignments={item.assignments}
              onSkillClick={onSkillClick}
            />
          </details>
        )}
      </div>
    </li>
  );
}

function AssignmentList({
  assignments,
  onSkillClick,
}: {
  assignments: Assignment[];
  onSkillClick: (skill: string) => void;
}) {
  const groups = groupBy(assignments, (a) => a.client);
  return (
    <ol className="assignments-list">
      {groups.map((group) =>
        group.length === 1 ? (
          renderAssignment(group[0], false, onSkillClick)
        ) : (
          <li
            key={`agroup-${group[0].client}-${group[0].startDate}`}
            className="assignment-group"
          >
            <ol className="assignment-group-items">
              {group.map((a, idx) =>
                renderAssignment(a, idx > 0, onSkillClick),
              )}
            </ol>
          </li>
        ),
      )}
    </ol>
  );
}

function renderAssignment(
  a: Assignment,
  isPromotion: boolean,
  onSkillClick: (skill: string) => void,
) {
  return (
    <li
      key={`${a.client}-${a.startDate}`}
      className={
        isPromotion ? "assignment-item assignment-promotion" : "assignment-item"
      }
    >
      <div className="assignment-meta">
        <span>{formatRange(a.startDate, a.endDate)}</span>
      </div>
      <div className="assignment-body">
        <h4>
          <span className="role">{a.role}</span>
          {isPromotion && <PromotionArrow />}
          {!isPromotion && (
            <>
              {" · "}
              <span className="company">{a.client}</span>
            </>
          )}
        </h4>
        {!isPromotion && <p>{a.clientDescription}</p>}
        {a.skills && a.skills.length > 0 && (
          <ul className="entry-skills">
            {a.skills.map((skill) => (
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
      </div>
    </li>
  );
}
