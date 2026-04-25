import { useEffect } from "react";

import type { Company } from "../data/cv.types";
import { useLang } from "../utils/i18n";

type Props = {
  company: Company | null;
  stack: string[];
  onClose: () => void;
  onSkillClick: (skill: string) => void;
};

export function CompanyModal({ company, stack, onClose, onSkillClick }: Props) {
  const { t, ui } = useLang();

  useEffect(() => {
    if (!company) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [company, onClose]);

  useEffect(() => {
    if (!company) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [company]);

  if (!company) return null;

  return (
    <div
      className="skill-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={ui.companyModal.detailAria(company.name)}
      onClick={onClose}
    >
      <div className="skill-modal" onClick={(e) => e.stopPropagation()}>
        <header className="skill-modal-head">
          <h2 className="skill-modal-title">
            <span className="skill-modal-name">{company.name}</span>
            {company.terminated && (
              <span className="skill-modal-years">
                {ui.companyModal.terminated}
              </span>
            )}
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
            <p className="skill-modal-description">{t(company.description)}</p>
            {company.url && (
              <a
                className="skill-modal-link"
                href={company.url}
                target="_blank"
                rel="noreferrer noopener"
              >
                {ui.companyModal.visitWebsite}
              </a>
            )}
            {stack.length > 0 && (
              <div className="company-modal-stack">
                <h3 className="company-modal-stack-title">
                  {ui.companyModal.stack}
                </h3>
                <ul className="entry-stack">
                  {stack.map((tech) => (
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
