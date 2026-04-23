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
        <a href={cv.links.github} target="_blank" rel="noreferrer">
          GitHub
        </a>
        <a href={cv.links.linkedin} target="_blank" rel="noreferrer">
          LinkedIn
        </a>
      </div>
    </header>
  );
}
