import projectStatsData from "../data/project-stats.json";
import type {
  GithubRepoRef,
  Project,
  ProjectStats,
  ProjectStatsFile,
} from "../data/cv.types";
import { formatMonth } from "../utils/date";
import { useLang } from "../utils/i18n";
import { Section } from "./Section";

const projectStats = projectStatsData as ProjectStatsFile;

type Props = {
  title: string;
  projects: Project[];
  onSkillClick: (skill: string) => void;
  onProjectClick: (project: Project) => void;
};

function statsKey(github: GithubRepoRef): string {
  return `${github.owner}/${github.repo}`;
}

function lookupStats(github: GithubRepoRef): ProjectStats | undefined {
  if (!projectStats?.enabled) return undefined;
  return projectStats.projects?.[statsKey(github)];
}

function isoToYearMonth(iso: string): string {
  return iso.slice(0, 7);
}

export function Projects({
  title,
  projects,
  onSkillClick,
  onProjectClick,
}: Props) {
  const { t, lang, ui } = useLang();
  return (
    <Section id="projects" title={title}>
      <div className="projects">
        {projects.map((project) => {
          const stats = lookupStats(project.github);
          const dateRange =
            stats && stats.firstCommitDate && stats.lastCommitDate
              ? `${formatMonth(isoToYearMonth(stats.firstCommitDate), lang)} – ${formatMonth(
                  isoToYearMonth(stats.lastCommitDate),
                  lang,
                )}`
              : null;
          const hasCommits = !!stats && stats.totalCommits > 0;
          return (
            <article key={project.name} className="project">
              <header className="project-head">
                <h3>
                  <button
                    type="button"
                    className="project-name-btn"
                    onClick={() => onProjectClick(project)}
                    aria-label={ui.projectModal.detailAria(project.name)}
                  >
                    {project.name}
                  </button>
                  {project.openSource && (
                    <span className="project-pill project-pill-oss">
                      open source
                    </span>
                  )}
                </h3>
                <p className="project-tagline">{t(project.tagline)}</p>
              </header>
              {(dateRange || hasCommits) && (
                <dl className="project-meta">
                  {dateRange && (
                    <div className="project-meta-row">
                      <dt>{lang === "sv" ? "Aktiv" : "Active"}</dt>
                      <dd>{dateRange}</dd>
                    </div>
                  )}
                  {hasCommits && (
                    <div className="project-meta-row">
                      <dt>Commits</dt>
                      <dd>
                        <span className="project-commit-total">
                          {stats!.totalCommits}
                        </span>
                      </dd>
                    </div>
                  )}
                </dl>
              )}
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
              <span className="glass-reflect" aria-hidden="true" />
            </article>
          );
        })}
      </div>
    </Section>
  );
}
