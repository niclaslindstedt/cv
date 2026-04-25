import type { SkillGroup } from "../data/cv.types";
import { useLang } from "../utils/i18n";
import { jobAssignmentCount, type SkillUsage } from "../utils/skills";
import { Section } from "./Section";

type Props = {
  title: string;
  skills: SkillGroup[];
  usages: Map<string, SkillUsage[]>;
  onSkillClick: (skill: string) => void;
};

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

export function Skills({ title, skills, usages, onSkillClick }: Props) {
  const { t, ui } = useLang();
  return (
    <Section id="skills" title={title}>
      <div className="skills">
        {skills.map((group) => (
          <div key={group.key} className="skills-group">
            <h3>{t(group.label)}</h3>
            <ul>
              {sortSkills(group.items, usages).map((skill) => {
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
                        <span className="skill-usage-count">{used.length}</span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </Section>
  );
}
