import type { Project } from "../data/cv.types";
import { Section } from "./Section";

type Props = {
  projects: Project[];
  onSkillClick: (skill: string) => void;
};

export function Projects({ projects, onSkillClick }: Props) {
  return (
    <Section id="projects" title="Open-source projects">
      <div className="projects">
        {projects.map((project) => (
          <article key={project.name} className="project">
            <header className="project-head">
              <h3>
                <a href={project.repo} target="_blank" rel="noreferrer">
                  {project.name}
                </a>
              </h3>
              <p className="project-tagline">{project.tagline}</p>
            </header>
            <p className="project-description">{project.description}</p>
            <ul className="project-stack">
              {project.skills.map((skill) => (
                <li key={skill}>
                  <button
                    type="button"
                    className="project-stack-btn"
                    onClick={() => onSkillClick(skill)}
                  >
                    {skill}
                  </button>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </Section>
  );
}
