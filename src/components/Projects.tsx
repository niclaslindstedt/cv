import type { Project } from "../data/cv.types";
import { useLang } from "../utils/i18n";
import { Section } from "./Section";

type Props = {
  title: string;
  projects: Project[];
  onSkillClick: (skill: string) => void;
  onProjectClick: (project: Project) => void;
};

export function Projects({
  title,
  projects,
  onSkillClick,
  onProjectClick,
}: Props) {
  const { t, ui } = useLang();
  return (
    <Section id="projects" title={title}>
      <div className="projects">
        {projects.map((project) => {
          return (
            <article
              key={project.name}
              className="project"
              onClick={() => onProjectClick(project)}
            >
              {project.openSource && (
                <span className="project-oss-badge">open source</span>
              )}
              <header className="project-head">
                <h3>
                  <button
                    type="button"
                    className="project-name-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onProjectClick(project);
                    }}
                    aria-label={ui.projectModal.detailAria(project.name)}
                  >
                    {project.name}
                  </button>
                </h3>
                <p className="project-tagline">{t(project.tagline)}</p>
              </header>
              {project.stack && project.stack.length > 0 && (
                <ul className="project-stack">
                  {project.stack.map((tech) => (
                    <li key={tech}>
                      <button
                        type="button"
                        className="project-stack-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSkillClick(tech);
                        }}
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
                      onClick={(e) => {
                        e.stopPropagation();
                        onSkillClick(skill);
                      }}
                    >
                      {skill}
                    </button>
                  </li>
                ))}
              </ul>
              <span className="glass-reflect" aria-hidden="true" />
            </article>
          );
        })}
      </div>
    </Section>
  );
}
