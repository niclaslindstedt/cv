import { useMemo } from "react";

import projectStatsData from "../data/project-stats.json";
import type { Project, ProjectStats, ProjectStatsFile } from "../data/cv.types";
import { formatRange } from "../utils/date";
import { useLang } from "../utils/i18n";
import { aggregateProjectStats } from "../utils/projectStats";
import { stackEntries } from "../utils/stack";
import { Section } from "./Section";

const projectStats = projectStatsData as ProjectStatsFile;

const ACTIVE_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

type Props = {
  title: string;
  projects: Project[];
  onSkillClick: (skill: string) => void;
  onProjectClick: (project: Project) => void;
};

function lastCommitMs(stats: ProjectStats | undefined): number {
  if (!stats?.lastCommitDate) return -Infinity;
  const ms = Date.parse(stats.lastCommitDate);
  return Number.isFinite(ms) ? ms : -Infinity;
}

function nowMs(): number {
  return new Date().getTime();
}

export function Projects({
  title,
  projects,
  onSkillClick,
  onProjectClick,
}: Props) {
  const { t, lang, ui } = useLang();
  const decoratedProjects = useMemo(() => {
    const now = nowMs();
    return [...projects]
      .map((project) => {
        const stats = aggregateProjectStats(project.github, projectStats);
        const lastMs = lastCommitMs(stats);
        const isActive =
          Number.isFinite(lastMs) && now - lastMs <= ACTIVE_WINDOW_MS;
        return { project, stats, lastMs, isActive };
      })
      .sort((a, b) => b.lastMs - a.lastMs);
  }, [projects]);
  return (
    <Section id="projects" title={title}>
      <div className="projects">
        {decoratedProjects.map(({ project, stats, isActive }) => {
          const hasDateRange = !!(
            stats?.firstCommitDate && stats?.lastCommitDate
          );
          const classes = ["project"];
          if (isActive) classes.push("is-active");
          return (
            <article
              key={project.name}
              className={classes.join(" ")}
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
                {hasDateRange && (
                  <p className="project-dates">
                    {formatRange(
                      stats!.firstCommitDate!.slice(0, 7),
                      stats!.lastCommitDate!.slice(0, 7),
                      lang,
                    )}
                  </p>
                )}
                <p className="project-tagline">{t(project.tagline)}</p>
              </header>
              {project.stack && project.stack.length > 0 && (
                <ul className="project-stack">
                  {stackEntries(project.stack).map((tech) => (
                    <li key={tech.name}>
                      <button
                        type="button"
                        className={
                          tech.unused
                            ? "project-stack-btn project-stack-btn-unused"
                            : "project-stack-btn"
                        }
                        onClick={(e) => {
                          e.stopPropagation();
                          onSkillClick(tech.name);
                        }}
                        title={tech.unused ? ui.skills.unusedStack : undefined}
                      >
                        {tech.name}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <span className="glass-reflect" aria-hidden="true" />
            </article>
          );
        })}
      </div>
    </Section>
  );
}
