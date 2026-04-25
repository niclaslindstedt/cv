import type {
  Assignment,
  Company,
  Experience as ExperienceItem,
} from "../data/cv.types";
import { formatRange } from "../utils/date";
import { useLang } from "../utils/i18n";
import { NoteIcon } from "./NoteIcon";
import { Section } from "./Section";

type Props = {
  title: string;
  experience: ExperienceItem[];
  companies: Map<string, Company>;
  onSkillClick: (skill: string) => void;
  onCompanyClick: (company: Company) => void;
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
      <path d="M6 20 V9 a6 6 0 0 1 12 0 V20 Z" />
      <line x1="12" y1="12" x2="12" y2="17" />
      <line x1="10" y1="14" x2="14" y2="14" />
    </svg>
  );
}

function CompanyButton({
  company,
  onClick,
}: {
  company: Company;
  onClick: (company: Company) => void;
}) {
  return (
    <button
      type="button"
      className="company company-btn"
      onClick={() => onClick(company)}
    >
      {company.name}
      {company.terminated && <TerminatedIcon />}
    </button>
  );
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
  onCompanyClick,
}: Props) {
  const groups = groupBy(experience, (e) => e.companyId);
  return (
    <Section id="experience" title={title}>
      <ol className="timeline">
        {groups.map((group) =>
          group.length === 1 ? (
            <ExperienceItemView
              key={`${group[0].companyId}-${group[0].startDate}`}
              item={group[0]}
              isPromotion={false}
              companies={companies}
              onSkillClick={onSkillClick}
              onCompanyClick={onCompanyClick}
            />
          ) : (
            <li
              key={`group-${group[0].companyId}-${group[0].startDate}`}
              className="timeline-group"
            >
              <ol className="timeline-group-items">
                {group.map((item, idx) => (
                  <ExperienceItemView
                    key={`${item.companyId}-${item.startDate}`}
                    item={item}
                    isPromotion={idx > 0}
                    companies={companies}
                    onSkillClick={onSkillClick}
                    onCompanyClick={onCompanyClick}
                  />
                ))}
              </ol>
            </li>
          ),
        )}
      </ol>
    </Section>
  );
}

function ExperienceItemView({
  item,
  isPromotion,
  companies,
  onSkillClick,
  onCompanyClick,
}: {
  item: ExperienceItem;
  isPromotion: boolean;
  companies: Map<string, Company>;
  onSkillClick: (skill: string) => void;
  onCompanyClick: (company: Company) => void;
}) {
  const { lang, t, ui } = useLang();
  const company = resolveCompany(companies, item.companyId);
  const stack = item.stack ?? company.stack;
  const isActive = item.endDate === null;
  const classes = ["timeline-item"];
  if (isPromotion) classes.push("timeline-promotion");
  if (isActive) classes.push("is-active");
  return (
    <li className={classes.join(" ")}>
      <div className="timeline-body">
        <h3 className="timeline-title">
          <span className="role">{t(item.role)}</span>
          {isPromotion && <PromotionArrow />}
          {!isPromotion && (
            <>
              {" · "}
              <CompanyButton company={company} onClick={onCompanyClick} />
            </>
          )}
        </h3>
        <div className="timeline-meta">
          <span>{formatRange(item.startDate, item.endDate, lang)}</span>
          {item.engagement && (
            <span className="timeline-engagement">{t(item.engagement)}</span>
          )}
        </div>
        {!isPromotion && <p>{t(company.tagline)}</p>}
        {stack && stack.length > 0 && (
          <ul className="entry-stack">
            {stack.map((tech) => (
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
        {item.notes && (
          <p className="entry-notes">
            <NoteIcon />
            <span>{t(item.notes)}</span>
          </p>
        )}
        {item.assignments && item.assignments.length > 0 && (
          <details className="assignments">
            <summary>
              {ui.experience.assignmentsSummary(item.assignments.length)}
            </summary>
            <AssignmentList
              assignments={item.assignments}
              companies={companies}
              onSkillClick={onSkillClick}
              onCompanyClick={onCompanyClick}
            />
          </details>
        )}
      </div>
      <span className="glass-reflect" aria-hidden="true" />
    </li>
  );
}

function AssignmentList({
  assignments,
  companies,
  onSkillClick,
  onCompanyClick,
}: {
  assignments: Assignment[];
  companies: Map<string, Company>;
  onSkillClick: (skill: string) => void;
  onCompanyClick: (company: Company) => void;
}) {
  const groups = groupBy(assignments, (a) => a.clientId);
  return (
    <ol className="assignments-list">
      {groups.map((group) =>
        group.length === 1 ? (
          <AssignmentItemView
            key={`${group[0].clientId}-${group[0].startDate}`}
            assignment={group[0]}
            isPromotion={false}
            companies={companies}
            onSkillClick={onSkillClick}
            onCompanyClick={onCompanyClick}
          />
        ) : (
          <li
            key={`agroup-${group[0].clientId}-${group[0].startDate}`}
            className="assignment-group"
          >
            <ol className="assignment-group-items">
              {group.map((a, idx) => (
                <AssignmentItemView
                  key={`${a.clientId}-${a.startDate}`}
                  assignment={a}
                  isPromotion={idx > 0}
                  companies={companies}
                  onSkillClick={onSkillClick}
                  onCompanyClick={onCompanyClick}
                />
              ))}
            </ol>
          </li>
        ),
      )}
    </ol>
  );
}

function AssignmentItemView({
  assignment: a,
  isPromotion,
  companies,
  onSkillClick,
  onCompanyClick,
}: {
  assignment: Assignment;
  isPromotion: boolean;
  companies: Map<string, Company>;
  onSkillClick: (skill: string) => void;
  onCompanyClick: (company: Company) => void;
}) {
  const { lang, t } = useLang();
  const client = resolveCompany(companies, a.clientId);
  const isActive = a.endDate === null;
  const classes = ["assignment-item"];
  if (isPromotion) classes.push("assignment-promotion");
  if (isActive) classes.push("is-active");
  return (
    <li className={classes.join(" ")}>
      <div className="assignment-body">
        <h4 className="assignment-title">
          <span className="role">{t(a.role)}</span>
          {isPromotion && <PromotionArrow />}
          {!isPromotion && (
            <>
              {" · "}
              <CompanyButton company={client} onClick={onCompanyClick} />
            </>
          )}
        </h4>
        <div className="assignment-meta">
          <span>{formatRange(a.startDate, a.endDate, lang)}</span>
        </div>
        {!isPromotion && <p>{t(client.tagline)}</p>}
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
        {a.notes && (
          <p className="entry-notes">
            <NoteIcon />
            <span>{t(a.notes)}</span>
          </p>
        )}
      </div>
    </li>
  );
}
