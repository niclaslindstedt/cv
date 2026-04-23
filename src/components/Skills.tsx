import type { Skills as SkillsData } from "../data/cv.types";
import type { SkillUsage } from "../utils/skills";
import { Section } from "./Section";

type Props = {
  skills: SkillsData;
  usages: Map<string, SkillUsage[]>;
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

const KIND_LABELS: Record<SkillUsage["kind"], string> = {
  project: "Project",
  experience: "Role",
  assignment: "Assignment",
  education: "Education",
};

export function Skills({ skills, usages }: Props) {
  return (
    <Section id="skills" title="Skills">
      <div className="skills">
        {GROUPS.map((group) => (
          <div key={group.key} className="skills-group">
            <h3>{group.label}</h3>
            <ul>
              {skills[group.key].map((skill) => {
                const used = usages.get(skill) ?? [];
                return (
                  <li key={skill}>
                    {used.length > 0 ? (
                      <details className="skill-pill">
                        <summary>
                          {skill}
                          <span className="skill-usage-count">
                            {used.length}
                          </span>
                        </summary>
                        <ul className="skill-usage-list">
                          {used.map((u, i) => (
                            <li key={`${u.kind}-${u.label}-${i}`}>
                              <span className="skill-usage-kind">
                                {KIND_LABELS[u.kind]}
                              </span>
                              <span>{u.label}</span>
                            </li>
                          ))}
                        </ul>
                      </details>
                    ) : (
                      <span className="skill-pill skill-pill-empty">
                        {skill}
                      </span>
                    )}
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
