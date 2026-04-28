import { useEffect, useRef } from "react";

import type {
  Assignment,
  Company,
  Experience as ExperienceItem,
  RoleTenure,
} from "../data/cv.types";
import { formatRange } from "../utils/date";
import { useLang } from "../utils/i18n";
import { useModalFocus } from "../utils/useModalFocus";
import { useSwipeClose } from "../utils/useSwipeClose";
import { NoteIcon } from "./NoteIcon";

export type ExperienceModalData =
  | { kind: "experience"; item: ExperienceItem; company: Company }
  | {
      kind: "assignment";
      item: Assignment;
      client: Company;
      via: Company;
    };

type Props = {
  data: ExperienceModalData | null;
  onClose: () => void;
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

function sortRolesAsc(roles: RoleTenure[]): RoleTenure[] {
  return [...roles].sort((a, b) => a.startDate.localeCompare(b.startDate));
}

function RoleChain({ roles }: { roles: RoleTenure[] }) {
  const { lang, t } = useLang();
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

export function ExperienceModal({
  data,
  onClose,
  onSkillClick,
  onCompanyClick,
}: Props) {
  const { lang, t, ui } = useLang();
  const modalRef = useRef<HTMLDivElement>(null);
  useSwipeClose(modalRef, !!data, onClose);
  useModalFocus(modalRef, !!data);

  useEffect(() => {
    if (!data) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [data, onClose]);

  useEffect(() => {
    if (!data) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [data]);

  if (!data) return null;

  const isAssignment = data.kind === "assignment";
  const subject = isAssignment ? data.client : data.company;
  const item = data.item;
  const sortedRoles = sortRolesAsc(item.roles);
  const newestRole = sortedRoles[sortedRoles.length - 1];
  const hasPromotion = sortedRoles.length > 1;
  const isActive = item.endDate === null;
  const stack =
    item.stack ??
    (data.kind === "experience" ? data.company.stack : data.client.stack);
  const skills = item.skills ?? [];
  const titleText = sortedRoles.map((r) => t(r.title)).join(" → ");

  const ariaLabel = isAssignment
    ? ui.experienceModal.assignmentAria(titleText)
    : ui.experienceModal.detailAria(titleText);

  return (
    <div
      className="skill-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className="skill-modal experience-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="skill-modal-head">
          <h2 className="skill-modal-title experience-modal-title">
            <span className="experience-modal-role-line">
              <span className="role">{t(newestRole.title)}</span>
              {isActive && (
                <span className="skill-modal-years">{ui.present}</span>
              )}
            </span>
            <span className="experience-modal-subject">
              <button
                type="button"
                className="company company-btn"
                onClick={() => onCompanyClick(subject)}
              >
                {subject.name}
                {subject.terminated && <TerminatedIcon />}
              </button>
              {isAssignment && (
                <span className="experience-modal-via">
                  {ui.experienceModal.via(data.via.name)}
                </span>
              )}
            </span>
          </h2>
          <button
            type="button"
            className="skill-modal-close"
            onClick={onClose}
            aria-label={ui.skillModal.close}
          >
            ✕
          </button>
        </header>
        <div className="skill-modal-body">
          <section className="skill-modal-detail">
            <div className="timeline-meta experience-modal-meta">
              <span>{formatRange(item.startDate, item.endDate, lang)}</span>
              {data.kind === "experience" && data.item.engagement && (
                <span className="timeline-engagement">
                  {t(data.item.engagement)}
                </span>
              )}
            </div>
            {hasPromotion && <RoleChain roles={sortedRoles} />}
            <p className="experience-modal-tagline">{t(subject.tagline)}</p>
            <p className="skill-modal-description">{t(subject.description)}</p>
            {subject.url && (
              <a
                className="skill-modal-link"
                href={subject.url}
                target="_blank"
                rel="noreferrer noopener"
              >
                {ui.experienceModal.visitCompanyWebsite(subject.name)}
              </a>
            )}
            {stack && stack.length > 0 && (
              <div className="company-modal-stack">
                <h3 className="company-modal-stack-title">
                  {ui.companyModal.stack}
                </h3>
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
              </div>
            )}
            {skills.length > 0 && (
              <div className="company-modal-stack">
                <h3 className="company-modal-stack-title">
                  {ui.experienceModal.skills}
                </h3>
                <ul className="entry-skills">
                  {skills.map((skill) => (
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
              </div>
            )}
            {item.notes && (
              <p className="entry-notes">
                <NoteIcon />
                <span>{t(item.notes)}</span>
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
