import { useEffect, useRef } from "react";

import type {
  Assignment,
  Company,
  Experience as ExperienceItem,
  RoleTenure,
} from "../data/cv.types";
import {
  assignmentTimelineId,
  experienceTimelineId,
} from "../data/timeline-ids";
import { categoryStyle } from "../utils/categoryStyle";
import { formatRange } from "../utils/date";
import { useLang, type LanguageContextValue } from "../utils/i18n";
import { renderInlineCode } from "../utils/inlineCode";
import { navigate } from "../utils/route";
import { stackEntries } from "../utils/stack";
import { useBodyScrollLock } from "../utils/useBodyScrollLock";
import { useModalFocus } from "../utils/useModalFocus";
import { useModalSwipe } from "../utils/useModalSwipe";
import { CategoryGlyph } from "./CategoryGlyph";
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

function sortRolesAsc(roles: RoleTenure[]): RoleTenure[] {
  return [...roles].sort((a, b) => a.startDate.localeCompare(b.startDate));
}

function RoleChain({ roles }: { roles: RoleTenure[] }) {
  const { lang, t, ui } = useLang();
  const reversed = [...sortRolesAsc(roles)].reverse();
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

export function ExperienceModal({
  data,
  onClose,
  onSkillClick,
  onCompanyClick,
}: Props) {
  const { lang, t, ui } = useLang();
  const modalRef = useRef<HTMLDivElement>(null);
  useModalSwipe(modalRef, !!data, onClose);
  useModalFocus(modalRef, !!data);
  useBodyScrollLock(!!data);

  useEffect(() => {
    if (!data) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [data, onClose]);

  if (!data) return null;

  const isAssignment = data.kind === "assignment";
  const subject = isAssignment ? data.client : data.company;
  const item = data.item;
  const timelineId = isAssignment
    ? assignmentTimelineId(data.item)
    : experienceTimelineId(data.item);
  const sortedRoles = sortRolesAsc(item.roles);
  const newestRole = sortedRoles[sortedRoles.length - 1];
  const hasPromotion = sortedRoles.length > 1;
  const stack = stackEntries(
    item.stack ??
      (data.kind === "experience" ? data.company.stack : data.client.stack),
  ).filter((tech) => !tech.unused);
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
        className="skill-modal skill-modal--cat experience-modal"
        data-category="experience"
        style={categoryStyle("experience")}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="skill-modal-head">
          <span className="skill-modal-glyph" aria-hidden="true">
            <CategoryGlyph category="experience" size={20} />
          </span>
          <h2 className="skill-modal-title experience-modal-title">
            <span className="experience-modal-role-line">
              <span className="role">{t(newestRole.title)}</span>
            </span>
            <span className="experience-modal-subject">
              <button
                type="button"
                className="company company-btn"
                onClick={() => onCompanyClick(subject)}
              >
                {subject.name}
                {subject.terminated && <TerminatedIcon ui={ui} />}
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
        <div className="skill-modal-body" tabIndex={0}>
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
            <p className="skill-modal-description">
              {renderInlineCode(t(subject.description))}
            </p>
            {stack.length > 0 && (
              <div className="company-modal-stack">
                <h3 className="company-modal-stack-title">
                  {ui.companyModal.stack}
                </h3>
                <ul className="entry-stack">
                  {stack.map((tech) => (
                    <li key={tech.name}>
                      <button
                        type="button"
                        className="entry-stack-btn"
                        onClick={() => onSkillClick(tech.name)}
                      >
                        {tech.name}
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
            {timelineId && (
              <div className="skill-modal-actions">
                <button
                  type="button"
                  className="skill-modal-link"
                  onClick={() => {
                    onClose();
                    navigate(`/timeline#${timelineId}`);
                  }}
                >
                  {ui.timeline.seeInTimeline}
                </button>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
