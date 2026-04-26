import { useEffect, useRef } from "react";

import projectStatsData from "../data/project-stats.json";
import type {
  GithubRepoRef,
  Project,
  ProjectStats,
  ProjectStatsFile,
} from "../data/cv.types";
import { formatMonth } from "../utils/date";
import { useLang } from "../utils/i18n";
import { useSwipeClose } from "../utils/useSwipeClose";

const projectStats = projectStatsData as ProjectStatsFile;

type Props = {
  project: Project | null;
  onClose: () => void;
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

export function ProjectModal({ project, onClose, onSkillClick }: Props) {
  const { t, lang, ui } = useLang();
  const modalRef = useRef<HTMLDivElement>(null);
  useSwipeClose(modalRef, !!project, onClose);

  useEffect(() => {
    if (!project) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [project, onClose]);

  useEffect(() => {
    if (!project) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [project]);

  if (!project) return null;

  const repoUrl = `https://github.com/${project.github.owner}/${project.github.repo}`;
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
    <div
      className="skill-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={ui.projectModal.detailAria(project.name)}
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className="skill-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="skill-modal-head">
          <h2 className="skill-modal-title">
            <span className="skill-modal-name">{project.name}</span>
          </h2>
          <button
            type="button"
            className="skill-modal-close"
            onClick={onClose}
            aria-label={ui.skillModal.close}
          >
            ✕
          </button>
        </header>
        <div className="skill-modal-body">
          <section className="skill-modal-detail">
            <p className="skill-modal-description">{t(project.description)}</p>
            {(dateRange || hasCommits) && (
              <dl className="project-meta">
                {dateRange && (
                  <div className="project-meta-row">
                    <dt>{ui.projectModal.active}</dt>
                    <dd>{dateRange}</dd>
                  </div>
                )}
                {hasCommits && (
                  <div className="project-meta-row">
                    <dt>{ui.projectModal.commits}</dt>
                    <dd>
                      <span className="project-commit-total">
                        {stats!.totalCommits}
                      </span>
                    </dd>
                  </div>
                )}
              </dl>
            )}
            {project.homepage && (
              <a
                className="skill-modal-link"
                href={project.homepage}
                target="_blank"
                rel="noreferrer noopener"
              >
                {ui.projectModal.visitSite}
              </a>
            )}
            {project.openSource && (
              <a
                className="skill-modal-link"
                href={repoUrl}
                target="_blank"
                rel="noreferrer noopener"
              >
                {ui.projectModal.viewOnGitHub}
              </a>
            )}
            {project.stack && project.stack.length > 0 && (
              <div className="company-modal-stack">
                <h3 className="company-modal-stack-title">
                  {ui.projectModal.stack}
                </h3>
                <ul className="entry-stack">
                  {project.stack.map((tech) => (
                    <li key={tech}>
                      <button
                        type="button"
                        className="entry-stack-btn"
                        onClick={() => onSkillClick(tech)}
                      >
                        {tech}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
