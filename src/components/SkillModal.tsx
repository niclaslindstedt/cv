import { useEffect, useRef } from "react";

import type { LocalizedString, SkillDetail } from "../data/cv.types";
import { formatRange } from "../utils/date";
import { useLang } from "../utils/i18n";
import { renderInlineCode } from "../utils/inlineCode";
import {
  yearsOfExperience,
  type SkillUsage,
  type UnusedStackLocation,
} from "../utils/skills";
import { useBodyScrollLock } from "../utils/useBodyScrollLock";
import { useModalFocus } from "../utils/useModalFocus";
import { useSwipeClose } from "../utils/useSwipeClose";

function isLocalized(
  value: string | LocalizedString,
): value is LocalizedString {
  return typeof value === "object" && value !== null && "en" in value;
}

type Props = {
  skill: string | null;
  usages: SkillUsage[];
  unusedAt: UnusedStackLocation[];
  detail?: SkillDetail;
  onClose: () => void;
};

const GROUP_ORDER: SkillUsage["kind"][] = [
  "experience",
  "assignment",
  "education",
  "course",
  "project",
];

function groupByKind(
  usages: SkillUsage[],
): Record<SkillUsage["kind"], SkillUsage[]> {
  const groups: Record<SkillUsage["kind"], SkillUsage[]> = {
    experience: [],
    assignment: [],
    education: [],
    course: [],
    project: [],
  };
  for (const u of usages) groups[u.kind].push(u);
  for (const kind of GROUP_ORDER) {
    groups[kind].sort((a, b) => {
      const ad = a.startDate ?? "";
      const bd = b.startDate ?? "";
      if (ad && bd && ad !== bd) return bd.localeCompare(ad);
      if (ad && !bd) return -1;
      if (!ad && bd) return 1;
      return 0;
    });
  }
  return groups;
}

export function SkillModal({
  skill,
  usages,
  unusedAt,
  detail,
  onClose,
}: Props) {
  const { lang, t, ui } = useLang();
  const modalRef = useRef<HTMLDivElement>(null);
  useSwipeClose(modalRef, !!skill, onClose);
  useModalFocus(modalRef, !!skill);
  useBodyScrollLock(!!skill);

  const resolveLabel = (v: string | LocalizedString) =>
    isLocalized(v) ? t(v) : v;

  useEffect(() => {
    if (!skill) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [skill, onClose]);

  if (!skill) return null;

  const years = yearsOfExperience(usages);
  const groups = groupByKind(usages);

  const groupHeadings: Record<SkillUsage["kind"], string> = {
    project: ui.skillModal.projectsHeading,
    experience: ui.skillModal.jobsHeading,
    assignment: ui.skillModal.assignmentsHeading,
    education: ui.skillModal.educationHeading,
    course: ui.skillModal.coursesHeading,
  };

  const pillLabel = (u: SkillUsage): string =>
    u.kind === "course" && u.role ? t(u.role) : resolveLabel(u.label);

  const pillTooltip = (u: SkillUsage): string => {
    const parts: string[] = [];
    if (u.kind === "experience" && u.role) parts.push(t(u.role));
    if (u.kind === "assignment") {
      if (u.role) parts.push(t(u.role));
      if (u.via) parts.push(`${ui.skillModal.via} ${u.via}`);
    }
    if (u.kind === "course") parts.push(resolveLabel(u.label));
    if (u.startDate)
      parts.push(formatRange(u.startDate, u.endDate ?? null, lang));
    return parts.join(" · ");
  };

  const visibleGroups = GROUP_ORDER.filter((k) => groups[k].length > 0);

  return (
    <div
      className="skill-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={ui.skillModal.usageAria(skill)}
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className="skill-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="skill-modal-head">
          <h2 className="skill-modal-title">
            <span className="skill-modal-name">{skill}</span>
            {years > 0 && (
              <span className="skill-modal-years">
                {ui.skillModal.yearsLabel(years)}
              </span>
            )}
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
          {detail && (
            <section className="skill-modal-detail">
              <p className="skill-modal-description">
                {renderInlineCode(t(detail.description))}
              </p>
              {(detail.benefits || detail.drawbacks) && (
                <dl className="skill-modal-pros-cons">
                  {detail.benefits && (
                    <div className="skill-modal-pros">
                      <dt>{ui.skillModal.benefits}</dt>
                      <dd>{renderInlineCode(t(detail.benefits))}</dd>
                    </div>
                  )}
                  {detail.drawbacks && (
                    <div className="skill-modal-cons">
                      <dt>{ui.skillModal.drawbacks}</dt>
                      <dd>{renderInlineCode(t(detail.drawbacks))}</dd>
                    </div>
                  )}
                </dl>
              )}
              {detail.url && (
                <a
                  className="skill-modal-link"
                  href={detail.url}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  {ui.skillModal.learnMore}
                </a>
              )}
            </section>
          )}
          {visibleGroups.length > 0 ? (
            <div className="skill-modal-groups">
              {visibleGroups.map((kind) => (
                <section key={kind} className="skill-modal-group">
                  <h3 className="skill-modal-group-heading">
                    {groupHeadings[kind]}
                  </h3>
                  <ul className="skill-modal-pills">
                    {groups[kind].map((u, i) => {
                      const tip = pillTooltip(u);
                      return (
                        <li key={`${kind}-${i}`}>
                          <span
                            className="skill-modal-pill"
                            title={tip || undefined}
                          >
                            {pillLabel(u)}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))}
            </div>
          ) : unusedAt.length > 0 ? (
            <section className="skill-modal-group skill-modal-unused">
              <h3 className="skill-modal-group-heading">
                {ui.skillModal.unusedHeading}
              </h3>
              <p className="skill-modal-unused-hint">
                {ui.skillModal.unusedHint}
              </p>
              <ul className="skill-modal-pills">
                {unusedAt.map((u, i) => {
                  const parts: string[] = [];
                  if (u.role) parts.push(t(u.role));
                  if (u.via) parts.push(`${ui.skillModal.via} ${u.via}`);
                  if (u.startDate) {
                    parts.push(
                      formatRange(u.startDate, u.endDate ?? null, lang),
                    );
                  }
                  const tip = parts.join(" · ");
                  return (
                    <li key={`unused-${i}`}>
                      <span
                        className="skill-modal-pill skill-modal-pill-unused"
                        title={tip || undefined}
                      >
                        {resolveLabel(u.label)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : (
            <p className="skill-modal-empty">{ui.skillModal.empty}</p>
          )}
        </div>
      </div>
    </div>
  );
}
