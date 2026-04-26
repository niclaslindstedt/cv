import type { TimelineKind } from "../data/timeline.types";

type Props = {
  kind: TimelineKind;
};

export function TrackIcon({ kind }: Props) {
  return (
    <svg
      className="timeline-vis-track-icon"
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      role="img"
    >
      {renderPaths(kind)}
    </svg>
  );
}

function renderPaths(kind: TimelineKind) {
  switch (kind) {
    case "experience":
      return (
        <>
          <rect x="2" y="7" width="20" height="14" rx="2" />
          <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
          <path d="M2 13h20" />
        </>
      );
    case "assignment":
      return (
        <>
          <rect x="8" y="2" width="8" height="4" rx="1" />
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
          <path d="M9 12h6" />
          <path d="M9 16h6" />
        </>
      );
    case "education":
      return (
        <>
          <path d="M22 10 12 5 2 10l10 5 10-5z" />
          <path d="M6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5" />
          <path d="M22 10v6" />
        </>
      );
    case "course":
      return (
        <>
          <path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z" />
          <path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z" />
        </>
      );
    case "sideProject":
      return (
        <>
          <path d="M9 18h6" />
          <path d="M10 22h4" />
          <path d="M12 2a7 7 0 0 0-4 12.7c.7.6 1 1.4 1 2.3v0h6v0c0-.9.3-1.7 1-2.3A7 7 0 0 0 12 2z" />
        </>
      );
    case "github":
      return (
        <>
          <path d="M9 19c-5 1.5-5-2.5-7-3" />
          <path d="M15 22v-4a3.4 3.4 0 0 0-1-2.6c3.1-.3 6.4-1.5 6.4-7A5.4 5.4 0 0 0 19 4.8a5 5 0 0 0-.1-3.8s-1.2-.4-4 1.5a13.4 13.4 0 0 0-7 0c-2.7-1.9-4-1.5-4-1.5A5 5 0 0 0 4.9 4.8 5.4 5.4 0 0 0 3.5 8.5c0 5.4 3.3 6.7 6.4 7A3.4 3.4 0 0 0 9 18v4" />
        </>
      );
  }
}
