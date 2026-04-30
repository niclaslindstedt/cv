import { useEffect, useRef } from "react";

import projectStatsData from "../data/project-stats.json";
import type { Project, ProjectStatsFile } from "../data/cv.types";
import { useLang } from "../utils/i18n";
import { renderInlineCode } from "../utils/inlineCode";
import { aggregateProjectStats } from "../utils/projectStats";
import { useBodyScrollLock } from "../utils/useBodyScrollLock";
import { useModalFocus } from "../utils/useModalFocus";
import { useSwipeClose } from "../utils/useSwipeClose";
import { ProjectDateChip } from "./ProjectDateChip";

const projectStats = projectStatsData as ProjectStatsFile;

type Props = {
  project: Project | null;
  onClose: () => void;
  onSkillClick: (skill: string) => void;
};

export function ProjectModal({ project, onClose, onSkillClick }: Props) {
  const { t, lang, ui } = useLang();
  const modalRef = useRef<HTMLDivElement>(null);
  useSwipeClose(modalRef, !!project, onClose);
  useModalFocus(modalRef, !!project);
  useBodyScrollLock(!!project);

  useEffect(() => {
    if (!project) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [project, onClose]);

  if (!project) return null;

  const primaryRepo = project.github[0];
  const repoUrl = `https://github.com/${primaryRepo.owner}/${primaryRepo.repo}`;
  const dockerHubUrl = project.dockerHub
    ? project.dockerHub.includes("/")
      ? `https://hub.docker.com/r/${project.dockerHub}`
      : `https://hub.docker.com/_/${project.dockerHub}`
    : null;
  const cratesIoUrl = project.cratesIo
    ? `https://crates.io/crates/${project.cratesIo}`
    : null;
  const pypiUrl = project.pypi
    ? `https://pypi.org/project/${project.pypi}/`
    : null;
  const npmUrl = project.npm
    ? `https://www.npmjs.com/package/${project.npm}`
    : null;
  const nugetUrl = project.nuget
    ? `https://www.nuget.org/packages/${project.nuget}/`
    : null;
  const hasRegistryLinks = !!(
    dockerHubUrl ||
    cratesIoUrl ||
    pypiUrl ||
    npmUrl ||
    nugetUrl
  );
  const stats = aggregateProjectStats(project.github, projectStats);
  const hasDateRange = !!(
    stats &&
    stats.firstCommitDate &&
    stats.lastCommitDate
  );
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
            <p className="skill-modal-description">
              {renderInlineCode(t(project.description))}
            </p>
            {(hasDateRange || hasCommits) && (
              <dl className="project-meta">
                {hasDateRange && (
                  <div className="project-meta-row">
                    <dt>{ui.projectModal.active}</dt>
                    <dd>
                      <ProjectDateChip
                        iso={stats!.firstCommitDate!}
                        lang={lang}
                      />
                      <span className="project-date-sep" aria-hidden="true">
                        –
                      </span>
                      <ProjectDateChip
                        iso={stats!.lastCommitDate!}
                        lang={lang}
                      />
                    </dd>
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
            {(project.homepage || project.openSource || hasRegistryLinks) && (
              <div className="project-modal-actions">
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
                {dockerHubUrl && (
                  <a
                    className="skill-modal-link"
                    href={dockerHubUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    {ui.projectModal.viewOnDockerHub}
                  </a>
                )}
                {cratesIoUrl && (
                  <a
                    className="skill-modal-link"
                    href={cratesIoUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    {ui.projectModal.viewOnCratesIo}
                  </a>
                )}
                {pypiUrl && (
                  <a
                    className="skill-modal-link"
                    href={pypiUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    {ui.projectModal.viewOnPyPI}
                  </a>
                )}
                {npmUrl && (
                  <a
                    className="skill-modal-link"
                    href={npmUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    {ui.projectModal.viewOnNpm}
                  </a>
                )}
                {nugetUrl && (
                  <a
                    className="skill-modal-link"
                    href={nugetUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    {ui.projectModal.viewOnNuGet}
                  </a>
                )}
              </div>
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
            {project.skills.length > 0 && (
              <div className="company-modal-stack">
                <h3 className="company-modal-stack-title">
                  {ui.projectModal.skills}
                </h3>
                <ul className="entry-skills">
                  {project.skills.map((skill) => (
                    <li key={skill}>
                      <button
                        type="button"
                        className="entry-skill-btn"
                        onClick={() => onSkillClick(skill)}
                      >
                        {skill}
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
