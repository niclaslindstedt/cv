import type { CV } from "../data/cv.types";

type Props = { cv: CV };

export function Hero({ cv }: Props) {
  return (
    <header className="hero">
      <p className="hero-eyebrow">{cv.title}</p>
      <h1 className="hero-name">{cv.name}</h1>
      <p className="hero-summary">{cv.summary}</p>
      <div className="hero-meta">
        <span>{cv.location}</span>
        <a
          className="hero-blog"
          href={cv.links.blog}
          target="_blank"
          rel="noreferrer"
        >
          Blog ↗
        </a>
        <a href={cv.links.github} target="_blank" rel="noreferrer">
          GitHub
        </a>
        <a href={cv.links.linkedin} target="_blank" rel="noreferrer">
          LinkedIn
        </a>
        <button
          type="button"
          className="hero-download"
          onClick={() => window.print()}
          aria-label="Download CV as PDF (opens print dialog)"
        >
          Download PDF ↓
        </button>
      </div>
    </header>
  );
}
