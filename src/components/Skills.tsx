import type { SkillGroup } from "../data/cv.types";
import type { SkillUsage } from "../utils/skills";
import { Section } from "./Section";

type Props = {
  title: string;
  skills: SkillGroup[];
  usages: Map<string, SkillUsage[]>;
  onSkillClick: (skill: string) => void;
};

export function Skills({ title, skills, usages, onSkillClick }: Props) {
  return (
    <Section id="skills" title={title}>
      <div className="skills">
        {skills.map((group) => (
          <div key={group.key} className="skills-group">
            <h3>{group.label}</h3>
            <ul>
              {group.items.map((skill) => {
                const used = usages.get(skill) ?? [];
                const isEmpty = used.length === 0;
                return (
                  <li key={skill}>
                    <button
                      type="button"
                      className={
                        isEmpty
                          ? "skill-pill skill-pill-btn skill-pill-empty"
                          : "skill-pill skill-pill-btn"
                      }
                      onClick={() => onSkillClick(skill)}
                    >
                      <span>{skill}</span>
                      {!isEmpty && (
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
