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

export function Projects({ title, projects, onSkillClick }: Props) {
  const { t, lang } = useLang();
  return (
    <Section id="projects" title={title}>
      <div className="projects">
        {projects.map((project) => {
          const stats = lookupStats(project.github);
          const repoUrl = `https://github.com/${project.github.owner}/${project.github.repo}`;
          const dateRange =
            stats && stats.firstCommitDate && stats.lastCommitDate
              ? `${formatMonth(isoToYearMonth(stats.firstCommitDate), lang)} – ${formatMonth(
                  isoToYearMonth(stats.lastCommitDate),
                  lang,
                )}`
              : null;
          const topAuthors = stats ? stats.authors.slice(0, 3) : [];
          const remainingAuthors = stats
            ? Math.max(0, stats.authors.length - topAuthors.length)
            : 0;
          return (
            <article key={project.name} className="project">
              <header className="project-head">
                <h3>
                  {project.openSource ? (
                    <a href={repoUrl} target="_blank" rel="noreferrer">
                      {project.name}
                    </a>
                  ) : (
                    <span>{project.name}</span>
                  )}
                  {project.openSource && (
                    <span className="project-pill project-pill-oss">
                      open source
                    </span>
                  )}
                </h3>
                <p className="project-tagline">{t(project.tagline)}</p>
              </header>
              {(dateRange || stats) && (
                <dl className="project-meta">
                  {dateRange && (
                    <div className="project-meta-row">
                      <dt>{lang === "sv" ? "Aktiv" : "Active"}</dt>
                      <dd>{dateRange}</dd>
                    </div>
                  )}
                  {stats && stats.totalCommits > 0 && (
                    <div className="project-meta-row">
                      <dt>{lang === "sv" ? "Commits" : "Commits"}</dt>
                      <dd>
                        <span className="project-commit-total">
                          {stats.totalCommits}
                        </span>
                        {topAuthors.length > 0 && (
                          <ul className="project-authors">
                            {topAuthors.map((author) => (
                              <li
                                key={author.login ?? author.name}
                                className="project-author"
                              >
                                <span className="project-author-name">
                                  {author.login ?? author.name}
                                </span>
                                <span className="project-author-count">
                                  {author.commits}
                                </span>
                              </li>
                            ))}
                            {remainingAuthors > 0 && (
                              <li className="project-author project-author-rest">
                                {lang === "sv"
                                  ? `+${remainingAuthors} till`
                                  : `+${remainingAuthors} more`}
                              </li>
                            )}
                          </ul>
                        )}
                      </dd>
                    </div>
                  )}
                </dl>
              )}
              <p className="project-description">{t(project.description)}</p>
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
