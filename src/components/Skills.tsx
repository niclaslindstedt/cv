import type { Skills as SkillsData } from "../data/cv.types";
import type { SkillUsage } from "../utils/skills";
import { Section } from "./Section";

type Props = {
  skills: SkillsData;
  usages: Map<string, SkillUsage[]>;
  onSkillClick: (skill: string) => void;
};

const GROUPS: { key: keyof SkillsData; label: string }[] = [
  { key: "ai", label: "AI" },
  { key: "languages", label: "Languages" },
  { key: "frameworks", label: "Frameworks" },
  { key: "cloud", label: "Cloud" },
  { key: "databases", label: "Databases" },
  { key: "devops", label: "DevOps" },
  { key: "practices", label: "Practices" },
];

export function Skills({ skills, usages, onSkillClick }: Props) {
  return (
    <Section id="skills" title="Skills">
      <div className="skills">
        {GROUPS.map((group) => (
          <div key={group.key} className="skills-group">
            <h3>{group.label}</h3>
            <ul>
              {skills[group.key].map((skill) => {
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
