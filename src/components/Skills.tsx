import type { CSSProperties } from "react";

import type { SkillGroup } from "../data/cv.types";
import { useLang } from "../utils/i18n";
import { jobAssignmentCount, type SkillUsage } from "../utils/skills";
import { Section } from "./Section";
import { SkillGroupGlyph } from "./SkillGroupGlyph";

type Props = {
  title: string;
  skills: SkillGroup[];
  usages: Map<string, SkillUsage[]>;
  hiddenSkills: Set<string>;
  onSkillClick: (skill: string) => void;
};

// Colour assignments for each skill group. Reuses the existing --tl-* palette
// and the three skill-specific tokens (--tl-cyan / --tl-coral / --tl-steel)
// added in tokens.css. Mirrors docs/DESIGN.md §10.6.
const GROUP_RGB: Record<string, string> = {
  ai: "var(--tl-pink)",
  languages: "var(--tl-blue)",
  frameworks: "var(--tl-violet)",
  cloud: "var(--tl-cyan)",
  databases: "var(--tl-mint)",
  devops: "var(--tl-amber)",
  practices: "var(--tl-green)",
  leadership: "var(--tl-coral)",
  compliance: "var(--tl-steel)",
};

const GROUP_FG: Record<string, string> = {
  ai: "var(--tl-pink-fg)",
  languages: "var(--tl-blue-fg)",
  frameworks: "var(--tl-violet-fg)",
  cloud: "var(--tl-cyan-fg)",
  databases: "var(--tl-mint-fg)",
  devops: "var(--tl-amber-fg)",
  practices: "var(--tl-green-fg)",
  leadership: "var(--tl-coral-fg)",
  compliance: "var(--tl-steel-fg)",
};

function groupStyle(key: string): CSSProperties | undefined {
  const rgb = GROUP_RGB[key];
  const fg = GROUP_FG[key];
  if (!rgb) return undefined;
  return {
    "--cat-rgb": rgb,
    "--cat-fg": fg ?? rgb,
  } as CSSProperties;
}

function sortSkills(
  items: string[],
  usages: Map<string, SkillUsage[]>,
): string[] {
  return [...items]
    .map((skill, index) => ({
      skill,
      index,
      count: jobAssignmentCount(usages.get(skill) ?? []),
    }))
    .sort((a, b) => {
      if (a.count !== b.count) return b.count - a.count;
      return a.index - b.index;
    })
    .map((entry) => entry.skill);
}

export function Skills({
  title,
  skills,
  usages,
  hiddenSkills,
  onSkillClick,
}: Props) {
  const { t, ui } = useLang();
  return (
    <Section id="skills" title={title}>
      <div className="skills">
        {skills.map((group) => {
          const visibleItems = group.items.filter((s) => !hiddenSkills.has(s));
          if (visibleItems.length === 0) return null;
          const style = groupStyle(group.key);
          return (
            <div
              key={group.key}
              className="skills-group"
              data-group={group.key}
              style={style}
            >
              <h3 className="skills-group-title">
                <span className="skills-group-glyph" aria-hidden="true">
                  <SkillGroupGlyph group={group.key} />
                </span>
                <span>{t(group.label)}</span>
              </h3>
              <ul>
                {sortSkills(visibleItems, usages).map((skill) => {
                  const used = usages.get(skill) ?? [];
                  const isPersonal = used.length === 0;
                  return (
                    <li key={skill}>
                      <button
                        type="button"
                        className={
                          isPersonal
                            ? "skill-pill skill-pill-btn skill-pill-personal"
                            : "skill-pill skill-pill-btn"
                        }
                        onClick={() => onSkillClick(skill)}
                        title={
                          isPersonal
                            ? ui.skills.personalInterestTooltip
                            : undefined
                        }
                        aria-label={
                          isPersonal
                            ? `${skill} — ${ui.skills.personalInterest}`
                            : undefined
                        }
                      >
                        <span>{skill}</span>
                        {isPersonal ? (
                          <span className="skill-personal-badge">
                            {ui.skills.personalInterest}
                          </span>
                        ) : (
                          <span className="skill-usage-count">
                            {used.length}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </Section>
  );
}
