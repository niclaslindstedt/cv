import type { Skills as SkillsData } from "../data/cv";
import { Section } from "./Section";

type Props = { skills: SkillsData };

const GROUPS: { key: keyof SkillsData; label: string }[] = [
  { key: "ai", label: "AI" },
  { key: "languages", label: "Languages" },
  { key: "frameworks", label: "Frameworks" },
  { key: "cloud", label: "Cloud" },
  { key: "databases", label: "Databases" },
  { key: "devops", label: "DevOps" },
];

export function Skills({ skills }: Props) {
  return (
    <Section id="skills" title="Skills">
      <div className="skills">
        {GROUPS.map((group) => (
          <div key={group.key} className="skills-group">
            <h3>{group.label}</h3>
            <ul>
              {skills[group.key].map((skill) => (
                <li key={skill}>{skill}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Section>
  );
}
