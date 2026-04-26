import type {
  Assignment,
  Company,
  Experience as ExperienceItem,
  RoleTenure,
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

function RoleStartIcon() {
  return (
    <svg
      className="role-start-icon"
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-label="Starting role"
      role="img"
    >
      <circle cx="12" cy="12" r="4" />
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

function resolveCompany(companies: Map<string, Company>, id: string): Company {
  const company = companies.get(id);
  if (!company) {
    throw new Error(`Unknown company id: ${id}`);
  }
  return company;
}

// Sort ascending by startDate so [last] is the newest role.
function sortRolesAsc(roles: RoleTenure[]): RoleTenure[] {
  return [...roles].sort((a, b) => a.startDate.localeCompare(b.startDate));
}

function RoleChain({ roles }: { roles: RoleTenure[] }) {
  const { lang, t } = useLang();
  // Newest first; bottom item is the original starting role (no arrow).
  const reversed = [...sortRolesAsc(roles)].reverse();
  return (
    <ol className="role-chain">
      {reversed.map((r, idx) => {
        const isOldest = idx === reversed.length - 1;
        return (
          <li key={`${r.startDate}-${r.title.en}`} className="role-chain-item">
            {isOldest ? <RoleStartIcon /> : <PromotionArrow />}
            <span className="role-chain-content">
              <span className="role">{t(r.title)}</span>
              <span className="role-chain-meta">
                {formatRange(r.startDate, r.endDate, lang)}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function Experience({
  title,
  experience,
  companies,
  onSkillClick,
  onCompanyClick,
}: Props) {
  return (
    <Section id="experience" title={title}>
      <ol className="timeline">
        {experience.map((item) => (
          <ExperienceItemView
            key={`${item.companyId}-${item.startDate}`}
            item={item}
            companies={companies}
            onSkillClick={onSkillClick}
            onCompanyClick={onCompanyClick}
          />
        ))}
      </ol>
    </Section>
  );
}

function ExperienceItemView({
  item,
  companies,
  onSkillClick,
  onCompanyClick,
}: {
  item: ExperienceItem;
  companies: Map<string, Company>;
  onSkillClick: (skill: string) => void;
  onCompanyClick: (company: Company) => void;
}) {
  const { lang, t, ui } = useLang();
  const company = resolveCompany(companies, item.companyId);
  const stack = item.stack ?? company.stack;
  const isActive = item.endDate === null;
  const sortedRoles = sortRolesAsc(item.roles);
  const newestRole = sortedRoles[sortedRoles.length - 1];
  const hasPromotion = sortedRoles.length > 1;
  const classes = ["timeline-item"];
  if (isActive) classes.push("is-active");
  return (
    <li className={classes.join(" ")}>
      <div className="timeline-body">
        <h3 className="timeline-title">
          {hasPromotion && <PromotionArrow />}
          <span className="role">{t(newestRole.title)}</span>
          {" · "}
          <CompanyButton company={company} onClick={onCompanyClick} />
        </h3>
        <div className="timeline-meta">
          <span>{formatRange(item.startDate, item.endDate, lang)}</span>
          {item.engagement && (
            <span className="timeline-engagement">{t(item.engagement)}</span>
          )}
        </div>
        {hasPromotion && <RoleChain roles={sortedRoles} />}
        <p>{t(company.tagline)}</p>
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
  return (
    <ol className="assignments-list">
      {assignments.map((a) => (
        <AssignmentItemView
          key={`${a.clientId}-${a.startDate}`}
          assignment={a}
          companies={companies}
          onSkillClick={onSkillClick}
          onCompanyClick={onCompanyClick}
        />
      ))}
    </ol>
  );
}

function AssignmentItemView({
  assignment: a,
  companies,
  onSkillClick,
  onCompanyClick,
}: {
  assignment: Assignment;
  companies: Map<string, Company>;
  onSkillClick: (skill: string) => void;
  onCompanyClick: (company: Company) => void;
}) {
  const { lang, t } = useLang();
  const client = resolveCompany(companies, a.clientId);
  const isActive = a.endDate === null;
  const sortedRoles = sortRolesAsc(a.roles);
  const newestRole = sortedRoles[sortedRoles.length - 1];
  const hasPromotion = sortedRoles.length > 1;
  const classes = ["assignment-item"];
  if (isActive) classes.push("is-active");
  return (
    <li className={classes.join(" ")}>
      <div className="assignment-body">
        <h4 className="assignment-title">
          {hasPromotion && <PromotionArrow />}
          <span className="role">{t(newestRole.title)}</span>
          {" · "}
          <CompanyButton company={client} onClick={onCompanyClick} />
        </h4>
        <div className="assignment-meta">
          <span>{formatRange(a.startDate, a.endDate, lang)}</span>
        </div>
        {hasPromotion && <RoleChain roles={sortedRoles} />}
        <p>{t(client.tagline)}</p>
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
