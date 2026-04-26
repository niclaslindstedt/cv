import { useEffect } from "react";

import type { Project } from "../data/cv.types";
import { useLang } from "../utils/i18n";

type Props = {
  project: Project | null;
  onClose: () => void;
};

export function ProjectModal({ project, onClose }: Props) {
  const { t, ui } = useLang();

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

  return (
    <div
      className="skill-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={ui.projectModal.detailAria(project.name)}
      onClick={onClose}
    >
      <div className="skill-modal" onClick={(e) => e.stopPropagation()}>
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
          </section>
        </div>
      </div>
    </div>
  );
}
