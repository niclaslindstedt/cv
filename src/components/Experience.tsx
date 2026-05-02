import type {
  Assignment,
  Company,
  Experience as ExperienceItem,
  RoleTenure,
} from "../data/cv.types";
import { formatRange } from "../utils/date";
import { useLang, type LanguageContextValue } from "../utils/i18n";
import { stackEntries } from "../utils/stack";
import { CategoryGlyph } from "./CategoryGlyph";
import type { ExperienceModalData } from "./ExperienceModal";
import { NoteIcon } from "./NoteIcon";
import { Section } from "./Section";

type Props = {
  title: string;
  experience: ExperienceItem[];
  companies: Map<string, Company>;
  onSkillClick: (skill: string) => void;
  onCompanyClick: (company: Company) => void;
  onCardClick: (data: ExperienceModalData) => void;
};

function PromotionArrow({ ui }: { ui: LanguageContextValue["ui"] }) {
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
      aria-label={ui.experience.promoted}
      role="img"
    >
      <line x1="12" y1="19" x2="12" y2="5" />
      <polyline points="6 11 12 5 18 11" />
    </svg>
  );
}

function RoleStartIcon({ ui }: { ui: LanguageContextValue["ui"] }) {
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
      aria-label={ui.experience.startingRole}
      role="img"
    >
      <circle cx="12" cy="12" r="4" />
    </svg>
  );
}

function TerminatedIcon({ ui }: { ui: LanguageContextValue["ui"] }) {
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
      aria-label={ui.companyModal.terminated}
      role="img"
    >
      <path d="M6 20 V9 a6 6 0 0 1 12 0 V20 Z" />
      <line x1="12" y1="12" x2="12" y2="17" />
      <line x1="10" y1="14" x2="14" y2="14" />
    </svg>
  );
}

function CompanyButton({
  company,
  onClick,
  stopPropagation,
}: {
  company: Company;
  onClick: (company: Company) => void;
  stopPropagation?: boolean;
}) {
  const { ui } = useLang();
  return (
    <button
      type="button"
      className="company company-btn"
      onClick={(e) => {
        if (stopPropagation) e.stopPropagation();
        onClick(company);
      }}
    >
      {company.name}
      {company.terminated && <TerminatedIcon ui={ui} />}
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
  const { lang, t, ui } = useLang();
  // The newest role is already shown in the title, so only render the
  // promotion history below it: older roles, newest of those first, with the
  // original starting role at the bottom.
  const olderRoles = sortRolesAsc(roles).slice(0, -1);
  const reversed = [...olderRoles].reverse();
  return (
    <ol className="role-chain">
      {reversed.map((r, idx) => {
        const isOldest = idx === reversed.length - 1;
        return (
          <li key={`${r.startDate}-${r.title.en}`} className="role-chain-item">
            {isOldest ? <RoleStartIcon ui={ui} /> : <PromotionArrow ui={ui} />}
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
  onCardClick,
}: Props) {
  return (
    <Section id="experience" title={title} category="experience">
      <ol className="timeline">
        {experience.map((item) => (
          <ExperienceItemView
            key={`${item.companyId}-${item.startDate}`}
            item={item}
            companies={companies}
            onSkillClick={onSkillClick}
            onCompanyClick={onCompanyClick}
            onCardClick={onCardClick}
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
  onCardClick,
}: {
  item: ExperienceItem;
  companies: Map<string, Company>;
  onSkillClick: (skill: string) => void;
  onCompanyClick: (company: Company) => void;
  onCardClick: (data: ExperienceModalData) => void;
}) {
  const { lang, t, ui } = useLang();
  const company = resolveCompany(companies, item.companyId);
  const stack = stackEntries(item.stack ?? company.stack).filter(
    (tech) => !tech.unused,
  );
  const isActive = item.endDate === null;
  const sortedRoles = sortRolesAsc(item.roles);
  const newestRole = sortedRoles[sortedRoles.length - 1];
  const hasPromotion = sortedRoles.length > 1;
  const classes = ["timeline-item"];
  if (isActive) classes.push("is-active");
  const open = () => onCardClick({ kind: "experience", item, company });
  const titleText = sortedRoles.map((r) => t(r.title)).join(" → ");
  return (
    <li className={classes.join(" ")} onClick={open}>
      <span className="card-glyph-bar" aria-hidden="true">
        <CategoryGlyph category="experience" />
      </span>
      {isActive && <span className="active-badge">{ui.present}</span>}
      <div className="timeline-body">
        <h3 className="timeline-title">
          {hasPromotion && <PromotionArrow ui={ui} />}
          <button
            type="button"
            className="timeline-role-btn"
            onClick={(e) => {
              e.stopPropagation();
              open();
            }}
            aria-label={ui.experienceModal.detailAria(titleText)}
          >
            <span className="role">{t(newestRole.title)}</span>
          </button>
          {" · "}
          <CompanyButton
            company={company}
            onClick={(c) => onCompanyClick(c)}
            stopPropagation
          />
        </h3>
        <div className="timeline-meta">
          <span>{formatRange(item.startDate, item.endDate, lang)}</span>
          {item.engagement && (
            <span className="timeline-engagement">{t(item.engagement)}</span>
          )}
        </div>
        {hasPromotion && <RoleChain roles={sortedRoles} />}
        <p>{t(item.jobDescription ?? company.tagline)}</p>
        {stack.length > 0 && (
          <ul className="entry-stack">
            {stack.map((tech) => (
              <li key={tech.name}>
                <button
                  type="button"
                  className="entry-stack-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSkillClick(tech.name);
                  }}
                >
                  {tech.name}
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
          <details className="assignments" onClick={(e) => e.stopPropagation()}>
            <summary>
              {ui.experience.assignmentsSummary(item.assignments.length)}
            </summary>
            <AssignmentList
              assignments={item.assignments}
              parentCompany={company}
              companies={companies}
              onSkillClick={onSkillClick}
              onCompanyClick={onCompanyClick}
              onCardClick={onCardClick}
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
  parentCompany,
  companies,
  onSkillClick,
  onCompanyClick,
  onCardClick,
}: {
  assignments: Assignment[];
  parentCompany: Company;
  companies: Map<string, Company>;
  onSkillClick: (skill: string) => void;
  onCompanyClick: (company: Company) => void;
  onCardClick: (data: ExperienceModalData) => void;
}) {
  const sorted = [...assignments].sort((a, b) =>
    b.startDate.localeCompare(a.startDate),
  );
  return (
    <ol className="assignments-list">
      {sorted.map((a) => (
        <AssignmentItemView
          key={`${a.clientId}-${a.startDate}`}
          assignment={a}
          parentCompany={parentCompany}
          companies={companies}
          onSkillClick={onSkillClick}
          onCompanyClick={onCompanyClick}
          onCardClick={onCardClick}
        />
      ))}
    </ol>
  );
}

function AssignmentItemView({
  assignment: a,
  parentCompany,
  companies,
  onSkillClick,
  onCompanyClick,
  onCardClick,
}: {
  assignment: Assignment;
  parentCompany: Company;
  companies: Map<string, Company>;
  onSkillClick: (skill: string) => void;
  onCompanyClick: (company: Company) => void;
  onCardClick: (data: ExperienceModalData) => void;
}) {
  const { lang, t, ui } = useLang();
  const client = resolveCompany(companies, a.clientId);
  const stack = stackEntries(a.stack).filter((tech) => !tech.unused);
  const isActive = a.endDate === null;
  const sortedRoles = sortRolesAsc(a.roles);
  const newestRole = sortedRoles[sortedRoles.length - 1];
  const hasPromotion = sortedRoles.length > 1;
  const classes = ["assignment-item"];
  if (isActive) classes.push("is-active");
  const open = () =>
    onCardClick({ kind: "assignment", item: a, client, via: parentCompany });
  const titleText = sortedRoles.map((r) => t(r.title)).join(" → ");
  return (
    <li
      className={classes.join(" ")}
      onClick={(e) => {
        e.stopPropagation();
        open();
      }}
    >
      {isActive && <span className="active-badge">{ui.present}</span>}
      <div className="assignment-body">
        <h4 className="assignment-title">
          {hasPromotion && <PromotionArrow ui={ui} />}
          <button
            type="button"
            className="timeline-role-btn"
            onClick={(e) => {
              e.stopPropagation();
              open();
            }}
            aria-label={ui.experienceModal.assignmentAria(titleText)}
          >
            <span className="role">{t(newestRole.title)}</span>
          </button>
          {" · "}
          <CompanyButton
            company={client}
            onClick={(c) => onCompanyClick(c)}
            stopPropagation
          />
        </h4>
        <div className="assignment-meta">
          <span>{formatRange(a.startDate, a.endDate, lang)}</span>
        </div>
        {hasPromotion && <RoleChain roles={sortedRoles} />}
        <p>{t(a.jobDescription ?? client.tagline)}</p>
        {stack.length > 0 && (
          <ul className="entry-stack">
            {stack.map((tech) => (
              <li key={tech.name}>
                <button
                  type="button"
                  className="entry-stack-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSkillClick(tech.name);
                  }}
                >
                  {tech.name}
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
