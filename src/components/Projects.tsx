import type { Project } from "../data/cv.types";
import { Section } from "./Section";

type Props = {
  title: string;
  projects: Project[];
  onSkillClick: (skill: string) => void;
};

export function Projects({ title, projects, onSkillClick }: Props) {
  return (
    <Section id="projects" title={title}>
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
            {project.stack && project.stack.length > 0 && (
              <ul className="project-stack">
                {project.stack.map((tech) => (
                  <li key={tech}>
                    <button
                      type="button"
                      className="project-stack-btn"
                      onClick={() => onSkillClick(tech)}
                    >
                      {tech}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <ul className="project-skills">
              {project.skills.map((skill) => (
                <li key={skill}>
                  <button
                    type="button"
                    className="project-skill-btn"
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
