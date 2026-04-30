type Props = {
  area: string;
  size?: number;
};

// Outlined SVG glyphs at the canonical 24x24 viewBox per docs/DESIGN.md §7.1.
// Stroke uses currentColor so the parent controls Aurora vs Mist tinting.
export function FocusGlyph({ area, size = 16 }: Props) {
  return (
    <svg
      className="focus-glyph"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      role="img"
    >
      {renderPaths(area)}
    </svg>
  );
}

function renderPaths(area: string) {
  switch (area) {
    case "Agentic CLI tooling":
      // Terminal window with prompt chevron and cursor underscore.
      return (
        <>
          <rect x="2.5" y="4" width="19" height="16" rx="2" />
          <path d="M2.5 8h19" />
          <path d="M6.5 12l3 2-3 2" />
          <path d="M12 16h5" />
        </>
      );
    case "Agentic orchestration":
      // Three connected nodes — a small directed graph.
      return (
        <>
          <circle cx="5" cy="6" r="2" />
          <circle cx="19" cy="6" r="2" />
          <circle cx="12" cy="18" r="2" />
          <path d="M7 6h10" />
          <path d="M6.5 8l5 8" />
          <path d="M17.5 8l-5 8" />
        </>
      );
    case "Spec-driven development":
      // Spec sheet — document with bullet/check rows.
      return (
        <>
          <path d="M6 3h9l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
          <path d="M14 3v5h5" />
          <path d="M8.5 13l1.5 1.5L13 11.5" />
          <path d="M15 14h2" />
          <path d="M8.5 18h8" />
        </>
      );
    case "Agentic coding":
      // Code brackets with a center divider — </>.
      return (
        <>
          <path d="M9 7l-5 5 5 5" />
          <path d="M15 7l5 5-5 5" />
          <path d="M13.5 5l-3 14" />
        </>
      );
    case "Cybersecurity":
      // Shield with checkmark.
      return (
        <>
          <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />
          <path d="M9 12.5l2 2 4-4" />
        </>
      );
    default:
      // Fallback — small dot so a missing mapping is visible but not loud.
      return <circle cx="12" cy="12" r="3" />;
  }
}
