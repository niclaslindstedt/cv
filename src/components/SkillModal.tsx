import { useEffect } from "react";

import { formatRange } from "../utils/date";
import {
  formatYearsOfExperience,
  yearsOfExperience,
  type SkillUsage,
} from "../utils/skills";

type Props = {
  skill: string | null;
  usages: SkillUsage[];
  onClose: () => void;
};

const KIND_LABELS: Record<SkillUsage["kind"], string> = {
  project: "Project",
  experience: "Role",
  assignment: "Assignment",
  education: "Education",
};

const KIND_ORDER: Record<SkillUsage["kind"], number> = {
  assignment: 0,
  experience: 1,
  education: 2,
  project: 3,
};

function sortUsages(usages: SkillUsage[]): SkillUsage[] {
  return [...usages].sort((a, b) => {
    const ad = a.startDate ?? "";
    const bd = b.startDate ?? "";
    if (ad && bd && ad !== bd) return bd.localeCompare(ad);
    if (ad && !bd) return -1;
    if (!ad && bd) return 1;
    return KIND_ORDER[a.kind] - KIND_ORDER[b.kind];
  });
}

export function SkillModal({ skill, usages, onClose }: Props) {
  useEffect(() => {
    if (!skill) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [skill, onClose]);

  useEffect(() => {
    if (!skill) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [skill]);

  if (!skill) return null;

  const years = yearsOfExperience(usages);
  const sorted = sortUsages(usages);

  return (
    <div
      className="skill-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={`${skill} usage`}
      onClick={onClose}
    >
      <div className="skill-modal" onClick={(e) => e.stopPropagation()}>
        <header className="skill-modal-head">
          <h2 className="skill-modal-title">
            <span className="skill-modal-name">{skill}</span>
            {years > 0 && (
              <span className="skill-modal-years">
                {formatYearsOfExperience(years)}
              </span>
            )}
          </h2>
          <button
            type="button"
            className="skill-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </header>
        {sorted.length > 0 ? (
          <ul className="skill-modal-list">
            {sorted.map((u, i) => (
              <li
                key={`${u.kind}-${u.label}-${i}`}
                className="skill-modal-item"
              >
                <span className="skill-modal-kind">{KIND_LABELS[u.kind]}</span>
                <span className="skill-modal-label">{u.label}</span>
                {u.startDate && (
                  <span className="skill-modal-range">
                    {formatRange(u.startDate, u.endDate ?? null)}
                  </span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="skill-modal-empty">
            No recorded usage in experience, assignments, or education yet.
          </p>
        )}
      </div>
    </div>
  );
}
