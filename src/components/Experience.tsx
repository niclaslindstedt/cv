import type {
  Assignment,
  Company,
  Experience as ExperienceItem,
} from "../data/cv.types";
import { formatRange } from "../utils/date";
import { Section } from "./Section";

type Props = {
  title: string;
  experience: ExperienceItem[];
  companies: Map<string, Company>;
  onSkillClick: (skill: string) => void;
};

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

function TerminatedIcon() {
  return (
    <svg
      className="company-terminated"
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-label="Company terminated"
      role="img"
    >
      <title>Company terminated</title>
      <path d="M6 22 V11 a6 6 0 0 1 12 0 V22 Z" />
      <line x1="12" y1="14" x2="12" y2="19" />
      <line x1="10" y1="16" x2="14" y2="16" />
    </svg>
  );
}

function CompanyLabel({ company }: { company: Company }) {
  const content = (
    <>
      {company.name}
      {company.terminated && <TerminatedIcon />}
    </>
  );
  if (company.url) {
    return (
      <a
        className="company company-link"
        href={company.url}
        target="_blank"
        rel="noopener noreferrer"
      >
        {content}
      </a>
    );
  }
  return <span className="company">{content}</span>;
}

function groupBy<T>(items: T[], keyOf: (item: T) => string): T[][] {
  const groups: T[][] = [];
  for (const item of items) {
    const last = groups[groups.length - 1];
    if (last && keyOf(last[0]) === keyOf(item)) {
      last.push(item);
    } else {
      groups.push([item]);
    }
  }
  return groups;
}

function resolveCompany(companies: Map<string, Company>, id: string): Company {
  const company = companies.get(id);
  if (!company) {
    throw new Error(`Unknown company id: ${id}`);
  }
  return company;
}

export function Experience({
  title,
  experience,
  companies,
  onSkillClick,
}: Props) {
  const groups = groupBy(experience, (e) => e.companyId);
  return (
    <Section id="experience" title={title}>
      <ol className="timeline">
        {groups.map((group) =>
          group.length === 1 ? (
            renderItem(group[0], false, companies, onSkillClick)
          ) : (
            <li
              key={`group-${group[0].companyId}-${group[0].startDate}`}
              className="timeline-group"
            >
              <ol className="timeline-group-items">
                {group.map((item, idx) =>
                  renderItem(item, idx > 0, companies, onSkillClick),
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
  companies: Map<string, Company>,
  onSkillClick: (skill: string) => void,
) {
  const company = resolveCompany(companies, item.companyId);
  return (
    <li
      key={`${item.companyId}-${item.startDate}`}
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
              <CompanyLabel company={company} />
            </>
          )}
        </h3>
        {!isPromotion && <p>{company.description}</p>}
        {item.stack && item.stack.length > 0 && (
          <ul className="entry-stack">
            {item.stack.map((tech) => (
              <li key={tech}>
                <button
                  type="button"
                  className="entry-stack-btn"
                  onClick={() => onSkillClick(tech)}
                >
                  {tech}
                </button>
              </li>
            ))}
          </ul>
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
        {item.assignments && item.assignments.length > 0 && (
          <details className="assignments">
            <summary>
              {item.assignments.length} assignment
              {item.assignments.length === 1 ? "" : "s"}
            </summary>
            <AssignmentList
              assignments={item.assignments}
              companies={companies}
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
  companies,
  onSkillClick,
}: {
  assignments: Assignment[];
  companies: Map<string, Company>;
  onSkillClick: (skill: string) => void;
}) {
  const groups = groupBy(assignments, (a) => a.clientId);
  return (
    <ol className="assignments-list">
      {groups.map((group) =>
        group.length === 1 ? (
          renderAssignment(group[0], false, companies, onSkillClick)
        ) : (
          <li
            key={`agroup-${group[0].clientId}-${group[0].startDate}`}
            className="assignment-group"
          >
            <ol className="assignment-group-items">
              {group.map((a, idx) =>
                renderAssignment(a, idx > 0, companies, onSkillClick),
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
  companies: Map<string, Company>,
  onSkillClick: (skill: string) => void,
) {
  const client = resolveCompany(companies, a.clientId);
  return (
    <li
      key={`${a.clientId}-${a.startDate}`}
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
              <CompanyLabel company={client} />
            </>
          )}
        </h4>
        {!isPromotion && <p>{client.description}</p>}
        {a.stack && a.stack.length > 0 && (
          <ul className="entry-stack">
            {a.stack.map((tech) => (
              <li key={tech}>
                <button
                  type="button"
                  className="entry-stack-btn"
                  onClick={() => onSkillClick(tech)}
                >
                  {tech}
                </button>
              </li>
            ))}
          </ul>
        )}
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
